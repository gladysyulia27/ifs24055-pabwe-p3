/* ToDos App: tab, transaksi, bookmark, dan kuis. */
document.addEventListener('DOMContentLoaded', () => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const storage = {
        get(key, fallback) {
            try {
                const value = localStorage.getItem(key);
                if (value === null) return fallback;
                try { return JSON.parse(value); }
                catch { return typeof fallback === 'string' ? value : fallback; }
            } catch { return fallback; }
        },
        set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
    };
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
    const today = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    // Tab navigation is driven by the `tab` query parameter so the selected
    // section can be shared/bookmarked without persisting UI state in storage.
    const tabs = $$('.tab-btn');
    const panels = $$('.tab-panel');
    function switchTab(name) {
        if (!['expense', 'bookmark', 'quiz'].includes(name)) name = 'expense';
        panels.forEach(panel => panel.classList.toggle('hidden', panel.id !== `panel-${name}`));
        tabs.forEach(tab => {
            const active = tab.dataset.target === name;
            tab.classList.toggle('bg-custom-primary', active);
            tab.classList.toggle('text-white', active);
            tab.classList.toggle('shadow-sm', active);
            tab.classList.toggle('text-gray-600', !active);
            tab.setAttribute('aria-selected', String(active));
        });
    }
    tabs.forEach(tab => tab.addEventListener('click', () => {
        const name = tab.dataset.target;
        switchTab(name);

        // Keep the current path and other query parameters while updating the
        // selected tab in-place, without adding a new browser-history entry.
        const url = new URL(window.location.href);
        url.searchParams.set('tab', name);
        window.history.replaceState(null, '', url);
    }));
    // Read the requested tab once at startup; switchTab falls back to expense
    // when the query parameter is missing or contains an unsupported value.
    switchTab(new URLSearchParams(window.location.search).get('tab'));

    // Shared accessible modal.
    const modal = $('#app-modal');
    const modalBox = $('#modal-content-box');
    function showModal(markup) {
        modalBox.innerHTML = markup;
        modal.classList.remove('hidden');
        const heading = $('h3', modalBox);
        if (heading) { heading.id = 'modal-title'; modal.setAttribute('aria-labelledby', 'modal-title'); }
        const first = $('input, select, textarea, button', modalBox);
        if (first) first.focus();
    }
    function closeModal() { modal.classList.add('hidden'); modalBox.replaceChildren(); }
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });
    function bindCancel() { $('#modal-cancel')?.addEventListener('click', closeModal); }
    // Reuse the shared frame and action buttons for both record-edit forms.
    function showEditForm(title, formId, fields) {
        showModal(`<h3 class="font-bold text-gray-800">${title}</h3><form id="${formId}" class="space-y-3">${fields}<div class="flex justify-end gap-2"><button type="button" id="modal-cancel" class="px-4 py-2 bg-gray-100 rounded-xl">Batal</button><button class="px-4 py-2 bg-custom-primary text-white rounded-xl">Simpan</button></div></form>`);
        bindCancel();
    }
    function confirmDelete(message, action) {
        showModal(`<h3 class="font-bold text-gray-800">Konfirmasi Hapus</h3><p class="text-sm text-gray-500">${message}</p><div class="flex justify-end gap-2"><button type="button" id="modal-cancel" class="px-4 py-2 bg-gray-100 rounded-xl">Batal</button><button type="button" id="modal-confirm-del" class="px-4 py-2 bg-rose-600 text-white rounded-xl">Hapus</button></div>`);
        bindCancel();
        $('#modal-confirm-del').addEventListener('click', () => { action(); closeModal(); });
    }

    // Expense tracker.
    let expenses = storage.get('todos_expenses', []);
    if (!Array.isArray(expenses)) expenses = [];
    const expenseForm = $('#form-expense');
    const expenseList = $('#expense-list');
    const categoryFilter = $('#exp-filter-category');
    const expenseFields = {
        title: $('#exp-title'), amount: $('#exp-amount'), type: $('#exp-type'),
        category: $('#exp-category'), date: $('#exp-date')
    };
    expenseFields.date.value = today();
    const rupiah = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
    function saveExpenses() { storage.set('todos_expenses', expenses); }
    function renderExpenses() {
        const categories = [...new Set(expenses.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
        const oldCategory = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">Semua Kategori</option>' + categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
        categoryFilter.value = categories.includes(oldCategory) ? oldCategory : '';
        const keyword = $('#exp-search').value.trim().toLocaleLowerCase('id');
        const type = $('#exp-filter-type').value;
        const category = categoryFilter.value;
        const sort = $('#exp-sort').value;
        const filtered = expenses.filter(item =>
            `${item.title || ''} ${item.category || ''}`.toLocaleLowerCase('id').includes(keyword) &&
            (!type || item.type === type) && (!category || item.category === category)
        );
        filtered.sort((a, b) => sort === 'oldest' ? new Date(a.date) - new Date(b.date) : sort === 'highest' ? Number(b.amount) - Number(a.amount) : sort === 'lowest' ? Number(a.amount) - Number(b.amount) : new Date(b.date) - new Date(a.date));
        const income = expenses.filter(item => item.type === 'Pemasukan').reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const spending = expenses.filter(item => item.type === 'Pengeluaran').reduce((sum, item) => sum + Number(item.amount || 0), 0);
        $('#total-income').textContent = rupiah(income);
        $('#total-expense').textContent = rupiah(spending);
        $('#total-balance').textContent = rupiah(income - spending);
        expenseList.replaceChildren();
        if (!filtered.length) {
            expenseList.innerHTML = `<div class="text-center py-8 text-gray-400 text-sm">${expenses.length ? 'Tidak ada transaksi yang cocok dengan filter.' : 'Belum ada data transaksi yang dicatat.'}</div>`;
            return;
        }
        filtered.forEach(item => {
            const row = document.createElement('div');
            row.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl';
            const incomeItem = item.type === 'Pemasukan';
            row.innerHTML = `<div><div class="flex items-center gap-2"><span class="font-semibold text-gray-800 text-sm">${escapeHtml(item.title)}</span><span class="text-xs ${incomeItem ? 'text-emerald-600' : 'text-rose-600'}">${escapeHtml(item.type)}</span></div><div class="text-xs text-gray-400">${escapeHtml(item.category)} · ${escapeHtml(item.date)}</div></div><div class="flex items-center justify-between sm:justify-end gap-3"><strong class="text-sm ${incomeItem ? 'text-emerald-600' : 'text-rose-600'}">${incomeItem ? '+' : '−'} ${rupiah(item.amount)}</strong><button class="btn-edit-exp text-sm text-blue-600" data-id="${escapeHtml(item.id)}">Ubah</button><button class="btn-del-exp text-sm text-rose-600" data-id="${escapeHtml(item.id)}">Hapus</button></div>`;
            expenseList.appendChild(row);
        });
        $$('.btn-edit-exp', expenseList).forEach(button => button.addEventListener('click', () => editExpense(button.dataset.id)));
        $$('.btn-del-exp', expenseList).forEach(button => button.addEventListener('click', () => confirmDelete('Hapus transaksi ini?', () => { expenses = expenses.filter(item => String(item.id) !== button.dataset.id); saveExpenses(); renderExpenses(); })));
    }
    expenseForm.addEventListener('submit', event => {
        event.preventDefault();
        const item = { id: String(Date.now()), title: expenseFields.title.value.trim(), amount: Number(expenseFields.amount.value), type: expenseFields.type.value, category: expenseFields.category.value.trim(), date: expenseFields.date.value };
        if (!item.title || !item.category || !item.date || !Number.isFinite(item.amount) || item.amount <= 0) { expenseForm.reportValidity(); return; }
        expenses.push(item); saveExpenses(); renderExpenses(); expenseForm.reset(); expenseFields.date.value = today();
    });
    function editExpense(id) {
        const item = expenses.find(entry => String(entry.id) === String(id)); if (!item) return;
        showEditForm('Ubah Transaksi', 'edit-exp-form', `<label class="block text-sm">Judul<input id="edit-exp-title" class="mt-1 w-full border rounded-xl p-2" required value="${escapeHtml(item.title)}"></label><label class="block text-sm">Jumlah<input id="edit-exp-amount" type="number" min="1" class="mt-1 w-full border rounded-xl p-2" required value="${Number(item.amount)}"></label><label class="block text-sm">Tipe<select id="edit-exp-type" class="mt-1 w-full border rounded-xl p-2"><option ${item.type === 'Pemasukan' ? 'selected' : ''}>Pemasukan</option><option ${item.type === 'Pengeluaran' ? 'selected' : ''}>Pengeluaran</option></select></label><label class="block text-sm">Kategori<input id="edit-exp-category" class="mt-1 w-full border rounded-xl p-2" required value="${escapeHtml(item.category)}"></label><label class="block text-sm">Tanggal<input id="edit-exp-date" type="date" class="mt-1 w-full border rounded-xl p-2" required value="${escapeHtml(item.date)}"></label>`);
        $('#edit-exp-form').addEventListener('submit', event => { event.preventDefault(); item.title = $('#edit-exp-title').value.trim(); item.amount = Number($('#edit-exp-amount').value); item.type = $('#edit-exp-type').value; item.category = $('#edit-exp-category').value.trim(); item.date = $('#edit-exp-date').value; if (!item.title || !item.category || !item.date || !Number.isFinite(item.amount) || item.amount <= 0) return; saveExpenses(); renderExpenses(); closeModal(); });
    }
    ['input', 'change'].forEach(type => { $('#exp-search').addEventListener(type, renderExpenses); $('#exp-filter-type').addEventListener(type, renderExpenses); categoryFilter.addEventListener(type, renderExpenses); $('#exp-sort').addEventListener(type, renderExpenses); });

    // Bookmark manager.
    let bookmarks = storage.get('todos_bookmarks', []);
    if (!Array.isArray(bookmarks)) bookmarks = [];
    const bookmarkForm = $('#form-bookmark');
    const validUrl = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname); } catch { return false; } };
    function saveBookmarks() { storage.set('todos_bookmarks', bookmarks); }
    function renderBookmarks() {
        const keyword = $('#bm-search').value.trim().toLocaleLowerCase('id');
        const sort = $('#bm-sort').value;
        const list = bookmarks.filter(item => `${item.title || ''} ${item.url || ''} ${item.category || ''} ${item.notes || ''}`.toLocaleLowerCase('id').includes(keyword));
        list.sort((a, b) => sort === 'za' ? b.title.localeCompare(a.title, 'id') : sort === 'newest' ? Number(b.createdAt || b.id) - Number(a.createdAt || a.id) : a.title.localeCompare(b.title, 'id'));
        const container = $('#bookmark-list'); container.replaceChildren();
        if (!list.length) { container.innerHTML = `<div class="col-span-full text-center py-8 text-gray-400 text-sm">${bookmarks.length ? 'Tidak ada bookmark yang cocok.' : 'Belum ada tautan bookmark yang tersimpan.'}</div>`; return; }
        list.forEach(item => {
            const card = document.createElement('article'); card.className = 'bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3';
            const safeUrl = validUrl(item.url) ? escapeHtml(item.url) : '#';
            card.innerHTML = `<div class="flex justify-between gap-2"><h4 class="font-semibold text-gray-800 text-sm">${escapeHtml(item.title)}</h4><span class="text-xs text-gray-500">${escapeHtml(item.category)}</span></div><a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-custom-primary hover:underline block break-all">${escapeHtml(item.url)}</a>${item.notes ? `<p class="text-xs text-gray-500">${escapeHtml(item.notes)}</p>` : ''}<div class="flex justify-end gap-3 border-t pt-2"><button class="edit-bookmark text-sm text-blue-600" data-id="${escapeHtml(item.id)}">Ubah</button><button class="delete-bookmark text-sm text-rose-600" data-id="${escapeHtml(item.id)}">Hapus</button></div>`;
            container.appendChild(card);
        });
        $$('.edit-bookmark', container).forEach(button => button.addEventListener('click', () => editBookmark(button.dataset.id)));
        $$('.delete-bookmark', container).forEach(button => button.addEventListener('click', () => confirmDelete('Hapus tautan bookmark ini?', () => { bookmarks = bookmarks.filter(item => String(item.id) !== button.dataset.id); saveBookmarks(); renderBookmarks(); })));
    }
    bookmarkForm.addEventListener('submit', event => {
        event.preventDefault(); const url = $('#bm-url').value.trim();
        if (!validUrl(url)) { $('#bm-url').setCustomValidity('URL harus menggunakan http:// atau https://'); $('#bm-url').reportValidity(); $('#bm-url').setCustomValidity(''); return; }
        bookmarks.push({ id: String(Date.now()), createdAt: Date.now(), title: $('#bm-title').value.trim(), url, category: $('#bm-category').value.trim(), notes: $('#bm-notes').value.trim() });
        saveBookmarks(); renderBookmarks(); bookmarkForm.reset();
    });
    function editBookmark(id) {
        const item = bookmarks.find(entry => String(entry.id) === String(id)); if (!item) return;
        showEditForm('Ubah Tautan Bookmark', 'edit-bookmark-form', `<label class="block text-sm">Judul<input id="edit-bm-title" class="mt-1 w-full border rounded-xl p-2" required value="${escapeHtml(item.title)}"></label><label class="block text-sm">URL<input id="edit-bm-url" class="mt-1 w-full border rounded-xl p-2" required value="${escapeHtml(item.url)}"></label><label class="block text-sm">Kategori<input id="edit-bm-category" class="mt-1 w-full border rounded-xl p-2" required value="${escapeHtml(item.category)}"></label><label class="block text-sm">Catatan<textarea id="edit-bm-notes" class="mt-1 w-full border rounded-xl p-2">${escapeHtml(item.notes)}</textarea></label>`);
        $('#edit-bookmark-form').addEventListener('submit', event => { event.preventDefault(); const url = $('#edit-bm-url').value.trim(); if (!validUrl(url)) { $('#edit-bm-url').setCustomValidity('URL harus menggunakan http:// atau https://'); $('#edit-bm-url').reportValidity(); $('#edit-bm-url').setCustomValidity(''); return; } item.title = $('#edit-bm-title').value.trim(); item.url = url; item.category = $('#edit-bm-category').value.trim(); item.notes = $('#edit-bm-notes').value.trim(); saveBookmarks(); renderBookmarks(); closeModal(); });
    }
    $('#bm-search').addEventListener('input', renderBookmarks); $('#bm-sort').addEventListener('change', renderBookmarks);

    // Five-question technology quiz.
    const questions = [
        { question: 'Apa fungsi elemen semantic <nav> pada HTML5?', options: ['Membuat garis horizontal', 'Menampung navigasi tautan situs', 'Mengatur warna latar', 'Menyimpan data database'], answer: 1 },
        { question: 'Properti CSS apa yang mengaktifkan tata letak Flexbox?', options: ['display: grid', 'display: flex', 'position: absolute', 'float: left'], answer: 1 },
        { question: 'Metode apa yang mengubah objek JavaScript menjadi string JSON?', options: ['JSON.parse()', 'JSON.stringify()', 'localStorage.getItem()', 'Array.map()'], answer: 1 },
        { question: 'Ekstensi apa yang umum dipakai untuk dokumen HTML?', options: ['.js', '.css', '.html', '.json'], answer: 2 },
        { question: 'Keyword mana yang mendeklarasikan variabel yang nilainya bisa diubah?', options: ['const', 'let', 'static', 'define'], answer: 1 }
    ];
    let questionIndex = 0, score = 0, timer = null, seconds = 15, answered = false;
    const startScreen = $('#quiz-start-screen'), questionScreen = $('#quiz-question-screen'), resultScreen = $('#quiz-result-screen');
    function loadHighScore() { $('#quiz-highscore').textContent = storage.get('todos_quiz_highscore', '0 / 5'); }
    function startQuiz() { clearInterval(timer); questionIndex = 0; score = 0; startScreen.classList.add('hidden'); resultScreen.classList.add('hidden'); questionScreen.classList.remove('hidden'); showQuestion(); }
    function showQuestion() {
        answered = false; $('#btn-next-question').classList.add('hidden');
        const question = questions[questionIndex]; $('#quiz-progress-text').textContent = `Soal ${questionIndex + 1} dari ${questions.length}`; $('#quiz-question-title').textContent = question.question;
        const options = $('#quiz-options-container'); options.replaceChildren();
        question.options.forEach((option, index) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100'; button.innerHTML = `<span>${escapeHtml(option)}</span><span class="float-right text-xs text-gray-400">Pilihan ${String.fromCharCode(65 + index)}</span>`; button.addEventListener('click', () => answerQuestion(index)); options.appendChild(button); });
        clearInterval(timer); seconds = 15; $('#quiz-timer').textContent = `Waktu: ${seconds}s`;
        timer = setInterval(() => { seconds -= 1; $('#quiz-timer').textContent = `Waktu: ${seconds}s`; if (seconds <= 0) answerQuestion(-1); }, 1000);
    }
    function answerQuestion(selected) {
        if (answered) return; answered = true; clearInterval(timer);
        const correct = questions[questionIndex].answer;
        $$('#quiz-options-container button').forEach((button, index) => { button.disabled = true; if (index === correct) button.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-700'); else if (index === selected) button.classList.add('bg-rose-50', 'border-rose-500', 'text-rose-700'); });
        if (selected === correct) score += 1;
        $('#quiz-feedback-msg').textContent = selected < 0 ? 'Waktu habis. Jawaban yang benar ditandai hijau.' : selected === correct ? 'Benar! Jawaban Anda tepat.' : 'Belum tepat. Jawaban yang benar ditandai hijau.';
        $('#btn-next-question').classList.remove('hidden');
    }
    $('#btn-next-question').addEventListener('click', () => { questionIndex += 1; if (questionIndex < questions.length) showQuestion(); else finishQuiz(); });
    function finishQuiz() {
        clearInterval(timer); questionScreen.classList.add('hidden'); resultScreen.classList.remove('hidden'); $('#quiz-final-score').textContent = `${score} / ${questions.length}`;
        $('#quiz-feedback-msg').textContent = score === questions.length ? 'Luar biasa! Semua jawaban benar.' : score >= 3 ? 'Kerja bagus! Pemahaman Anda sudah cukup baik.' : 'Terus berlatih dan pelajari kembali materinya!';
        const previous = Number(String(storage.get('todos_quiz_highscore', '0 / 5')).split('/')[0]) || 0;
        if (score > previous) storage.set('todos_quiz_highscore', `${score} / ${questions.length}`);
        loadHighScore();
    }
    $('#btn-start-quiz').addEventListener('click', startQuiz); $('#btn-restart-quiz').addEventListener('click', startQuiz);

    renderExpenses(); renderBookmarks(); loadHighScore();
});
