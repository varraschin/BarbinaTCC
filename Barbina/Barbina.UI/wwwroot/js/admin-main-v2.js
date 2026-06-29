/**
 * Barbina CMS — Painel administrativo (v3)
 * Camadas: API (fetch) → domínio → UI (render + eventos)
 *
 * Esta versão substitui o antigo armazenamento em localStorage por chamadas
 * reais à Barbina.API (.NET + MySQL). Nenhum dado de Cardápio, Ambientes,
 * Carrossel ou Reservas é mais mantido apenas no navegador: tudo é lido e
 * gravado diretamente no banco de dados.
 */
(function () {
    'use strict';

    // Mesma URL configurada em Barbina.UI/appsettings.json (ApiSettings:BaseUrl).
    const API_BASE = 'http://localhost:5058/api/';

    let currentModule = 'overview';

    /** Filtros por módulo (estado de UI — não precisa persistir entre sessões). */
    const uiState = {
        reservations: { query: '', selectedDate: todayIso() },
        menu: { query: '', category: 'all', sort: 'name' }
    };

    /** Atividades recentes exibidas na Visão Geral — feed simples da sessão atual. */
    let activities = [];

    let overviewCharts = { reservationTrend: null, menuCategories: null };

    /** Guarda os dados já carregados da Visão Geral para os gráficos (evita refazer fetch). */
    let lastOverviewData = null;

    // ---------- Camada de API ----------
    async function apiGet(path) {
        const res = await fetch(API_BASE + path);
        if (!res.ok) throw new Error(`Não foi possível carregar "${path}" (HTTP ${res.status}).`);
        if (res.status === 204) return null;
        return res.json();
    }

    async function extractErrorMessage(res) {
        try {
            const data = await res.json();
            if (data && data.message) return data.message;
            if (data && typeof data === 'object') {
                const firstKey = Object.keys(data)[0];
                if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
            }
        } catch { /* corpo não era JSON */ }
        return `Erro inesperado (HTTP ${res.status}).`;
    }

    async function apiSendForm(path, method, formData) {
        const res = await fetch(API_BASE + path, { method, body: formData });
        if (!res.ok) throw new Error(await extractErrorMessage(res));
        if (res.status === 204) return null;
        return res.json();
    }

    async function apiSendJson(path, method, data) {
        const res = await fetch(API_BASE + path, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: data !== undefined ? JSON.stringify(data) : undefined
        });
        if (!res.ok) throw new Error(await extractErrorMessage(res));
        if (res.status === 204) return null;
        return res.json();
    }

    async function apiPatch(path) {
        const res = await fetch(API_BASE + path, { method: 'PATCH' });
        if (!res.ok) throw new Error(await extractErrorMessage(res));
        if (res.status === 204) return null;
        return res.json();
    }

    async function apiDelete(path) {
        const res = await fetch(API_BASE + path, { method: 'DELETE' });
        if (!res.ok) throw new Error(await extractErrorMessage(res));
    }

    // ---------- Mapeamento API → forma usada pela UI ----------
    function mapProduto(p) {
        return { id: p.id, name: p.nome, category: p.categoriaNome, categoriaId: p.categoriaId, description: p.descricao || '' };
    }

    function mapAmbiente(a) {
        return {
            id: a.id, title: a.titulo, subtitle: a.subtitulo || '', tag: a.tag || '',
            description: a.descricao || '', image: a.foto, section: a.secao || '',
            isCarousel: !!a.isCarousel, isActive: !!a.isActive, carouselOrder: a.carouselOrder
        };
    }

    function mapReserva(r) {
        return {
            id: r.id, name: r.nome, phone: r.telefone, email: r.email || '',
            date: r.data, time: r.hora, people: r.pessoas, type: r.tipo,
            eventType: r.tipoEvento || '', ambiente: r.ambiente || '', notes: r.observacoes || '',
            confirmed: !!r.confirmada
        };
    }

    // ---------- Utilitários ----------
    function escapeHtml(text) {
        if (text == null) return '';
        const s = String(text);
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return s.replace(/[&<>"']/g, (ch) => map[ch]);
    }

    function formatDate(d) {
        // `d` é sempre uma string 'YYYY-MM-DD'. Sem o "T00:00:00", new Date(d) é
        // interpretado como meia-noite UTC, e toLocaleDateString (fuso local) pode
        // exibir o dia anterior em fusos atrás de UTC (ex.: Brasil). Forçamos o
        // parsing como horário local para exibir sempre a data correta.
        return new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR');
    }

    function debounce(fn, ms) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function todayIso() {
        const d = new Date();
        const tz = d.getTimezoneOffset() * 60000;
        return new Date(d - tz).toISOString().slice(0, 10);
    }

    function nextLocalId(list) {
        if (!list.length) return 1;
        return Math.max(...list.map((x) => x.id)) + 1;
    }

    // ---------- Feedback visual ----------
    function showToast(message, type = 'info') {
        const host = document.getElementById('toastHost');
        if (!host) {
            alert(message);
            return;
        }
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.setAttribute('role', 'status');
        el.textContent = message;
        host.appendChild(el);
        requestAnimationFrame(() => el.classList.add('toast-visible'));
        setTimeout(() => {
            el.classList.remove('toast-visible');
            setTimeout(() => el.remove(), 300);
        }, 3800);
    }

    function setLoading(on) {
        const o = document.getElementById('appLoading');
        if (o) {
            o.classList.toggle('active', !!on);
            o.setAttribute('aria-busy', on ? 'true' : 'false');
            o.setAttribute('aria-hidden', on ? 'false' : 'true');
        }
        document.body.classList.toggle('loading-active', !!on);
    }

    function addActivity(action, icon = 'fa-bell') {
        activities.unshift({
            id: nextLocalId(activities),
            action,
            user: 'admin',
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            icon
        });
        activities = activities.slice(0, 50);
    }

    // ---------- Upload de imagem (pré-visualização local apenas) ----------
    function previewFromFile(file) {
        return URL.createObjectURL(file);
    }

    // ---------- Modal genérico de ambiente (carrossel ou galeria) ----------
    async function openEnvironmentModal(forCarousel = false, envId = null) {
        let editing = null;
        let existingSections = [];
        if (envId) {
            try {
                editing = mapAmbiente(await apiGet(`ambientes/${envId}`));
            } catch (err) {
                showToast(err.message, 'error');
                return;
            }
        }
        if (!forCarousel) {
            try {
                const galeria = await apiGet('ambientes/galeria');
                galeria.forEach((a) => {
                    if (a.secao && !existingSections.includes(a.secao)) existingSections.push(a.secao);
                });
            } catch { /* sem sugestões se a API falhar; o campo continua editável normalmente */ }
        }

        const modal = document.getElementById('globalModal');
        const modalBody = document.getElementById('modalBody');
        const isCarouselModal = forCarousel;

        const carouselFields = isCarouselModal
            ? `
                <div class="form-group">
                    <label for="envTag">Texto da tag (exibida sobre a imagem)</label>
                    <input type="text" id="envTag" placeholder="Ex: Elegância &amp; Sofisticação" value="${editing ? escapeHtml(editing.tag) : ''}">
                    <small style="color:var(--gray-text);font-size:12px;">Texto pequeno exibido acima do título no slide.</small>
                </div>
                <div class="form-group">
                    <label for="envDesc">Descrição do slide</label>
                    <textarea id="envDesc" rows="3">${editing ? escapeHtml(editing.description) : ''}</textarea>
                </div>`
            : `
                <div class="form-group">
                    <label for="envSection">Seção do site *</label>
                    <input type="text" id="envSection" list="envSectionOptions" required
                           placeholder="Ex: Salão Principal, Área ao Ar Livre…"
                           value="${editing ? escapeHtml(editing.section) : ''}">
                    <datalist id="envSectionOptions">
                        ${existingSections.map((s) => `<option value="${escapeHtml(s)}"></option>`).join('')}
                    </datalist>
                    <small style="color:var(--gray-text);font-size:12px;">Define em qual bloco da página Ambientes esta imagem será exibida. Digite o nome de uma seção já existente para substituir a imagem dela, ou um nome novo para criar uma seção nova.</small>
                </div>
                <div class="form-group">
                    <label for="envSubtitle">Subtítulo do ambiente</label>
                    <input type="text" id="envSubtitle" placeholder="Ex: Tradição &amp; Conforto" value="${editing ? escapeHtml(editing.subtitle) : ''}">
                </div>
                <div class="form-group">
                    <label for="envDesc">Descrição do ambiente</label>
                    <textarea id="envDesc" rows="4">${editing ? escapeHtml(editing.description) : ''}</textarea>
                </div>`;

        modalBody.innerHTML = `
            <h2 class="modal-title">${editing ? 'Editar' : isCarouselModal ? 'Novo slide do carrossel' : 'Nova imagem da galeria'}</h2>
            <form id="envForm">
                <div class="form-group">
                    <label for="envTitle">Título *</label>
                    <input type="text" id="envTitle" value="${editing ? escapeHtml(editing.title) : ''}" required>
                </div>
                ${carouselFields}
                <div class="form-group">
                    <label>Imagem</label>
                    <div class="env-upload-row">
                        <button type="button" class="btn-secondary" id="uploadImageBtn">
                            <i class="fas fa-cloud-upload-alt"></i> Escolher do computador
                        </button>
                        <input type="file" id="imageFileInput" accept="image/*" hidden>
                    </div>
                    <div class="env-url-wrap" style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                        <span aria-hidden="true" style="font-size:18px;flex-shrink:0;">🔗</span>
                        <input type="text" id="imageUrlInput" placeholder="Cole uma URL de imagem" value="${editing && editing.image && editing.image.startsWith('http') ? escapeHtml(editing.image) : ''}" style="flex:1;">
                    </div>
                    <div id="imagePreviewArea" class="image-preview-area" style="${editing && editing.image ? '' : 'display:none'}">
                        <img id="previewImg" alt="Pré-visualização" src="${editing ? escapeHtml(editing.image || '') : ''}">
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" data-close-modal>Cancelar</button>
                    <button type="submit" class="btn-primary" id="envSaveBtn">Salvar</button>
                </div>
            </form>
        `;

        modal.classList.add('active');
        modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);

        const fileInput = document.getElementById('imageFileInput');
        const uploadBtn = document.getElementById('uploadImageBtn');
        const urlInput = document.getElementById('imageUrlInput');
        const previewArea = document.getElementById('imagePreviewArea');
        const previewImg = document.getElementById('previewImg');
        let selectedFile = null;

        uploadBtn.onclick = () => fileInput.click();

        fileInput.onchange = (e) => {
            selectedFile = e.target.files[0] || null;
            if (selectedFile) {
                previewImg.src = previewFromFile(selectedFile);
                previewArea.style.display = 'block';
                urlInput.value = '';
            }
        };

        urlInput.oninput = () => {
            if (urlInput.value) {
                selectedFile = null;
                fileInput.value = '';
                previewImg.src = urlInput.value;
                previewArea.style.display = 'block';
            } else if (!selectedFile) {
                previewArea.style.display = 'none';
            }
        };

        document.getElementById('envForm').onsubmit = async (e) => {
            e.preventDefault();
            const hasExisting = editing && editing.image;
            if (!selectedFile && !urlInput.value && !hasExisting) {
                showToast('Adicione uma imagem (arquivo ou URL).', 'warning');
                return;
            }

            const saveBtn = document.getElementById('envSaveBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando…';

            const tagVal = document.getElementById('envTag') ? document.getElementById('envTag').value.trim() : '';
            const sectionVal = document.getElementById('envSection') ? document.getElementById('envSection').value : '';
            const subtitleVal = document.getElementById('envSubtitle') ? document.getElementById('envSubtitle').value.trim() : '';
            const descVal = document.getElementById('envDesc') ? document.getElementById('envDesc').value : '';

            const form = new FormData();
            if (editing) form.append('id', String(editing.id));
            form.append('titulo', document.getElementById('envTitle').value);
            form.append('subtitulo', subtitleVal);
            form.append('tag', tagVal);
            form.append('descricao', descVal);
            form.append('secao', isCarouselModal ? '' : sectionVal);
            form.append('isCarousel', isCarouselModal ? 'true' : 'false');
            if (selectedFile) form.append('foto', selectedFile);
            else if (urlInput.value) form.append('fotoUrl', urlInput.value.trim());

            try {
                if (editing) {
                    await apiSendForm(`ambientes/${editing.id}`, 'PUT', form);
                    addActivity(`Ambiente "${document.getElementById('envTitle').value}" atualizado`, 'fa-image');
                } else {
                    await apiSendForm('ambientes', 'POST', form);
                    addActivity('Novo ambiente adicionado', 'fa-plus-circle');
                }
                closeModal();
                await loadModule(currentModule);
                showToast('Ambiente salvo.', 'success');
            } catch (err) {
                showToast(err.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Salvar';
            }
        };
    }

    // ---------- Modal de item do cardápio ----------
    async function openMenuItemModal(itemId = null) {
        let editing = null;
        let categorias = [];
        try {
            categorias = await apiGet('categorias');
            if (itemId) editing = mapProduto(await apiGet(`produtos/${itemId}`));
        } catch (err) {
            showToast(err.message, 'error');
            return;
        }

        const modal = document.getElementById('globalModal');
        const modalBody = document.getElementById('modalBody');
        const selectedCatId = editing ? editing.categoriaId : (categorias[0] ? categorias[0].id : null);
        const catOptions = categorias
            .map((c) => `<option value="${c.id}" ${selectedCatId === c.id ? 'selected' : ''}>${escapeHtml(c.nome)}</option>`)
            .join('');

        modalBody.innerHTML = `
            <h2 class="modal-title">${editing ? 'Editar prato' : 'Novo item no cardápio'}</h2>
            <form id="menuForm">
                <div class="form-group"><label for="itemName">Nome *</label>
                    <input type="text" id="itemName" required value="${editing ? escapeHtml(editing.name) : ''}"></div>
                <div class="form-group"><label for="itemCat">Categoria *</label>
                    <select id="itemCat" required>${catOptions}</select></div>
                <div class="form-group"><label for="itemDesc">Descrição *</label>
                    <textarea id="itemDesc" rows="3" required placeholder="Ingredientes, acompanhamentos…">${editing ? escapeHtml(editing.description) : ''}</textarea></div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" data-close-modal>Cancelar</button>
                    <button type="submit" class="btn-primary" id="menuSaveBtn">${editing ? 'Salvar alterações' : 'Adicionar'}</button>
                </div>
            </form>
        `;
        modal.classList.add('active');
        modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);

        document.getElementById('menuForm').onsubmit = async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('menuSaveBtn');
            saveBtn.disabled = true;

            const form = new FormData();
            if (editing) form.append('id', String(editing.id));
            form.append('categoriaId', document.getElementById('itemCat').value);
            form.append('nome', document.getElementById('itemName').value);
            form.append('descricao', document.getElementById('itemDesc').value);
            // Estoque/preço não são gerenciados pela interface do cardápio; usamos
            // valores neutros para satisfazer os campos obrigatórios da API.
            form.append('qtde', editing ? '50' : '50');
            form.append('valorCusto', '0');
            form.append('valorVenda', '0');
            form.append('destaque', 'false');

            try {
                if (editing) {
                    await apiSendForm(`produtos/${editing.id}`, 'PUT', form);
                    addActivity(`Cardápio atualizado: ${document.getElementById('itemName').value}`, 'fa-utensils');
                    showToast('Prato atualizado.', 'success');
                } else {
                    await apiSendForm('produtos', 'POST', form);
                    addActivity('Item adicionado ao cardápio', 'fa-utensils');
                    showToast('Item adicionado ao cardápio.', 'success');
                }
                closeModal();
                await loadModule(currentModule);
            } catch (err) {
                showToast(err.message, 'error');
                saveBtn.disabled = false;
            }
        };
    }

    function editMenuItem(id) {
        openMenuItemModal(id);
    }

    function closeModal() {
        document.getElementById('globalModal').classList.remove('active');
    }

    /**
     * Modal de confirmação genérico, com a mesma identidade visual do restante do
     * painel — usado tanto para confirmar quanto para excluir reservas, em vez do
     * confirm() nativo do navegador (que tem aparência inconsistente com o resto da UI).
     */
    function openConfirmDialog({ title, message, confirmLabel, confirmClass = 'btn-primary', onConfirm }) {
        const modal = document.getElementById('globalModal');
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h2 class="modal-title">${escapeHtml(title)}</h2>
            <p style="color:var(--gray-text);line-height:1.6;margin-bottom:28px;">${escapeHtml(message)}</p>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" data-close-modal>Cancelar</button>
                <button type="button" class="${confirmClass}" id="confirmDialogBtn">${escapeHtml(confirmLabel)}</button>
            </div>
        `;
        modal.classList.add('active');
        modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
        document.getElementById('confirmDialogBtn')?.addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
    }

    async function confirmReservation(id, name, date, time) {
        openConfirmDialog({
            title: 'Confirmar reserva',
            message: `Confirmar a reserva de ${name} para ${formatDate(date)} às ${time}?`,
            confirmLabel: 'Confirmar',
            confirmClass: 'btn-primary',
            onConfirm: async () => {
                try {
                    await apiPatch(`reservas/${id}/confirmar`);
                    addActivity(`Reserva confirmada: ${name}`, 'fa-check-circle');
                    await loadModule(currentModule);
                    showToast('Reserva confirmada.', 'success');
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        });
    }

    async function deleteReservation(id, name) {
        openConfirmDialog({
            title: 'Excluir reserva',
            message: `Tem certeza que deseja excluir a reserva de ${name}? Esta ação não pode ser desfeita.`,
            confirmLabel: 'Excluir',
            confirmClass: 'btn-danger',
            onConfirm: async () => {
                try {
                    await apiDelete(`reservas/${id}`);
                    addActivity(`Reserva excluída: ${name}`, 'fa-trash');
                    await loadModule(currentModule);
                    showToast('Reserva excluída.', 'success');
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        });
    }

    async function deleteMenuItem(id) {
        if (!confirm('Remover este item do cardápio?')) return;
        try {
            await apiDelete(`produtos/${id}`);
            addActivity('Item removido do cardápio', 'fa-trash');
            await loadModule(currentModule);
            showToast('Item removido.', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function editEnvironment(id) {
        try {
            const a = await apiGet(`ambientes/${id}`);
            openEnvironmentModal(!!a.isCarousel, id);
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function bindCarouselNav() {
        const track = document.getElementById('carouselSlotsTrack');
        const prevBtn = document.getElementById('carouselNavPrev');
        const nextBtn = document.getElementById('carouselNavNext');
        if (!track || !prevBtn || !nextBtn) return;

        function updateNavState() {
            const maxScroll = track.scrollWidth - track.clientWidth;
            const hasOverflow = maxScroll > 4;
            prevBtn.disabled = !hasOverflow || track.scrollLeft <= 4;
            nextBtn.disabled = !hasOverflow || track.scrollLeft >= maxScroll - 4;
        }

        function scrollByCard(direction) {
            const card = track.querySelector('.slot-item');
            const step = card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
            track.scrollBy({ left: direction * step, behavior: 'smooth' });
        }

        prevBtn.onclick = () => scrollByCard(-1);
        nextBtn.onclick = () => scrollByCard(1);
        track.onscroll = updateNavState;
        window.addEventListener('resize', updateNavState);

        track.querySelectorAll('img').forEach((img) => {
            if (!img.complete) img.addEventListener('load', updateNavState, { once: true });
        });

        updateNavState();
    }

    async function deleteEnvironment(id) {
        if (!confirm('Excluir este ambiente?')) return;
        try {
            await apiDelete(`ambientes/${id}`);
            addActivity('Ambiente removido', 'fa-trash');
            await loadModule(currentModule);
            showToast('Ambiente excluído.', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function removeFromCarousel(id) {
        try {
            await apiPatch(`ambientes/${id}/remover-carrossel`);
            addActivity('Slide removido do carrossel', 'fa-images');
            await loadModule(currentModule);
            showToast('Removido do carrossel.', 'info');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function setActiveEnvironmentImage(id, makeActive) {
        try {
            await apiSendJson(`ambientes/${id}/ativa`, 'PATCH', { isActive: makeActive });
            showToast(makeActive ? 'Esta imagem agora é exibida no site.' : 'Imagem removida da exibição no site.', makeActive ? 'success' : 'info');
            await loadModule(currentModule);
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // ---------- Gráficos (visão geral) ----------
    function destroyOverviewCharts() {
        if (overviewCharts.reservationTrend) {
            overviewCharts.reservationTrend.destroy();
            overviewCharts.reservationTrend = null;
        }
        if (overviewCharts.menuCategories) {
            overviewCharts.menuCategories.destroy();
            overviewCharts.menuCategories = null;
        }
    }

    function buildReservationWeekData(reservas) {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const counts = [0, 0, 0, 0, 0, 0, 0];
        reservas.forEach((r) => {
            const d = new Date(`${r.date}T00:00:00`);
            if (Number.isNaN(d.getTime())) return;
            counts[d.getDay()]++;
        });
        return { labels: days, data: counts };
    }

    function buildMenuCategoryData(produtos) {
        const map = {};
        produtos.forEach((p) => {
            map[p.category] = (map[p.category] || 0) + 1;
        });
        const labels = Object.keys(map);
        const data = labels.map((k) => map[k]);
        return { labels, data };
    }

    function initOverviewCharts() {
        if (typeof Chart === 'undefined' || !lastOverviewData) return;
        destroyOverviewCharts();

        const trendEl = document.getElementById('chartReservationsWeek');
        const catEl = document.getElementById('chartMenuCategories');
        if (!trendEl || !catEl) return;

        const week = buildReservationWeekData(lastOverviewData.reservas);
        const cats = buildMenuCategoryData(lastOverviewData.produtos);

        const gold = 'rgba(154, 132, 86, 1)';
        const goldDim = 'rgba(154, 132, 86, 0.25)';

        overviewCharts.reservationTrend = new Chart(trendEl.getContext('2d'), {
            type: 'bar',
            data: {
                labels: week.labels,
                datasets: [{ label: 'Reservas por dia da semana', data: week.data, backgroundColor: goldDim, borderColor: gold, borderWidth: 2, borderRadius: 8 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: {
                    x: { ticks: { color: '#8A8F99' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: '#8A8F99' }, grid: { color: 'rgba(255,255,255,0.06)' } }
                }
            }
        });

        const palette = ['#9A8456', '#b89f6b', '#7a6742', '#c4a574', '#5c6b7a'];
        overviewCharts.menuCategories = new Chart(catEl.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: cats.labels.length ? cats.labels : ['Sem dados'],
                datasets: [{
                    data: cats.data.length ? cats.data : [1],
                    backgroundColor: cats.labels.length ? cats.labels.map((_, i) => palette[i % palette.length]) : ['#2C313A'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8A8F99', boxWidth: 12 } } } }
        });
    }

    // ---------- Renderização ----------
    async function renderOverview() {
        const [produtosRaw, ambientesRaw, reservasHojeRaw, reservasTotalRaw] = await Promise.all([
            apiGet('produtos'),
            apiGet('ambientes'),
            apiGet(`reservas?data=${todayIso()}`),
            apiGet('reservas')
        ]);

        const produtos = produtosRaw.map(mapProduto);
        const ambientes = ambientesRaw.map(mapAmbiente);
        const reservasTotal = reservasTotalRaw.map(mapReserva);

        lastOverviewData = { produtos, reservas: reservasTotal };

        const upcoming = [...reservasTotal]
            .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time))
            .slice(0, 5);

        const rows =
            upcoming.length === 0
                ? `<tr><td colspan="4" class="empty-cell">Nenhuma reserva registrada. <button type="button" class="btn-link" id="emptyGoRes">Ir para reservas</button></td></tr>`
                : upcoming
                      .map((r) => {
                          const badge = r.confirmed
                              ? '<span class="status-badge status-confirmed">Confirmada</span>'
                              : '<span class="status-badge status-pending">Pendente</span>';
                          return `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(formatDate(r.date))}</td><td>${escapeHtml(r.time)}</td><td>${badge}</td></tr>`;
                      })
                      .join('');

        const activitiesHtml =
            activities.length === 0
                ? '<p class="empty-hint">Nenhuma atividade nesta sessão ainda.</p>'
                : activities
                      .slice(0, 8)
                      .map((a) => `<div class="activity-item"><div class="activity-icon"><i class="fas ${escapeHtml(a.icon)}"></i></div><div class="activity-text"><p>${escapeHtml(a.action)}</p><span class="activity-time">${escapeHtml(a.user)} · ${escapeHtml(a.time)}</span></div></div>`)
                      .join('');

        return `
            <div class="kpi-grid">
                <div class="kpi-card" title="Reservas para hoje">
                    <div class="kpi-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="kpi-value">${reservasHojeRaw.length}</div>
                    <div class="kpi-label">Reservas de hoje</div>
                </div>
                <div class="kpi-card"><div class="kpi-icon"><i class="fas fa-database"></i></div><div class="kpi-value">${reservasTotal.length}</div><div class="kpi-label">Total no sistema</div></div>
                <div class="kpi-card"><div class="kpi-icon"><i class="fas fa-utensils"></i></div><div class="kpi-value">${produtos.length}</div><div class="kpi-label">Itens no cardápio</div></div>
                <div class="kpi-card"><div class="kpi-icon"><i class="fas fa-images"></i></div><div class="kpi-value">${ambientes.length}</div><div class="kpi-label">Ambientes</div></div>
            </div>
            <div class="charts-row">
                <div class="card chart-card">
                    <div class="card-header"><h3>Reservas por dia da semana</h3></div>
                    <div class="card-body chart-body"><canvas id="chartReservationsWeek" aria-label="Gráfico de reservas por dia"></canvas></div>
                </div>
                <div class="card chart-card">
                    <div class="card-header"><h3>Cardápio por categoria</h3></div>
                    <div class="card-body chart-body chart-body--doughnut"><canvas id="chartMenuCategories" aria-label="Gráfico de categorias"></canvas></div>
                </div>
            </div>
            <div class="two-col-grid">
                <div class="card">
                    <div class="card-header"><h3>Próximas reservas</h3></div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead><tr><th>Cliente</th><th>Data</th><th>Horário</th><th>Status</th></tr></thead>
                                <tbody>${rows}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>Atividades recentes</h3></div>
                    <div class="card-body activity-list">${activitiesHtml}</div>
                </div>
            </div>
        `;
    }

    async function renderReservations() {
        const hoje = todayIso();
        const selected = uiState.reservations.selectedDate || hoje;
        const isToday = selected === hoje;
        const titulo = isToday ? `Reservas de hoje — ${formatDate(selected)}` : `Reservas de ${formatDate(selected)}`;

        const raw = await apiGet(`reservas?data=${selected}`);
        let filtered = raw.map(mapReserva);
        const q = uiState.reservations.query.trim().toLowerCase();
        if (q) {
            filtered = filtered.filter((r) => r.name.toLowerCase().includes(q) || r.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')));
        }
        filtered.sort((a, b) => a.time.localeCompare(b.time));

        const rows =
            filtered.length === 0
                ? `<tr><td colspan="6" class="empty-cell">Nenhuma reserva para este dia.</td></tr>`
                : filtered
                      .map((r) => {
                          const detalhes = [
                              r.type === 'evento' ? `Evento${r.eventType ? ` — ${escapeHtml(r.eventType)}` : ''}` : 'Mesa',
                              r.ambiente ? `Ambiente: ${escapeHtml(r.ambiente)}` : ''
                          ].filter(Boolean).join(' · ');
                          const obs = r.notes ? `<br><small style="color:var(--gray-text);">Obs: ${escapeHtml(r.notes)}</small>` : '';
                          const badge = r.confirmed
                              ? '<span class="status-badge status-confirmed">Confirmada</span>'
                              : '<span class="status-badge status-pending">Pendente</span>';
                          const confirmBtn = r.confirmed
                              ? ''
                              : `<button type="button" class="btn-secondary" title="Confirmar reserva" data-confirm-res="${r.id}" data-res-name="${escapeHtml(r.name)}" data-res-date="${r.date}" data-res-time="${r.time}">
                                    <i class="fas fa-check"></i> Confirmar
                                </button>`;
                          return `<tr>
                            <td><strong>${escapeHtml(r.name)}</strong>${r.email ? `<br><small style="color:var(--gray-text);">${escapeHtml(r.email)}</small>` : ''}</td>
                            <td>${escapeHtml(r.phone)}</td>
                            <td>${escapeHtml(r.time)}</td>
                            <td>${escapeHtml(String(r.people))}</td>
                            <td>${detalhes}${obs}</td>
                            <td>${badge}</td>
                            <td class="table-actions">
                                ${confirmBtn}
                                <button type="button" class="btn-icon danger" title="Excluir reserva" data-del-res="${r.id}" data-res-name="${escapeHtml(r.name)}">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                            </td>
                        </tr>`;
                      })
                      .join('');

        const banner = !isToday
            ? `<div class="date-context-banner">
                <i class="fas fa-calendar-day"></i>
                <span>Você está visualizando reservas de <strong>${escapeHtml(formatDate(selected))}</strong> — hoje é ${escapeHtml(formatDate(hoje))}.</span>
                <button type="button" class="btn-secondary" id="resGoTodayBtn"><i class="fas fa-undo"></i> Voltar para hoje</button>
            </div>`
            : '';

        return `
            ${banner}
            <div class="toolbar card toolbar--flat">
                <div class="toolbar-row">
                    <h3 style="margin:0;flex:1;">${escapeHtml(titulo)}</h3>
                    <label class="sr-only" for="resDateInput">Selecionar data</label>
                    <input type="date" id="resDateInput" class="input-inline" value="${escapeHtml(selected)}">
                    <label class="sr-only" for="resSearchInput">Buscar</label>
                    <input type="search" id="resSearchInput" class="input-inline input-grow" placeholder="Buscar por nome ou telefone…" value="${escapeHtml(uiState.reservations.query)}">
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Lista de reservas</h3><span class="badge-count">${filtered.length}</span></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead><tr><th>Cliente</th><th>Contato</th><th>Horário</th><th>Pessoas</th><th>Detalhes</th><th>Status</th><th>Ações</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async function renderMenu() {
        const [produtosRaw, categorias] = await Promise.all([apiGet('produtos'), apiGet('categorias')]);
        let list = produtosRaw.map(mapProduto);

        const { query, category } = uiState.menu;
        if (category !== 'all') list = list.filter((m) => String(m.categoriaId) === String(category));
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter((m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q));
        }
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

        const nItems = produtosRaw.length;
        const nCat = categorias.length;

        const pills = [
            `<button type="button" class="menu-pill ${category === 'all' ? 'menu-pill--active' : ''}" data-menu-cat="all">Todas <span class="menu-pill__count">${nItems}</span></button>`
        ]
            .concat(
                categorias.map(
                    (c) =>
                        `<button type="button" class="menu-pill ${String(category) === String(c.id) ? 'menu-pill--active' : ''}" data-menu-cat="${c.id}">${escapeHtml(c.nome)} <span class="menu-pill__count">${produtosRaw.filter((p) => p.categoriaId === c.id).length}</span></button>`
                )
            )
            .join('');

        const cards = list
            .map((i) => {
                const desc = i.description.length > 160 ? `${escapeHtml(i.description.slice(0, 160))}…` : escapeHtml(i.description);
                return `<article class="menu-item-card">
                    <div class="menu-item-card__top">
                        <span class="menu-item-card__cat">${escapeHtml(i.category || '')}</span>
                        <div class="menu-item-card__actions">
                            <button type="button" class="btn-icon" title="Editar" data-edit-menu="${i.id}"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn-icon danger" title="Remover" data-del-menu="${i.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <h3 class="menu-item-card__name">${escapeHtml(i.name)}</h3>
                    <p class="menu-item-card__desc">${desc}</p>
                </article>`;
            })
            .join('');

        const emptyBlock =
            list.length === 0
                ? `<div class="menu-empty card">
                    <i class="fas fa-utensils menu-empty__icon"></i>
                    <p><strong>Nenhum item nesta visualização.</strong></p>
                    <p class="menu-empty__hint">Troque o filtro de categoria, limpe a busca ou adicione um novo prato.</p>
                   </div>`
                : '';

        return `
            <div class="menu-page">
                <header class="menu-page__hero card">
                    <div class="menu-page__hero-row">
                        <div>
                            <h2 class="menu-page__title">Cardápio</h2>
                            <p class="menu-page__meta">${nItems} itens · ${nCat} categorias</p>
                        </div>
                        <button type="button" class="btn-primary" id="openMenuItemBtn"><i class="fas fa-plus"></i> Novo item</button>
                    </div>
                    <label class="menu-page__search-label" for="menuSearchInput">Buscar no cardápio</label>
                    <div class="menu-page__search-wrap">
                        <i class="fas fa-search menu-page__search-icon" aria-hidden="true"></i>
                        <input type="search" id="menuSearchInput" class="menu-page__search" placeholder="Nome, descrição ou categoria…" value="${escapeHtml(uiState.menu.query)}" autocomplete="off">
                    </div>
                    <div class="menu-page__filters">
                        <span class="menu-page__filters-label">Categoria</span>
                        <div class="menu-pills" role="group" aria-label="Filtrar por categoria">${pills}</div>
                    </div>
                </header>
                ${emptyBlock || `<div class="menu-items-grid">${cards}</div>`}
            </div>
        `;
    }

    async function renderEnvironments() {
        const raw = await apiGet('ambientes');
        const all = raw.map(mapAmbiente);
        const carousel = all.filter((e) => e.isCarousel).sort((a, b) => (a.carouselOrder ?? 0) - (b.carouselOrder ?? 0));
        const gallery = all.filter((e) => !e.isCarousel);

        const carouselHtml =
            carousel.length === 0
                ? '<p class="empty-hint">Nenhum slide no carrossel.</p>'
                : carousel
                      .map(
                          (e) => `<div class="slot-item carousel-active">
                <img class="slot-image" src="${escapeHtml(e.image)}" alt="">
                <div class="slot-info"><div class="slot-title">${escapeHtml(e.title)}</div>
                <div style="font-size:11px;color:var(--gray-text);margin-bottom:6px;">Tag: ${escapeHtml(e.tag || '-')}</div>
                <div class="slot-actions">
                    <button type="button" class="btn-secondary" data-edit-env="${e.id}">Editar</button>
                    <button type="button" class="btn-danger" data-remove-carousel="${e.id}">Remover</button>
                </div></div></div>`
                      )
                      .join('');

        const galleryHtml =
            gallery.length === 0
                ? '<p class="empty-hint">Nenhum ambiente na galeria.</p>'
                : gallery
                      .map((e) => {
                          const short = e.description.length > 80 ? `${escapeHtml(e.description.slice(0, 80))}…` : escapeHtml(e.description);
                          return `<div class="gallery-item" style="${e.isActive ? 'box-shadow:0 0 0 2px var(--gold);' : ''}">
                            <img class="gallery-image" src="${escapeHtml(e.image)}" alt="">
                            <div class="gallery-info">
                                <div class="gallery-title">${escapeHtml(e.title)}</div>
                                ${e.section ? `<div style="font-size:12px;color:var(--gold);margin-bottom:4px;"><i class="fas fa-map-marker-alt" style="margin-right:4px;"></i>${escapeHtml(e.section)}</div>` : ''}
                                <div class="gallery-desc">${short}</div>
                                <label class="checkbox-label" style="margin-bottom:14px;">
                                    <input type="checkbox" data-set-active-env="${e.id}" ${e.isActive ? 'checked' : ''}>
                                    ${e.isActive ? 'Exibindo no site' : 'Exibir no site'}
                                </label>
                                <div class="slot-actions">
                                    <button type="button" class="btn-secondary" data-edit-env="${e.id}">Editar</button>
                                    <button type="button" class="btn-danger" data-del-env="${e.id}">Excluir</button>
                                </div>
                            </div>
                        </div>`;
                      })
                      .join('');

        return `
            <div class="card" style="margin-bottom:32px">
                <div class="card-header"><h3>Carrossel (slides do topo)</h3><button type="button" class="btn-primary" id="openCarouselBtn">+ Adicionar</button></div>
                <div class="card-body">
                    <div class="carousel-track-wrap">
                        <button type="button" class="carousel-nav-btn carousel-nav-btn--prev" id="carouselNavPrev" aria-label="Ver slides anteriores"><i class="fas fa-chevron-left"></i></button>
                        <div class="slots-container" id="carouselSlotsTrack">${carouselHtml}</div>
                        <button type="button" class="carousel-nav-btn carousel-nav-btn--next" id="carouselNavNext" aria-label="Ver próximos slides"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Galeria de ambientes</h3><button type="button" class="btn-primary" id="openGalleryBtn">+ Novo</button></div>
                <div class="card-body"><div class="gallery-grid">${galleryHtml}</div></div>
            </div>
        `;
    }

    const MODULES = {
        overview: { title: 'Visão geral', render: renderOverview },
        reservations: { title: 'Reservas', render: renderReservations },
        menu: { title: 'Cardápio', render: renderMenu },
        environments: { title: 'Ambientes', render: renderEnvironments }
    };

    function bindModuleEvents(module) {
        if (module === 'overview') {
            document.getElementById('emptyGoRes')?.addEventListener('click', () => {
                document.querySelector('.nav-item[data-module="reservations"]')?.click();
            });
            requestAnimationFrame(() => initOverviewCharts());
        }
        if (module === 'reservations') {
            const dateInput = document.getElementById('resDateInput');
            if (dateInput) {
                dateInput.addEventListener('change', () => {
                    uiState.reservations.selectedDate = dateInput.value || todayIso();
                    loadModule('reservations');
                });
            }
            document.getElementById('resGoTodayBtn')?.addEventListener('click', () => {
                uiState.reservations.selectedDate = todayIso();
                loadModule('reservations');
            });
            const search = document.getElementById('resSearchInput');
            if (search) {
                const onQ = debounce(() => {
                    uiState.reservations.query = search.value;
                    loadModule('reservations');
                }, 200);
                search.addEventListener('input', onQ);
            }
            document.querySelectorAll('[data-confirm-res]').forEach((btn) => {
                btn.addEventListener('click', () =>
                    confirmReservation(
                        Number(btn.getAttribute('data-confirm-res')),
                        btn.getAttribute('data-res-name'),
                        btn.getAttribute('data-res-date'),
                        btn.getAttribute('data-res-time')
                    )
                );
            });
            document.querySelectorAll('[data-del-res]').forEach((btn) => {
                btn.addEventListener('click', () => deleteReservation(Number(btn.getAttribute('data-del-res')), btn.getAttribute('data-res-name')));
            });
        }
        if (module === 'menu') {
            document.getElementById('openMenuItemBtn')?.addEventListener('click', () => openMenuItemModal());
            document.querySelectorAll('[data-menu-cat]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    uiState.menu.category = btn.getAttribute('data-menu-cat') || 'all';
                    loadModule('menu');
                });
            });
            const ms = document.getElementById('menuSearchInput');
            if (ms) {
                const onM = debounce(() => {
                    uiState.menu.query = ms.value;
                    loadModule('menu');
                }, 200);
                ms.addEventListener('input', onM);
            }
            document.querySelectorAll('[data-edit-menu]').forEach((btn) => {
                btn.addEventListener('click', () => editMenuItem(Number(btn.getAttribute('data-edit-menu'))));
            });
            document.querySelectorAll('[data-del-menu]').forEach((btn) => {
                btn.addEventListener('click', () => deleteMenuItem(Number(btn.getAttribute('data-del-menu'))));
            });
        }
        if (module === 'environments') {
            bindCarouselNav();
            document.getElementById('openCarouselBtn')?.addEventListener('click', () => openEnvironmentModal(true));
            document.getElementById('openGalleryBtn')?.addEventListener('click', () => openEnvironmentModal(false));
            document.querySelectorAll('[data-edit-env]').forEach((btn) => {
                btn.addEventListener('click', () => editEnvironment(Number(btn.getAttribute('data-edit-env'))));
            });
            document.querySelectorAll('[data-remove-carousel]').forEach((btn) => {
                btn.addEventListener('click', () => removeFromCarousel(Number(btn.getAttribute('data-remove-carousel'))));
            });
            document.querySelectorAll('[data-del-env]').forEach((btn) => {
                btn.addEventListener('click', () => deleteEnvironment(Number(btn.getAttribute('data-del-env'))));
            });
            document.querySelectorAll('[data-set-active-env]').forEach((cb) => {
                cb.addEventListener('change', () => setActiveEnvironmentImage(Number(cb.getAttribute('data-set-active-env')), cb.checked));
            });
        }
    }

    async function loadModule(module) {
        const def = MODULES[module];
        if (!def) return;

        const ae = document.activeElement;
        const restoreFocusId = ae && (ae.id === 'resSearchInput' || ae.id === 'menuSearchInput') ? ae.id : null;

        if (currentModule === 'overview' && module !== 'overview') destroyOverviewCharts();

        currentModule = module;
        const area = document.getElementById('contentArea');
        const title = document.getElementById('pageTitle');
        if (module === 'reservations' && uiState.reservations.selectedDate && uiState.reservations.selectedDate !== todayIso()) {
            title.textContent = `${def.title} — ${formatDate(uiState.reservations.selectedDate)}`;
        } else {
            title.textContent = def.title;
        }

        area.innerHTML = '<p class="empty-hint"><i class="fas fa-circle-notch fa-spin" style="margin-right:8px;"></i>Carregando dados do servidor…</p>';

        try {
            const html = await def.render();
            area.innerHTML = html;
            bindModuleEvents(module);
        } catch (err) {
            area.innerHTML = `<div class="card"><div class="card-body">
                <p class="empty-hint"><i class="fas fa-triangle-exclamation" style="margin-right:8px;color:#dc3545;"></i>Não foi possível carregar os dados.</p>
                <p style="color:var(--gray-text);font-size:13px;text-align:center;">${escapeHtml(err.message)}<br>Verifique se a API (Barbina.API) está em execução em <strong>localhost:5058</strong>.</p>
            </div></div>`;
            showToast('Erro ao carregar dados da API.', 'error');
        }

        document.querySelectorAll('.nav-item').forEach((n) => {
            n.classList.toggle('active', n.getAttribute('data-module') === module);
        });

        if (restoreFocusId) {
            requestAnimationFrame(() => {
                const el = document.getElementById(restoreFocusId);
                if (el && typeof el.focus === 'function') {
                    el.focus();
                    const len = el.value.length;
                    if (typeof el.setSelectionRange === 'function') el.setSelectionRange(len, len);
                }
            });
        }
    }

    function updateDateTime() {
        const el = document.getElementById('currentDateTime');
        if (el) {
            el.textContent = new Date().toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    }

    // ---------- Inicialização ----------
    document.addEventListener('DOMContentLoaded', () => {
        loadModule('overview');
        updateDateTime();
        setInterval(updateDateTime, 60000);

        document.querySelectorAll('.nav-item').forEach((item) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                loadModule(item.getAttribute('data-module'));
            });
        });

        document.getElementById('refreshBtn')?.addEventListener('click', async () => {
            setLoading(true);
            await loadModule(currentModule);
            setLoading(false);
            showToast('Dados atualizados.', 'info');
        });

        const modal = document.getElementById('globalModal');
        document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');

        function setSidebarOpen(open) {
            sidebar?.classList.toggle('sidebar-open', open);
            document.body.classList.toggle('sidebar-open', open);
            if (backdrop) backdrop.hidden = !open;
            sidebarToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        sidebarToggle?.addEventListener('click', () => {
            const open = !sidebar?.classList.contains('sidebar-open');
            setSidebarOpen(open);
        });
        backdrop?.addEventListener('click', () => setSidebarOpen(false));
        document.querySelectorAll('.nav-item').forEach((n) => {
            n.addEventListener('click', () => setSidebarOpen(false));
        });
    });

    window.closeModal = closeModal;
    window.deleteMenuItem = deleteMenuItem;
    window.editMenuItem = editMenuItem;
    window.editEnvironment = editEnvironment;
    window.deleteEnvironment = deleteEnvironment;
    window.removeFromCarousel = removeFromCarousel;
})();
