document.addEventListener('DOMContentLoaded', function () {
    const reservaForm = document.getElementById('reservaForm');
    if (!reservaForm) return;

    const STORAGE_KEY = 'barbina_cms_v2';
    const WHATSAPP_NUMBER = '551434381255'; // (14) 3438-1255

    // ---------- Horário de funcionamento (fonte única de verdade) ----------
    // Chave = Date.getDay() → 0:Domingo ... 6:Sábado
    // `close` = horário em que o restaurante encerra o atendimento.
    // `lastCall` = último horário aceito para reservas (pode ser antes do encerramento).
    const BUSINESS_HOURS = {
        0: { open: '11:00', close: '15:00', lastCall: '14:00' }, // Domingo
        1: null,                                                  // Segunda - fechado
        2: null,                                                  // Terça - fechado
        3: { open: '17:00', close: '23:30', lastCall: '22:30' }, // Quarta
        4: { open: '17:00', close: '23:30', lastCall: '22:30' }, // Quinta
        5: { open: '17:00', close: '23:30', lastCall: '22:30' }, // Sexta
        6: { open: '11:00', close: '23:30', lastCall: '22:30' }  // Sábado
    };

    function toMinutes(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    }

    function toHHMM(totalMinutes) {
        const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const m = (totalMinutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    /** Retorna {open, close} para a data informada (string 'YYYY-MM-DD'), ou null se fechado. */
    function getHoursForDate(dateStr) {
        if (!dateStr) return null;
        const day = new Date(`${dateStr}T00:00:00`).getDay();
        return BUSINESS_HOURS[day] || null;
    }

    /** Gera os horários válidos em intervalos de 30 minutos, até o último horário aceito para reservas. */
    function generateTimeSlots(hours) {
        if (!hours) return [];
        const start = toMinutes(hours.open);
        const end = toMinutes(hours.lastCall || hours.close);
        const slots = [];
        for (let m = start; m <= end; m += 30) slots.push(toHHMM(m));
        return slots;
    }

    // ---------- Limites de data: hoje até hoje + 1 ano ----------
    const hojeDate = new Date();
    hojeDate.setHours(0, 0, 0, 0);
    const maxDate = new Date(hojeDate);
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    function toISODate(d) {
        const tz = d.getTimezoneOffset() * 60000;
        return new Date(d - tz).toISOString().slice(0, 10);
    }

    const hojeISO = toISODate(hojeDate);
    const maxISO = toISODate(maxDate);

    const dataInput = document.getElementById('data');
    const horaSelect = document.getElementById('hora');
    const horaAviso = document.getElementById('horaAviso');

    if (dataInput) {
        dataInput.setAttribute('min', hojeISO);
        dataInput.setAttribute('max', maxISO);
    }

    function showHoraAviso(msg) {
        if (!horaAviso) return;
        horaAviso.textContent = msg;
        horaAviso.hidden = !msg;
    }

    /** Repopula o select de horários com base na data escolhida. */
    function atualizarHorarios() {
        if (!horaSelect) return;
        const dateVal = dataInput ? dataInput.value : '';

        horaSelect.innerHTML = '';

        if (!dateVal) {
            horaSelect.disabled = true;
            horaSelect.innerHTML = '<option value="" disabled selected>Selecione a data primeiro</option>';
            showHoraAviso('');
            return;
        }

        // Fora do intervalo permitido (defesa extra, além do min/max do input)
        if (dateVal < hojeISO || dateVal > maxISO) {
            horaSelect.disabled = true;
            horaSelect.innerHTML = '<option value="" disabled selected>Data inválida</option>';
            showHoraAviso('Selecione uma data entre hoje e os próximos 12 meses.');
            return;
        }

        const hours = getHoursForDate(dateVal);
        if (!hours) {
            horaSelect.disabled = true;
            horaSelect.innerHTML = '<option value="" disabled selected>Fechado neste dia</option>';
            showHoraAviso('O Barbina não abre às segundas e terças-feiras. Escolha outro dia.');
            return;
        }

        const slots = generateTimeSlots(hours);
        horaSelect.disabled = false;
        showHoraAviso('');
        horaSelect.innerHTML =
            '<option value="" disabled selected>Selecione um horário</option>' +
            slots.map((s) => `<option value="${s}">${s}</option>`).join('');
    }

    if (dataInput) {
        dataInput.addEventListener('change', atualizarHorarios);
        dataInput.addEventListener('input', atualizarHorarios);
    }
    atualizarHorarios();

    // ---------- Tipo de reserva (mesa / evento) ----------
    const tipoReservaRadios = document.querySelectorAll('input[name="tipoReserva"]');
    const detalhesEventoDiv = document.getElementById('detalhesEvento');
    const tipoEventoSelect = document.getElementById('tipoEvento');

    function toggleDetalhesEvento() {
        if (!detalhesEventoDiv || !tipoEventoSelect) return;
        const checked = document.querySelector('input[name="tipoReserva"]:checked');
        if (!checked) return;
        if (checked.value === 'evento') {
            detalhesEventoDiv.removeAttribute('hidden');
            tipoEventoSelect.required = true;
        } else {
            detalhesEventoDiv.setAttribute('hidden', '');
            tipoEventoSelect.required = false;
        }
    }
    tipoReservaRadios.forEach((radio) => radio.addEventListener('change', toggleDetalhesEvento));
    toggleDetalhesEvento();

    // ---------- Máscara de telefone ----------
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '').substring(0, 11);
            if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            else value = value.replace(/^(\d*)/, '($1');
            e.target.value = value;
        });
    }

    // ---------- Feedback visual (substitui alert()) ----------
    const feedbackEl = document.getElementById('reservaFeedback');

    function showFeedback(message, type) {
        if (!feedbackEl) {
            alert(message);
            return;
        }
        feedbackEl.className = `reserva-feedback reserva-feedback--${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
        feedbackEl.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span>${message}</span>`;
        feedbackEl.hidden = false;
        requestAnimationFrame(() => feedbackEl.classList.add('is-visible'));
        feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideFeedback() {
        if (!feedbackEl) return;
        feedbackEl.classList.remove('is-visible');
        feedbackEl.hidden = true;
    }

    // ---------- Persistência local (para aparecer no painel administrativo) ----------
    function loadDb() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignora */ }
        return null;
    }

    function nextId(list) {
        if (!list || !list.length) return 1;
        return Math.max(...list.map((x) => x.id)) + 1;
    }

    function saveReservationLocally(payload) {
        let db = loadDb();
        if (!db) db = { reservations: [], menu: [], environments: [], activities: [], carouselOrder: [] };
        if (!Array.isArray(db.reservations)) db.reservations = [];
        if (!Array.isArray(db.activities)) db.activities = [];

        db.reservations.push({
            id: nextId(db.reservations),
            ...payload,
            confirmed: false,
            createdAt: new Date().toISOString()
        });

        db.activities.unshift({
            id: nextId(db.activities),
            action: `Nova solicitação de reserva: ${payload.name}`,
            user: 'site',
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            icon: 'fa-calendar-check'
        });
        db.activities = db.activities.slice(0, 50);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        } catch (e) { /* armazenamento indisponível — segue o fluxo do WhatsApp normalmente */ }
    }

    function formatDateBR(iso) {
        return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');
    }

    function selectedOptionText(select) {
        if (!select || select.selectedIndex < 0) return '';
        const opt = select.options[select.selectedIndex];
        return opt ? opt.text : '';
    }

    function buildWhatsAppMessage(data) {
        const linhas = [
            'Olá, Barbina! Gostaria de fazer uma reserva:',
            '',
            `Nome: ${data.name}`,
            `Telefone: ${data.phone}`,
            `E-mail: ${data.email}`,
            `Data: ${formatDateBR(data.date)}`,
            `Horário: ${data.time}`,
            `Pessoas: ${data.people}`,
            `Tipo: ${data.type === 'evento' ? `Evento — ${data.eventType || 'a combinar'}` : 'Mesa'}`,
            `Ambiente preferido: ${data.ambiente}`,
            `Observações: ${data.notes ? data.notes : 'Nenhuma'}`
        ];
        return linhas.join('\n');
    }

    // ---------- Envio ----------
    reservaForm.addEventListener('submit', function (e) {
        e.preventDefault();
        hideFeedback();

        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const email = document.getElementById('email').value.trim();
        const dataVal = dataInput.value;
        const horaVal = horaSelect.value;
        const pessoasSelect = document.getElementById('pessoas');
        const ambienteSelect = document.getElementById('ambiente');
        const tipoReserva = document.querySelector('input[name="tipoReserva"]:checked')?.value || 'comum';
        const observacoes = document.getElementById('observacoes').value.trim();

        // Validações essenciais (o front já restringe bastante via min/max e select,
        // mas revalidamos aqui contra qualquer adulteração do DOM)
        if (!nome || !telefone || !email || !dataVal || !horaVal || !pessoasSelect.value) {
            showFeedback('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        // Telefone: aceita fixo (10 dígitos) ou celular/comercial (11 dígitos), sempre com DDD.
        const telefoneDigitos = telefone.replace(/\D/g, '');
        if (telefoneDigitos.length !== 10 && telefoneDigitos.length !== 11) {
            showFeedback('Informe um telefone válido com DDD, incluindo todos os dígitos (fixo ou celular).', 'error');
            return;
        }

        if (dataVal < hojeISO || dataVal > maxISO) {
            showFeedback('A data da reserva deve estar entre hoje e os próximos 12 meses.', 'error');
            return;
        }

        const hours = getHoursForDate(dataVal);
        if (!hours) {
            showFeedback('O Barbina não abre às segundas e terças-feiras. Escolha outro dia.', 'error');
            return;
        }

        const validSlots = generateTimeSlots(hours);
        if (!validSlots.includes(horaVal)) {
            showFeedback('Horário inválido para o dia selecionado. Escolha um horário dentro do funcionamento do restaurante.', 'error');
            return;
        }

        if (tipoReserva === 'evento' && !tipoEventoSelect.value) {
            showFeedback('Selecione o tipo de evento.', 'error');
            return;
        }

        // Já armazenamos os rótulos legíveis (não os valores brutos do <select>),
        // assim o painel administrativo exibe a informação pronta, sem precisar de mapeamentos extras.
        const payload = {
            name: nome,
            phone: telefone,
            email: email,
            date: dataVal,
            time: horaVal,
            people: selectedOptionText(pessoasSelect),
            type: tipoReserva,
            eventType: tipoReserva === 'evento' ? selectedOptionText(tipoEventoSelect) : '',
            ambiente: selectedOptionText(ambienteSelect),
            notes: observacoes
        };

        // Salva localmente para aparecer no painel administrativo
        saveReservationLocally(payload);

        // Monta a mensagem e abre o WhatsApp (precisa ser síncrono, no mesmo gesto de clique,
        // para não ser bloqueado como pop-up)
        const mensagem = buildWhatsAppMessage(payload);
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
        window.open(waUrl, '_blank');

        showFeedback(
            `Obrigado, ${nome}! Sua solicitação para ${formatDateBR(dataVal)} às ${horaVal} foi registrada. Abrimos o WhatsApp para você confirmar os detalhes com nossa equipe.`,
            'success'
        );

        reservaForm.reset();
        toggleDetalhesEvento();
        atualizarHorarios();
    });
});
