/**
 * Barbina CMS — Painel administrativo (v2)
 * Camadas: persistência → domínio → UI (render + eventos)
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'barbina_cms_v2';

    const DEFAULT_DB = {
        reservations: [
            { id: 1, name: 'João Silva', phone: '(14) 99999-1234', date: '2025-03-27', time: '19:30', people: 4, table: 'Mesa 04', status: 'confirmed', notes: '' },
            { id: 2, name: 'Maria Oliveira', phone: '(14) 98888-5678', date: '2025-03-28', time: '20:00', people: 2, table: 'Mesa 02', status: 'pending', notes: '' },
            { id: 3, name: 'Carlos Santos', phone: '(14) 97777-9012', date: '2025-03-29', time: '19:00', people: 6, table: 'Mesa 08', status: 'confirmed', notes: '' }
        ],
        menu: [
            { id: 1, name: 'Filé Mignon à Parmegiana', category: 'Pratos Principais', price: 68.9, description: 'filé mignon grelhado, molho especial e queijo muçarela' },
            { id: 2, name: 'Porção de Bolinho de Linguiça', category: 'Porções', price: 42.9, description: '10 unidades de bolinho caseiro' },
            { id: 3, name: 'Caipirinha Premium', category: 'Bebidas', price: 22.9, description: 'limão, gelo, açúcar e cachaça artesanal' }
        ],
        environments: [
            { id: 1, title: 'Salão Principal', description: 'ambiente aconchegante e familiar', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', isCarousel: true },
            { id: 2, title: 'Área de Balcão', description: 'espaço para drinks e porções', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600', isCarousel: true },
            { id: 3, title: 'Espaço Privativo', description: 'ambiente reservado para eventos', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600', isCarousel: false },
            { id: 4, title: 'Cozinha Show', description: 'acompanhe o preparo dos pratos', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600', isCarousel: false }
        ],
        tables: [
            { id: 1, name: 'Mesa 01', capacity: 2 }, { id: 2, name: 'Mesa 02', capacity: 2 },
            { id: 3, name: 'Mesa 03', capacity: 4 }, { id: 4, name: 'Mesa 04', capacity: 4 },
            { id: 5, name: 'Mesa 05', capacity: 4 }, { id: 6, name: 'Mesa 06', capacity: 6 },
            { id: 7, name: 'Mesa 07', capacity: 6 }, { id: 8, name: 'Mesa 08', capacity: 8 }
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
    let editingReservation = null;

    /** Filtros por módulo (estado de UI) */
    const uiState = {
        reservations: { status: 'all', query: '', showCancelled: false },
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
        if (!data.tables) data.tables = structuredClone(DEFAULT_DB.tables);
        if (!data.activities) data.activities = structuredClone(DEFAULT_DB.activities);
        ['reservations', 'menu', 'environments'].forEach((k) => {
            if (!Array.isArray(data[k])) data[k] = structuredClone(DEFAULT_DB[k]);
        });
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
        return new Date(d).toLocaleDateString('pt-BR');
    }

    function debounce(fn, ms) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function activeReservations() {
        return DB.reservations.filter((r) => r.status !== 'cancelled');
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

    // ---------- Domínio reservas ----------
    function isTableAvailable(name, date, time, excludeId) {
        return !DB.reservations.some(
            (r) =>
                r.table === name &&
                r.date === date &&
                r.time === time &&
                r.status !== 'cancelled' &&
                r.id !== excludeId
        );
    }

    function getAvailableTables(date, time, people, excludeId) {
        return DB.tables.filter((t) => t.capacity >= people && isTableAvailable(t.name, date, time, excludeId));
    }

    function isRestaurantOpen(date, time) {
        const day = new Date(date).getDay();
        if (day === 1 || day === 2) return { open: false, reason: 'Fechado às segundas e terças.' };
        const h = parseInt(time.split(':')[0], 10);
        if (day === 0) {
            if (h < 11) return { open: false, reason: 'No domingo o restaurante abre às 11h.' };
            if (h >= 15) return { open: false, reason: 'No domingo o encerramento é às 15h.' };
            return { open: true };
        }
        if (h < 17) return { open: false, reason: 'Abre às 17h (qua–sáb).' };
        if (h > 23 || (h === 23 && parseInt(time.split(':')[1], 10) > 30))
            return { open: false, reason: 'Último horário: 23:30.' };
        return { open: true };
    }

    const STATUS_LABELS = {
        confirmed: 'confirmada',
        pending: 'pendente',
        cancelled: 'cancelada'
    };

    function statusLabel(code) {
        return STATUS_LABELS[code] || code;
    }

    // ---------- Modal ambiente (layout original: checkbox carrossel) ----------
    function openEnvironmentModal(forCarousel = false, envId = null) {
        const editing = envId ? DB.environments.find((e) => e.id === envId) : null;
        const modal = document.getElementById('globalModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = `
            <h2 class="modal-title">${editing ? 'Editar ambiente' : forCarousel ? 'Adicionar ao carrossel' : 'Novo ambiente'}</h2>
            <form id="envForm">
                <div class="form-group">
                    <label for="envTitle">Título *</label>
                    <input type="text" id="envTitle" value="${editing ? escapeHtml(editing.title) : ''}" required>
                </div>
                <div class="form-group">
                    <label for="envDesc">Descrição *</label>
                    <textarea id="envDesc" rows="4" required>${editing ? escapeHtml(editing.description) : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Imagem</label>
                    <div class="env-upload-row">
                        <button type="button" class="btn-secondary" id="uploadImageBtn">
                            <i class="fas fa-cloud-upload-alt"></i> Escolher do computador
                        </button>
                        <input type="file" id="imageFileInput" accept="image/*" hidden>
                    </div>
                    <div class="env-url-wrap">
                        <span class="env-url-icon" aria-hidden="true">🔗</span>
                        <input type="text" id="imageUrlInput" placeholder="https://… ou cole uma URL" value="${editing ? escapeHtml(editing.image) : ''}">
                    </div>
                    <div id="imagePreviewArea" class="image-preview-area" style="${editing ? '' : 'display:none'}">
                        <img id="previewImg" alt="Pré-visualização" src="${editing ? escapeHtml(editing.image) : ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="envCarousel" ${editing ? (editing.isCarousel ? 'checked' : '') : forCarousel ? 'checked' : ''}>
                        Exibir no carrossel do site
                    </label>
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
            const wantCarousel = document.getElementById('envCarousel').checked;
            ensureCarouselOrder();
            if (editing) {
                editing.title = document.getElementById('envTitle').value;
                editing.description = document.getElementById('envDesc').value;
                editing.image = imageUrl;
                editing.isCarousel = wantCarousel;
                if (wantCarousel && !DB.carouselOrder.includes(editing.id)) DB.carouselOrder.push(editing.id);
                if (!wantCarousel) DB.carouselOrder = DB.carouselOrder.filter((x) => x !== editing.id);
                addActivity(`Ambiente "${editing.title}" atualizado`, 'fa-image');
            } else {
                const nid = nextId(DB.environments);
                DB.environments.push({
                    id: nid,
                    title: document.getElementById('envTitle').value,
                    description: document.getElementById('envDesc').value,
                    image: imageUrl,
                    isCarousel: wantCarousel
                });
                if (wantCarousel) DB.carouselOrder.push(nid);
                addActivity('Novo ambiente adicionado', 'fa-plus-circle');
            }
            ensureCarouselOrder();
            saveDb();
            closeModal();
            loadModule(currentModule);
            showToast('Ambiente salvo.', 'success');
        };
    }

    // ---------- Modal reserva ----------
    function openReservationModal(id = null) {
        editingReservation = id ? DB.reservations.find((r) => r.id === id) : null;
        const modal = document.getElementById('globalModal');
        const modalBody = document.getElementById('modalBody');

        const st = editingReservation ? editingReservation.status : 'pending';
        modalBody.innerHTML = `
            <h2 class="modal-title">${editingReservation ? 'Editar reserva' : 'Nova reserva'}</h2>
            <form id="resForm">
                <div class="form-group"><label for="resName">Nome completo *</label>
                    <input type="text" id="resName" value="${editingReservation ? escapeHtml(editingReservation.name) : ''}" required></div>
                <div class="form-group"><label for="resPhone">Telefone *</label>
                    <input type="tel" id="resPhone" value="${editingReservation ? escapeHtml(editingReservation.phone) : ''}" required></div>
                <div class="form-group"><label for="resDate">Data *</label>
                    <input type="date" id="resDate" value="${editingReservation ? escapeHtml(editingReservation.date) : ''}" required></div>
                <div class="form-group"><label for="resTime">Horário *</label>
                    <input type="time" id="resTime" value="${editingReservation ? escapeHtml(editingReservation.time) : ''}" required></div>
                <div class="form-group"><label for="resPeople">Pessoas *</label>
                    <input type="number" id="resPeople" min="1" max="20" value="${editingReservation ? editingReservation.people : ''}" required></div>
                <div class="form-group"><label for="resTable">Mesa</label><select id="resTable" required></select></div>
                <div class="form-group"><label for="resStatus">Status</label>
                    <select id="resStatus">
                        <option value="confirmed" ${st === 'confirmed' ? 'selected' : ''}>Confirmada</option>
                        <option value="pending" ${st === 'pending' ? 'selected' : ''}>Pendente</option>
                        <option value="cancelled" ${st === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                    </select></div>
                <div class="info-hours"><i class="fas fa-clock"></i> Qua–sáb 17h–23:30 · Dom 11h–15h · Fechado seg/ter</div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" data-close-modal>Cancelar</button>
                    <button type="submit" class="btn-primary">Salvar</button>
                </div>
            </form>
        `;

        modal.classList.add('active');
        modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);

        const dateInp = document.getElementById('resDate');
        const timeInp = document.getElementById('resTime');
        const peopleInp = document.getElementById('resPeople');
        const tableSel = document.getElementById('resTable');

        function updateTables() {
            const date = dateInp.value;
            const time = timeInp.value;
            const people = parseInt(peopleInp.value, 10) || 1;
            if (date && time) {
                const available = getAvailableTables(date, time, people, editingReservation?.id);
                tableSel.innerHTML = available
                    .map(
                        (t) =>
                            `<option value="${escapeHtml(t.name)}" ${editingReservation && editingReservation.table === t.name ? 'selected' : ''}>${escapeHtml(t.name)} (${t.capacity} pessoas)</option>`
                    )
                    .join('');
                if (!available.length) tableSel.innerHTML = '<option disabled value="">Nenhuma mesa disponível neste horário</option>';
            }
        }

        dateInp.onchange = updateTables;
        timeInp.onchange = updateTables;
        peopleInp.oninput = updateTables;
        updateTables();

        document.getElementById('resForm').onsubmit = (e) => {
            e.preventDefault();
            const date = dateInp.value;
            const time = timeInp.value;
            const status = document.getElementById('resStatus').value;
            if (!editingReservation && status === 'cancelled') {
                showToast('Não é possível criar uma reserva já como cancelada.', 'warning');
                return;
            }
            const check = isRestaurantOpen(date, time);
            if (status !== 'cancelled' && !check.open) {
                showToast(check.reason, 'warning');
                return;
            }
            const table = tableSel.value;
            if (status !== 'cancelled' && (!table || table.includes('Nenhuma'))) {
                showToast('Selecione uma mesa disponível.', 'warning');
                return;
            }

            if (editingReservation) {
                editingReservation.name = document.getElementById('resName').value;
                editingReservation.phone = document.getElementById('resPhone').value;
                editingReservation.date = date;
                editingReservation.time = time;
                editingReservation.people = parseInt(peopleInp.value, 10);
                editingReservation.table = table || editingReservation.table;
                editingReservation.status = status;
                addActivity(`Reserva editada: ${editingReservation.name}`, 'fa-edit');
            } else {
                DB.reservations.push({
                    id: nextId(DB.reservations),
                    name: document.getElementById('resName').value,
                    phone: document.getElementById('resPhone').value,
                    date,
                    time,
                    people: parseInt(peopleInp.value, 10),
                    table,
                    status,
                    notes: ''
                });
                addActivity('Nova reserva adicionada', 'fa-calendar-check');
            }
            saveDb();
            closeModal();
            loadModule(currentModule);
            showToast('Reserva salva.', 'success');
        };
    }

    const MENU_CATEGORIES_DEFAULT = ['Pratos Principais', 'Porções', 'Bebidas', 'Sobremesas', 'Entradas'];

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
                <div class="form-group"><label for="itemPrice">Preço (R$) *</label>
                    <input type="number" id="itemPrice" step="0.01" min="0" required value="${editing ? editing.price : ''}"></div>
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
                price: parseFloat(document.getElementById('itemPrice').value),
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
        editingReservation = null;
    }

    function editReservation(id) {
        openReservationModal(id);
    }

    function cancelReservation(id) {
        if (!confirm('Marcar esta reserva como cancelada?')) return;
        const r = DB.reservations.find((x) => x.id === id);
        if (r) {
            r.status = 'cancelled';
            addActivity(`Reserva cancelada: ${r.name}`, 'fa-times-circle');
            saveDb();
            loadModule(currentModule);
            showToast('Reserva cancelada.', 'success');
        }
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
        openEnvironmentModal(false, id);
    }

    function deleteEnvironment(id) {
        if (!confirm('Excluir este ambiente?')) return;
        const i = DB.environments.findIndex((e) => e.id === id);
        if (i !== -1) {
            DB.environments.splice(i, 1);
            if (Array.isArray(DB.carouselOrder)) DB.carouselOrder = DB.carouselOrder.filter((x) => x !== id);
            addActivity('Ambiente removido', 'fa-trash');
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
            if (r.status === 'cancelled') return;
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
        const active = activeReservations().length;
        const cancelled = DB.reservations.filter((r) => r.status === 'cancelled').length;

        const upcoming = [...activeReservations()]
            .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time))
            .slice(0, 5);

        const rows =
            upcoming.length === 0
                ? `<tr><td colspan="4" class="empty-cell">Nenhuma reserva ativa. <button type="button" class="btn-link" id="emptyGoRes">Ir para reservas</button></td></tr>`
                : upcoming
                      .map(
                          (r) =>
                              `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(formatDate(r.date))}</td><td>${escapeHtml(r.time)}</td><td><span class="status-badge status-${escapeHtml(r.status)}">${escapeHtml(statusLabel(r.status))}</span></td></tr>`
                      )
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
                <div class="kpi-card" title="Reservas não canceladas">
                    <div class="kpi-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="kpi-value">${active}</div>
                    <div class="kpi-label">Reservas ativas</div>
                    ${cancelled ? `<div class="kpi-sub">${cancelled} cancelada(s)</div>` : ''}
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
        const { status, query, showCancelled } = uiState.reservations;
        let list = DB.reservations;
        if (!showCancelled) list = list.filter((r) => r.status !== 'cancelled');
        if (status !== 'all') list = list.filter((r) => r.status === status);
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
                    r.table.toLowerCase().includes(q)
            );
        }
        return list;
    }

    function renderReservations() {
        const filtered = filterReservationsList();
        const rows =
            filtered.length === 0
                ? `<tr><td colspan="7" class="empty-cell">Nenhuma reserva encontrada com os filtros atuais.</td></tr>`
                : filtered
                      .map((r) => {
                          const actions =
                              r.status === 'cancelled'
                                  ? `<button type="button" class="btn-icon" title="Ver / editar" data-edit-res="${r.id}"><i class="fas fa-edit"></i></button>`
                                  : `<button type="button" class="btn-icon" title="Editar" data-edit-res="${r.id}"><i class="fas fa-edit"></i></button>
                                     <button type="button" class="btn-icon danger" title="Cancelar" data-cancel-res="${r.id}"><i class="fas fa-times"></i></button>`;
                          return `<tr>
                            <td>${escapeHtml(r.name)}</td>
                            <td>${escapeHtml(r.phone)}</td>
                            <td>${escapeHtml(formatDate(r.date))} ${escapeHtml(r.time)}</td>
                            <td>${r.people}</td>
                            <td>${escapeHtml(r.table)}</td>
                            <td><span class="status-badge status-${escapeHtml(r.status)}">${escapeHtml(statusLabel(r.status))}</span></td>
                            <td class="table-actions">${actions}</td>
                        </tr>`;
                      })
                      .join('');

        return `
            <div class="toolbar card toolbar--flat">
                <div class="toolbar-row">
                    <label class="sr-only" for="resFilterStatus">Status</label>
                    <select id="resFilterStatus" class="input-inline">
                        <option value="all" ${uiState.reservations.status === 'all' ? 'selected' : ''}>Todos os status</option>
                        <option value="confirmed" ${uiState.reservations.status === 'confirmed' ? 'selected' : ''}>Confirmadas</option>
                        <option value="pending" ${uiState.reservations.status === 'pending' ? 'selected' : ''}>Pendentes</option>
                        <option value="cancelled" ${uiState.reservations.status === 'cancelled' ? 'selected' : ''}>Canceladas</option>
                    </select>
                    <input type="search" id="resSearchInput" class="input-inline input-grow" placeholder="Buscar por nome, telefone ou mesa…" value="${escapeHtml(uiState.reservations.query)}">
                    <label class="checkbox-inline"><input type="checkbox" id="resShowCancelled" ${uiState.reservations.showCancelled ? 'checked' : ''}> Mostrar canceladas</label>
                </div>
            </div>
            <div class="card" style="margin-bottom:32px">
                <div class="card-header"><h3>Nova reserva</h3><button type="button" class="btn-primary" id="openReservationBtn">+ Nova</button></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Lista de reservas</h3><span class="badge-count">${filtered.length}</span></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead><tr><th>Cliente</th><th>Contato</th><th>Data/hora</th><th>Pessoas</th><th>Mesa</th><th>Status</th><th>Ações</th></tr></thead>
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
        if (sort === 'price') {
            filtered = [...filtered].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, 'pt-BR'));
        } else {
            filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        }

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
                    <div class="menu-item-card__footer">
                        <span class="menu-item-card__price">${formatCurrency(i.price)}</span>
                    </div>
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
                        <button type="button" class="menu-sort__btn ${sort === 'price' ? 'menu-sort__btn--active' : ''}" data-menu-sort="price">Menor preço</button>
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
                          return `<div class="gallery-item">
                            <img class="gallery-image" src="${escapeHtml(e.image)}" alt="">
                            <div class="gallery-info">
                                <div class="gallery-title">${escapeHtml(e.title)}</div>
                                <div class="gallery-desc">${short}</div>
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
                <div class="card-body"><div class="slots-container">${carouselHtml}</div></div>
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
            document.getElementById('openReservationBtn')?.addEventListener('click', () => openReservationModal());
            document.getElementById('resFilterStatus')?.addEventListener('change', (e) => {
                uiState.reservations.status = e.target.value;
                loadModule('reservations');
            });
            document.getElementById('resShowCancelled')?.addEventListener('change', (e) => {
                uiState.reservations.showCancelled = e.target.checked;
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
            document.querySelectorAll('[data-edit-res]').forEach((btn) => {
                btn.addEventListener('click', () => editReservation(Number(btn.getAttribute('data-edit-res'))));
            });
            document.querySelectorAll('[data-cancel-res]').forEach((btn) => {
                btn.addEventListener('click', () => cancelReservation(Number(btn.getAttribute('data-cancel-res'))));
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
                    uiState.menu.sort = btn.getAttribute('data-menu-sort') === 'price' ? 'price' : 'name';
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
        title.textContent = def.title;
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
    window.editReservation = editReservation;
    window.cancelReservation = cancelReservation;
    window.deleteMenuItem = deleteMenuItem;
    window.editMenuItem = editMenuItem;
    window.editEnvironment = editEnvironment;
    window.deleteEnvironment = deleteEnvironment;
    window.removeFromCarousel = removeFromCarousel;
})();
