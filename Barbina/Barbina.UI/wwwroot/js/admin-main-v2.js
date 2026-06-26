/**
 * Barbina CMS — Painel administrativo (v2)
 * Camadas: persistência → domínio → UI (render + eventos)
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'barbina_cms_v2';

    const TODAY_ISO = new Date().toISOString().slice(0, 10);

    const DEFAULT_DB = {
        reservations: [
            { id: 1, name: 'João Silva', phone: '(14) 99999-1234', date: TODAY_ISO, time: '19:30', people: '4', notes: '', confirmed: false }
        ],
        menu: [
            { id: 1, name: 'Bruschetta Clássica', category: 'Entradas', description: 'Fatias de pão italiano tostado com tomate, alho, azeite e manjericão fresco.' },
            { id: 2, name: 'Filé Mignon Barbina', category: 'Pratos Principais', description: 'Medalhão selado com molho de vinho tinto reduzido e risoto cremoso de parmesão.' },
            { id: 3, name: 'Caipirinha Barbina', category: 'Bebidas', description: 'Cachaça premium, limão taiti e toque de pimenta rosa.' },
            { id: 4, name: 'Brownie com Sorvete', category: 'Sobremesas', description: 'Brownie quente de chocolate belga com sorvete de baunilha e calda de caramelo.' }
        ],
        environments: [
            { id: 1, title: 'Salão Principal', description: 'ambiente aconchegante e familiar', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', isCarousel: true },
            { id: 2, title: 'Área de Balcão', description: 'espaço para drinks e porções', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600', isCarousel: true },
            { id: 3, title: 'Espaço Privativo', description: 'ambiente reservado para eventos', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600', isCarousel: false },
            { id: 4, title: 'Cozinha Show', description: 'acompanhe o preparo dos pratos', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600', isCarousel: false }
        ],
        activities: [
            { id: 1, action: 'nova reserva', user: 'admin', time: '10:32', icon: 'fa-calendar-check' },
            { id: 2, action: 'item adicionado', user: 'admin', time: '09:15', icon: 'fa-plus-circle' }
        ],
        /** Ordem dos slides no único carrossel da página inicial (IDs de `environments`). */
        carouselOrder: [1, 2]
    };

    /** @type {typeof DEFAULT_DB} */
    let DB;
    let currentModule = 'overview';

    /** Filtros por módulo (estado de UI) */
    const uiState = {
        reservations: { query: '', selectedDate: todayIso() },
        menu: { query: '', category: 'all', sort: 'name' },
        search: { open: false, query: '' }
    };

    let overviewCharts = { reservationTrend: null, menuCategories: null };

    // ---------- Persistência ----------
    function loadDb() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return structuredClone(DEFAULT_DB);
            const parsed = JSON.parse(raw);
            return migrateDb(parsed);
        } catch {
            return structuredClone(DEFAULT_DB);
        }
    }

    function migrateDb(data) {
        if (!data.activities) data.activities = structuredClone(DEFAULT_DB.activities);
        ['reservations', 'menu', 'environments'].forEach((k) => {
            if (!Array.isArray(data[k])) data[k] = structuredClone(DEFAULT_DB[k]);
        });
        // Migração: o sistema de mesas/status foi descontinuado em favor de um
        // fluxo simples de confirmação (booleano `confirmed`).
        data.reservations.forEach((r) => {
            if (typeof r.confirmed !== 'boolean') {
                r.confirmed = r.status === 'confirmed';
            }
            delete r.status;
            delete r.table;
        });
        delete data.tables;
        if (!Array.isArray(data.carouselOrder)) {
            data.carouselOrder = data.environments
                .filter((e) => e.isCarousel)
                .sort((a, b) => a.id - b.id)
                .map((e) => e.id);
        }
        return data;
    }

    /** Garante que `carouselOrder` e `isCarousel` estão alinhados. */
    function ensureCarouselOrder() {
        if (!Array.isArray(DB.carouselOrder)) DB.carouselOrder = [];
        DB.carouselOrder = DB.carouselOrder.filter((id) => DB.environments.some((e) => e.id === id));
        DB.environments.forEach((e) => {
            if (e.isCarousel && !DB.carouselOrder.includes(e.id)) DB.carouselOrder.push(e.id);
        });
        DB.environments.forEach((e) => {
            e.isCarousel = DB.carouselOrder.includes(e.id);
        });
    }

    function getCarouselSlidesOrdered() {
        ensureCarouselOrder();
        return DB.carouselOrder.map((id) => DB.environments.find((e) => e.id === id)).filter(Boolean);
    }

    function saveDb() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
        } catch (e) {
            showToast('Não foi possível salvar localmente (armazenamento cheio?).', 'error');
        }
    }

    function nextId(list) {
        if (!list.length) return 1;
        return Math.max(...list.map((x) => x.id)) + 1;
    }

    // ---------- Utilitários ----------
    function escapeHtml(text) {
        if (text == null) return '';
        const s = String(text);
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return s.replace(/[&<>"']/g, (ch) => map[ch]);
    }

    function formatCurrency(v) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
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

    // ---------- Atividades ----------
    function addActivity(action, icon = 'fa-bell') {
        DB.activities.unshift({
            id: nextId(DB.activities),
            action,
            user: 'admin',
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            icon
        });
        DB.activities = DB.activities.slice(0, 50);
        saveDb();
    }

    // ---------- Upload imagem ----------
    function uploadImageToBase64(file) {
        return new Promise((resolve) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    // ---------- Utilitário: data de hoje no formato YYYY-MM-DD ----------
    function todayIso() {
        const d = new Date();
        const tz = d.getTimezoneOffset() * 60000;
        return new Date(d - tz).toISOString().slice(0, 10);
    }

    // ---------- Modal ambiente (layout original: checkbox carrossel) ----------
    function openEnvironmentModal(forCarousel = false, envId = null) {
        const editing = envId ? DB.environments.find((e) => e.id === envId) : null;
        const modal = document.getElementById('globalModal');
        const modalBody = document.getElementById('modalBody');

        const isCarouselModal = forCarousel;
        const carouselFields = isCarouselModal ? `
                <div class="form-group">
                    <label for="envTag">Texto da tag (exibida sobre a imagem)</label>
                    <input type="text" id="envTag" placeholder="Ex: Elegancia e Sofisticacao" value="${editing ? escapeHtml(editing.tag || '') : ''}">
                    <small style="color:var(--gray-text);font-size:12px;">Texto pequeno exibido acima do titulo no slide.</small>
                </div>
                <div class="form-group">
                    <label for="envDesc">Descricao do slide</label>
                    <textarea id="envDesc" rows="3">${editing ? escapeHtml(editing.description || '') : ''}</textarea>
                </div>` : `
                <div class="form-group">
                    <label for="envSection">Secao do site *</label>
                    <select id="envSection" required>
                        <option value="">Selecione a secao</option>
                        <option value="Salao Principal" ${editing && editing.section === 'Salao Principal' ? 'selected' : ''}>Salao Principal</option>
                        <option value="Area de Balcao" ${editing && editing.section === 'Area de Balcao' ? 'selected' : ''}>Area de Balcao</option>
                        <option value="Espaco Privativo" ${editing && editing.section === 'Espaco Privativo' ? 'selected' : ''}>Espaco Privativo</option>
                        <option value="Cozinha Show" ${editing && editing.section === 'Cozinha Show' ? 'selected' : ''}>Cozinha Show</option>
                    </select>
                    <small style="color:var(--gray-text);font-size:12px;">Define em qual bloco da pagina Ambientes esta imagem sera exibida.</small>
                </div>
                <div class="form-group">
                    <label for="envSubtitle">Subtitulo do ambiente</label>
                    <input type="text" id="envSubtitle" placeholder="Ex: Tradicao e Conforto" value="${editing ? escapeHtml(editing.subtitle || '') : ''}">
                </div>
                <div class="form-group">
                    <label for="envDesc">Descricao do ambiente</label>
                    <textarea id="envDesc" rows="4">${editing ? escapeHtml(editing.description || '') : ''}</textarea>
                </div>`;
        modalBody.innerHTML = `
            <h2 class="modal-title">${editing ? 'Editar' : isCarouselModal ? 'Novo slide do carrossel' : 'Nova imagem da galeria'}</h2>
            <form id="envForm">
                <div class="form-group">
                    <label for="envTitle">Titulo *</label>
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
                        <span aria-hidden="true" style="font-size:18px;flex-shrink:0;">Link</span>
                        <input type="text" id="imageUrlInput" placeholder="Cole uma URL de imagem" value="${editing ? escapeHtml(editing.image) : ''}" style="flex:1;">
                    </div>
                    <div id="imagePreviewArea" class="image-preview-area" style="${editing ? '' : 'display:none'}">
                        <img id="previewImg" alt="Pre-visualizacao" src="${editing ? escapeHtml(editing.image) : ''}">
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" data-close-modal>Cancelar</button>
                    <button type="submit" class="btn-primary">Salvar</button>
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

        uploadBtn.onclick = () => fileInput.click();

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const base64 = await uploadImageToBase64(file);
                urlInput.value = base64;
                previewImg.src = base64;
                previewArea.style.display = 'block';
            }
        };

        urlInput.oninput = () => {
            if (urlInput.value) {
                previewImg.src = urlInput.value;
                previewArea.style.display = 'block';
            } else {
                previewArea.style.display = 'none';
            }
        };

        document.getElementById('envForm').onsubmit = async (e) => {
            e.preventDefault();
            let imageUrl = urlInput.value;
            if (!imageUrl && fileInput.files[0]) imageUrl = await uploadImageToBase64(fileInput.files[0]);
            if (!imageUrl) {
                showToast('Adicione uma imagem (arquivo ou URL).', 'warning');
                return;
            }
            ensureCarouselOrder();
            const wantCarousel = isCarouselModal;
            const tagVal      = document.getElementById('envTag')      ? document.getElementById('envTag').value.trim()      : (editing ? editing.tag || '' : '');
            const sectionVal  = document.getElementById('envSection')  ? document.getElementById('envSection').value          : (editing ? editing.section || '' : '');
            const subtitleVal = document.getElementById('envSubtitle') ? document.getElementById('envSubtitle').value.trim() : (editing ? editing.subtitle || '' : '');
            const descVal     = document.getElementById('envDesc')     ? document.getElementById('envDesc').value             : (editing ? editing.description || '' : '');
            if (editing) {
                const oldSection    = editing.section || '';
                editing.title       = document.getElementById('envTitle').value;
                editing.description = descVal;
                editing.image       = imageUrl;
                editing.isCarousel  = wantCarousel;
                editing.tag         = tagVal;
                editing.section     = sectionVal;
                editing.subtitle    = subtitleVal;
                if (wantCarousel && !DB.carouselOrder.includes(editing.id)) DB.carouselOrder.push(editing.id);
                if (!wantCarousel) DB.carouselOrder = DB.carouselOrder.filter((x) => x !== editing.id);
                addActivity(`Ambiente "${editing.title}" atualizado`, 'fa-image');
                if (!wantCarousel) {
                    if (oldSection && oldSection !== sectionVal) autoActivateIfSingle(oldSection);
                    autoActivateIfSingle(sectionVal);
                }
            } else {
                const nid = nextId(DB.environments);
                DB.environments.push({
                    id:          nid,
                    title:       document.getElementById('envTitle').value,
                    description: descVal,
                    image:       imageUrl,
                    isCarousel:  wantCarousel,
                    tag:         tagVal,
                    section:     sectionVal,
                    subtitle:    subtitleVal
                });
                if (wantCarousel) DB.carouselOrder.push(nid);
                addActivity('Novo ambiente adicionado', 'fa-plus-circle');
                if (!wantCarousel) autoActivateIfSingle(sectionVal);
            }
            ensureCarouselOrder();
            saveDb();
            closeModal();
            loadModule(currentModule);
            showToast('Ambiente salvo.', 'success');
        };
    }

    // ---------- Modal reserva ----------
    const MENU_CATEGORIES_DEFAULT = ['Entradas', 'Pratos Principais', 'Bebidas', 'Sobremesas'];

    function menuCategorySelectOptions(selectedCat) {
        const set = new Set([...MENU_CATEGORIES_DEFAULT, ...DB.menu.map((m) => m.category)]);
        return [...set]
            .sort((a, b) => a.localeCompare(b, 'pt-BR'))
            .map((c) => `<option value="${escapeHtml(c)}" ${selectedCat === c ? 'selected' : ''}>${escapeHtml(c)}</option>`)
            .join('');
    }

    // ---------- Modal cardápio ----------
    function openMenuItemModal(itemId = null) {
        const editing = itemId ? DB.menu.find((m) => m.id === itemId) : null;
        const modal = document.getElementById('globalModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = `
            <h2 class="modal-title">${editing ? 'Editar prato' : 'Novo item no cardápio'}</h2>
            <form id="menuForm">
                <div class="form-group"><label for="itemName">Nome *</label>
                    <input type="text" id="itemName" required value="${editing ? escapeHtml(editing.name) : ''}"></div>
                <div class="form-group"><label for="itemCat">Categoria *</label>
                    <select id="itemCat">${menuCategorySelectOptions(editing ? editing.category : 'Pratos Principais')}</select></div>

                <div class="form-group"><label for="itemDesc">Descrição *</label>
                    <textarea id="itemDesc" rows="3" required placeholder="Ingredientes, acompanhamentos…">${editing ? escapeHtml(editing.description) : ''}</textarea></div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" data-close-modal>Cancelar</button>
                    <button type="submit" class="btn-primary">${editing ? 'Salvar alterações' : 'Adicionar'}</button>
                </div>
            </form>
        `;
        modal.classList.add('active');
        modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);

        document.getElementById('menuForm').onsubmit = (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('itemName').value,
                category: document.getElementById('itemCat').value,

                description: document.getElementById('itemDesc').value
            };
            if (editing) {
                Object.assign(editing, payload);
                addActivity(`Cardápio atualizado: ${editing.name}`, 'fa-utensils');
                showToast('Prato atualizado.', 'success');
            } else {
                DB.menu.push({ id: nextId(DB.menu), ...payload });
                addActivity('Item adicionado ao cardápio', 'fa-utensils');
                showToast('Item adicionado ao cardápio.', 'success');
            }
            saveDb();
            closeModal();
            loadModule(currentModule);
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

    function confirmReservation(id) {
        const r = DB.reservations.find((x) => x.id === id);
        if (!r) return;
        openConfirmDialog({
            title: 'Confirmar reserva',
            message: `Confirmar a reserva de ${r.name} para ${formatDate(r.date)} às ${r.time}?`,
            confirmLabel: 'Confirmar',
            confirmClass: 'btn-primary',
            onConfirm: () => {
                r.confirmed = true;
                addActivity(`Reserva confirmada: ${r.name}`, 'fa-check-circle');
                saveDb();
                loadModule(currentModule);
                showToast('Reserva confirmada.', 'success');
            }
        });
    }

    function deleteReservation(id) {
        const r = DB.reservations.find((x) => x.id === id);
        if (!r) return;
        openConfirmDialog({
            title: 'Excluir reserva',
            message: `Tem certeza que deseja excluir a reserva de ${r.name}? Esta ação não pode ser desfeita.`,
            confirmLabel: 'Excluir',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                const i = DB.reservations.findIndex((x) => x.id === id);
                if (i !== -1) {
                    DB.reservations.splice(i, 1);
                    addActivity(`Reserva excluída: ${r.name}`, 'fa-trash');
                    saveDb();
                    loadModule(currentModule);
                    showToast('Reserva excluída.', 'success');
                }
            }
        });
    }

    function deleteMenuItem(id) {
        if (!confirm('Remover este item do cardápio?')) return;
        const i = DB.menu.findIndex((m) => m.id === id);
        if (i !== -1) {
            DB.menu.splice(i, 1);
            addActivity('Item removido do cardápio', 'fa-trash');
            saveDb();
            loadModule(currentModule);
            showToast('Item removido.', 'success');
        }
    }

    function editEnvironment(id) {
        const env = DB.environments.find((e) => e.id === id);
        openEnvironmentModal(env ? !!env.isCarousel : false, id);
    }

    function autoActivateIfSingle(section) {
        if (!section) return;
        const items = DB.environments.filter((e) => !e.isCarousel && e.section === section);
        if (items.length === 1) {
            items[0].isActive = true;
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

        // Recalcula quando as imagens carregarem (a largura real só é conhecida depois)
        track.querySelectorAll('img').forEach((img) => {
            if (!img.complete) img.addEventListener('load', updateNavState, { once: true });
        });

        updateNavState();
    }

    function deleteEnvironment(id) {
        if (!confirm('Excluir este ambiente?')) return;
        const i = DB.environments.findIndex((e) => e.id === id);
        if (i !== -1) {
            const removedSection = DB.environments[i].section;
            const wasCarousel = DB.environments[i].isCarousel;
            DB.environments.splice(i, 1);
            if (Array.isArray(DB.carouselOrder)) DB.carouselOrder = DB.carouselOrder.filter((x) => x !== id);
            addActivity('Ambiente removido', 'fa-trash');
            if (!wasCarousel) autoActivateIfSingle(removedSection);
            saveDb();
            loadModule(currentModule);
            showToast('Ambiente excluído.', 'success');
        }
    }

    function removeFromCarousel(id) {
        const e = DB.environments.find((x) => x.id === id);
        if (e) {
            e.isCarousel = false;
            if (Array.isArray(DB.carouselOrder)) DB.carouselOrder = DB.carouselOrder.filter((x) => x !== id);
            addActivity('Slide removido do carrossel', 'fa-images');
            saveDb();
            loadModule(currentModule);
            showToast('Removido do carrossel.', 'info');
        }
    }

    function setActiveEnvironmentImage(id, makeActive) {
        const env = DB.environments.find((e) => e.id === id);
        if (!env || !env.section) return;

        if (makeActive) {
            // Apenas uma imagem pode estar ativa por seção: desmarca as demais
            DB.environments.forEach((e) => {
                if (!e.isCarousel && e.section === env.section) {
                    e.isActive = e.id === id;
                }
            });
            addActivity(`Imagem definida como ativa em "${env.section}"`, 'fa-image');
            showToast('Esta imagem agora é exibida no site.', 'success');
        } else {
            env.isActive = false;
            showToast('Imagem removida da exibição no site.', 'info');
        }

        saveDb();
        loadModule(currentModule);
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

    function buildReservationWeekData() {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const counts = [0, 0, 0, 0, 0, 0, 0];
        DB.reservations.forEach((r) => {
            const d = new Date(r.date);
            if (Number.isNaN(d.getTime())) return;
            counts[d.getDay()]++;
        });
        return { labels: days, data: counts };
    }

    function buildMenuCategoryData() {
        const map = {};
        DB.menu.forEach((m) => {
            map[m.category] = (map[m.category] || 0) + 1;
        });
        const labels = Object.keys(map);
        const data = labels.map((k) => map[k]);
        return { labels, data };
    }

    function initOverviewCharts() {
        if (typeof Chart === 'undefined') return;
        destroyOverviewCharts();

        const trendEl = document.getElementById('chartReservationsWeek');
        const catEl = document.getElementById('chartMenuCategories');
        if (!trendEl || !catEl) return;

        const week = buildReservationWeekData();
        const cats = buildMenuCategoryData();

        const gold = 'rgba(154, 132, 86, 1)';
        const goldDim = 'rgba(154, 132, 86, 0.25)';

        overviewCharts.reservationTrend = new Chart(trendEl.getContext('2d'), {
            type: 'bar',
            data: {
                labels: week.labels,
                datasets: [
                    {
                        label: 'Reservas ativas por dia da semana',
                        data: week.data,
                        backgroundColor: goldDim,
                        borderColor: gold,
                        borderWidth: 2,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { ticks: { color: '#8A8F99' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#8A8F99' },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    }
                }
            }
        });

        const palette = ['#9A8456', '#b89f6b', '#7a6742', '#c4a574', '#5c6b7a'];
        overviewCharts.menuCategories = new Chart(catEl.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: cats.labels.length ? cats.labels : ['Sem dados'],
                datasets: [
                    {
                        data: cats.data.length ? cats.data : [1],
                        backgroundColor: cats.labels.length ? cats.labels.map((_, i) => palette[i % palette.length]) : ['#2C313A'],
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#8A8F99', boxWidth: 12 } }
                }
            }
        });
    }

    // ---------- Renderização ----------
    function renderOverview() {
        const totalRes = DB.reservations.length;
        const hoje = todayIso();
        const todayCount = DB.reservations.filter((r) => r.date === hoje).length;

        const upcoming = [...DB.reservations]
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

        const activities =
            DB.activities.length === 0
                ? '<p class="empty-hint">Nenhuma atividade recente.</p>'
                : DB.activities
                      .slice(0, 8)
                      .map(
                          (a) =>
                              `<div class="activity-item"><div class="activity-icon"><i class="fas ${escapeHtml(a.icon)}"></i></div><div class="activity-text"><p>${escapeHtml(a.action)}</p><span class="activity-time">${escapeHtml(a.user)} · ${escapeHtml(a.time)}</span></div></div>`
                      )
                      .join('');

        return `
            <div class="kpi-grid">
                <div class="kpi-card" title="Reservas para hoje">
                    <div class="kpi-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="kpi-value">${todayCount}</div>
                    <div class="kpi-label">Reservas de hoje</div>
                </div>
                <div class="kpi-card"><div class="kpi-icon"><i class="fas fa-database"></i></div><div class="kpi-value">${totalRes}</div><div class="kpi-label">Total no sistema</div></div>
                <div class="kpi-card"><div class="kpi-icon"><i class="fas fa-utensils"></i></div><div class="kpi-value">${DB.menu.length}</div><div class="kpi-label">Itens no cardápio</div></div>
                <div class="kpi-card"><div class="kpi-icon"><i class="fas fa-images"></i></div><div class="kpi-value">${DB.environments.length}</div><div class="kpi-label">Ambientes</div></div>
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
                    <div class="card-body activity-list">${activities}</div>
                </div>
            </div>
        `;
    }

    function filterReservationsList() {
        const selected = uiState.reservations.selectedDate || todayIso();
        let list = DB.reservations.filter((r) => r.date === selected);
        const q = uiState.reservations.query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
            );
        }
        return list.sort((a, b) => a.time.localeCompare(b.time));
    }

    function renderReservations() {
        const filtered = filterReservationsList();
        const hoje = todayIso();
        const selected = uiState.reservations.selectedDate || hoje;
        const isToday = selected === hoje;
        const titulo = isToday ? `Reservas de hoje — ${formatDate(selected)}` : `Reservas de ${formatDate(selected)}`;

        const rows =
            filtered.length === 0
                ? `<tr><td colspan="6" class="empty-cell">Nenhuma reserva para este dia.</td></tr>`
                : filtered
                      .map((r) => {
                          const detalhes = [
                              r.type === 'evento' ? `Evento${r.eventType ? ` — ${escapeHtml(r.eventType)}` : ''}` : 'Mesa',
                              r.ambiente ? `Ambiente: ${escapeHtml(r.ambiente)}` : ''
                          ]
                              .filter(Boolean)
                              .join(' · ');
                          const obs = r.notes ? `<br><small style="color:var(--gray-text);">Obs: ${escapeHtml(r.notes)}</small>` : '';
                          const badge = r.confirmed
                              ? '<span class="status-badge status-confirmed">Confirmada</span>'
                              : '<span class="status-badge status-pending">Pendente</span>';
                          const confirmBtn = r.confirmed
                              ? ''
                              : `<button type="button" class="btn-secondary" title="Confirmar reserva" data-confirm-res="${r.id}">
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
                                <button type="button" class="btn-icon danger" title="Excluir reserva" data-del-res="${r.id}">
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

    function filterMenuItems() {
        let list = DB.menu;
        const { query, category } = uiState.menu;
        if (category !== 'all') list = list.filter((m) => m.category === category);
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (m) =>
                    m.name.toLowerCase().includes(q) ||
                    m.description.toLowerCase().includes(q) ||
                    m.category.toLowerCase().includes(q)
            );
        }
        return list;
    }

    function getMenuCategoryPillsList() {
        const set = new Set(MENU_CATEGORIES_DEFAULT);
        DB.menu.forEach((m) => set.add(m.category));
        return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    function renderMenu() {
        let filtered = filterMenuItems();
        const sort = uiState.menu.sort || 'name';
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

        const allCats = getMenuCategoryPillsList();
        const nItems = DB.menu.length;
        const nCat = allCats.length;

        const pills = [
            `<button type="button" class="menu-pill ${uiState.menu.category === 'all' ? 'menu-pill--active' : ''}" data-menu-cat="all">Todas <span class="menu-pill__count">${nItems}</span></button>`
        ]
            .concat(
                allCats.map(
                    (c) =>
                        `<button type="button" class="menu-pill ${uiState.menu.category === c ? 'menu-pill--active' : ''}" data-menu-cat="${escapeHtml(c)}">${escapeHtml(c)} <span class="menu-pill__count">${DB.menu.filter((m) => m.category === c).length}</span></button>`
                )
            )
            .join('');

        const cards = filtered
            .map((i) => {
                const desc =
                    i.description.length > 160 ? `${escapeHtml(i.description.slice(0, 160))}…` : escapeHtml(i.description);
                return `<article class="menu-item-card">
                    <div class="menu-item-card__top">
                        <span class="menu-item-card__cat">${escapeHtml(i.category)}</span>
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
            filtered.length === 0
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
                    <div class="menu-sort" role="group" aria-label="Ordenação">
                        <span class="menu-sort__label">Ordenar</span>
                        <button type="button" class="menu-sort__btn ${sort === 'name' ? 'menu-sort__btn--active' : ''}" data-menu-sort="name">A–Z</button>

                    </div>
                </header>
                ${emptyBlock || `<div class="menu-items-grid">${cards}</div>`}
            </div>
        `;
    }

    function renderEnvironments() {
        ensureCarouselOrder();
        const carousel = getCarouselSlidesOrdered();
        const gallery = DB.environments.filter((e) => !e.isCarousel);

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
                btn.addEventListener('click', () => confirmReservation(Number(btn.getAttribute('data-confirm-res'))));
            });
            document.querySelectorAll('[data-del-res]').forEach((btn) => {
                btn.addEventListener('click', () => deleteReservation(Number(btn.getAttribute('data-del-res'))));
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
            document.querySelectorAll('[data-menu-sort]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    uiState.menu.sort = 'name';
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
                cb.addEventListener('change', () => {
                    setActiveEnvironmentImage(Number(cb.getAttribute('data-set-active-env')), cb.checked);
                });
            });
        }
    }

    function loadModule(module) {
        const def = MODULES[module];
        if (!def) return;

        const ae = document.activeElement;
        const restoreFocusId =
            ae && (ae.id === 'resSearchInput' || ae.id === 'menuSearchInput') ? ae.id : null;

        if (currentModule === 'overview' && module !== 'overview') destroyOverviewCharts();

        currentModule = module;
        const area = document.getElementById('contentArea');
        const title = document.getElementById('pageTitle');
        if (module === 'reservations' && uiState.reservations.selectedDate && uiState.reservations.selectedDate !== todayIso()) {
            title.textContent = `${def.title} — ${formatDate(uiState.reservations.selectedDate)}`;
        } else {
            title.textContent = def.title;
        }
        area.innerHTML = def.render();
        bindModuleEvents(module);

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

    function performGlobalSearch(query) {
        const q = query.trim().toLowerCase();
        const qDigits = q.replace(/\D/g, '');
        const panel = document.getElementById('globalSearchResults');
        if (!panel) return;
        if (!q) {
            panel.innerHTML = '';
            panel.hidden = true;
            return;
        }
        const res = DB.reservations.filter((r) => {
            const byName = r.name.toLowerCase().includes(q);
            const phoneDigits = String(r.phone).replace(/\D/g, '');
            const byPhone =
                r.phone.toLowerCase().includes(q) ||
                (qDigits.length >= 2 && phoneDigits.includes(qDigits));
            const byTable = r.table && r.table.toLowerCase().includes(q);
            return byName || byPhone || byTable;
        });
        const menu = DB.menu.filter((m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
        const env = DB.environments.filter((e) => e.title.toLowerCase().includes(q));

        const lines = [];
        res.slice(0, 5).forEach((r) => {
            lines.push(
                `<button type="button" class="search-hit" data-go="reservations">Reserva: ${escapeHtml(r.name)} — ${escapeHtml(formatDate(r.date))}</button>`
            );
        });
        menu.slice(0, 5).forEach((m) => {
            lines.push(`<button type="button" class="search-hit" data-go="menu">Cardápio: ${escapeHtml(m.name)} (${escapeHtml(m.category)})</button>`);
        });
        env.slice(0, 5).forEach((e) => {
            lines.push(`<button type="button" class="search-hit" data-go="environments">Ambiente: ${escapeHtml(e.title)}</button>`);
        });

        if (!lines.length) {
            panel.innerHTML = '<div class="search-empty">Nenhum resultado.</div>';
        } else {
            panel.innerHTML = lines.join('');
            panel.querySelectorAll('.search-hit').forEach((b) => {
                b.addEventListener('click', () => {
                    const mod = b.getAttribute('data-go');
                    closeSearchPanel();
                    document.querySelector(`.nav-item[data-module="${mod}"]`)?.click();
                });
            });
        }
        panel.hidden = false;
    }

    const debouncedSearch = debounce((v) => performGlobalSearch(v), 220);

    function closeSearchPanel() {
        const panel = document.getElementById('globalSearchResults');
        if (panel) {
            panel.hidden = true;
            panel.innerHTML = '';
        }
    }

    function updateDateTime() {
        const el = document.getElementById('currentDateTime');
        if (el) {
            el.textContent = new Date().toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // ---------- Inicialização ----------
    document.addEventListener('DOMContentLoaded', () => {
        DB = loadDb();
        ensureCarouselOrder();
        saveDb();

        loadModule('overview');
        updateDateTime();
        setInterval(updateDateTime, 60000);

        document.querySelectorAll('.nav-item').forEach((item) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                loadModule(item.getAttribute('data-module'));
            });
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            setLoading(true);
            setTimeout(() => {
                loadModule(currentModule);
                setLoading(false);
                showToast('Dados atualizados.', 'info');
            }, 280);
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            showToast('Sessão encerrada (demonstração).', 'info');
        });

        const modal = document.getElementById('globalModal');
        document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        const gSearch = document.getElementById('globalSearchInput');
        gSearch?.addEventListener('input', (e) => debouncedSearch(e.target.value));
        gSearch?.addEventListener('focus', (e) => {
            if (e.target.value) performGlobalSearch(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-search')) closeSearchPanel();
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
    window.confirmReservation = confirmReservation;
    window.deleteReservation = deleteReservation;
    window.deleteMenuItem = deleteMenuItem;
    window.editMenuItem = editMenuItem;
    window.editEnvironment = editEnvironment;
    window.deleteEnvironment = deleteEnvironment;
    window.removeFromCarousel = removeFromCarousel;
})();
