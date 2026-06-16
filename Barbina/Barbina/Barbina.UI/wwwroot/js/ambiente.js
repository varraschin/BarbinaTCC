// Dados do carrossel lidos do admin (localStorage) com fallback nos dados originais
const FALLBACK_CAROUSEL = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80",
        tag: "Elegância & Sofisticação",
        title: "Salão Principal",
        desc: "Amplo, iluminado e decorado com detalhes que remetem à tradição italiana. Perfeito para jantares especiais e momentos em família."
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80",
        tag: "Descontração & Sabor",
        title: "Área de Balcão",
        desc: "Espaço acolhedor para apreciar nossas caipirinhas e porções enquanto acompanha a movimentação da cozinha."
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1920&q=80",
        tag: "Privacidade & Exclusividade",
        title: "Espaço Privativo",
        desc: "Ambiente reservado para celebrações especiais, reuniões de negócios ou momentos íntimos com quem você ama."
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1920&q=80",
        tag: "Arte & Gastronomia",
        title: "Cozinha Show",
        desc: "Acompanhe de perto a preparação dos nossos pratos e viva uma experiência sensorial única."
    }
];

function loadCarouselFromAdmin() {
    try {
        const raw = localStorage.getItem('barbina_cms_v2');
        if (raw) {
            const db = JSON.parse(raw);
            if (db.carouselOrder && db.environments && db.carouselOrder.length > 0) {
                const slides = db.carouselOrder
                    .map(id => db.environments.find(e => e.id === id))
                    .filter(Boolean);
                if (slides.length > 0) {
                    return slides.map((e, i) => ({
                        id: e.id,
                        image: e.image,
                        tag: FALLBACK_CAROUSEL[i] ? FALLBACK_CAROUSEL[i].tag : 'Barbina',
                        title: e.title,
                        desc: e.description
                    }));
                }
            }
        }
    } catch(err) {}
    return FALLBACK_CAROUSEL;
}

const carouselData = loadCarouselFromAdmin();

// Dados do Storytelling (Ambientes com histórias)
const storytellingData = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
        subtitle: "Tradição & Conforto",
        title: "Salão Principal",
        description: "Inspirado nos antigos salões italianos, este espaço foi projetado para receber famílias e amigos com todo aconchego. Os tons terrosos e a iluminação suave criam uma atmosfera perfeita para longas conversas e refeições memoráveis. É aqui que a história do Barbina começou, há mais de 15 anos, e onde continuamos celebrando a vida a cada prato servido."
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
        subtitle: "Encontros & Amigos",
        title: "Área de Balcão",
        description: "O balcão é o coração pulsante do Barbina. É ali que as melhores histórias começam, acompanhadas de uma caipirinha gelada e porções generosas. Um espaço democrático onde você pode interagir com nossos bartenders, assistir ao preparo dos drinks e sentir a energia vibrante da casa. Ideal para happy hours e encontros descontraídos."
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        subtitle: "Exclusividade & Celebração",
        title: "Espaço Privativo",
        description: "Criado para momentos que merecem privacidade, nosso espaço privativo comporta até 20 pessoas e oferece um atendimento personalizado. Seja para um aniversário, jantar romântico ou reunião executiva, aqui você encontra o cenário perfeito. Decoração sofisticada, acústica planejada e um cardápio exclusivo para ocasiões especiais."
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
        subtitle: "Experiência Sensorial",
        title: "Cozinha Show",
        description: "A Cozinha Show é uma extensão do nosso compromisso com a transparência e a arte gastronômica. Neste ambiente único, você acompanha o preparo dos pratos em tempo real, interage com nossos chefs e entende o cuidado em cada detalhe. É uma imersão no universo Barbina, onde o aroma, o calor e a técnica se unem para criar verdadeiras obras de arte culinárias."
    }
];

// Dados das Stats
const statsData = [
    { icon: "fas fa-users", number: "180+", label: "Capacidade Total" },
    { icon: "fas fa-temperature-low", number: "Climatizado", label: "Ar Condicionado" },
    { icon: "fas fa-child", number: "Kids", label: "Espaço Monitorado" },
    { icon: "fas fa-dog", number: "Pet Friendly", label: "Aceitamos Pets" },
    { icon: "fas fa-music", number: "Ao Vivo", label: "Música aos Finais de Semana" },
    { icon: "fas fa-cocktail", number: "Caipirinhas", label: "Drinks Premiados" }
];

// variáveis globais para o carrossel
let currentIndex = 0;
let slides = [];
let autoInterval;



// Renderizar Carrossel COM BOTÕES
function renderCarousel() {
    const container = document.getElementById('carouselContainer');
    const dotsContainer = document.getElementById('carouselDots');
    if (!container || !dotsContainer) return;

    container.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    carouselData.forEach((slide, idx) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'carousel-slide';
        if (idx === 0) slideDiv.classList.add('active');
        
        slideDiv.innerHTML = `
            <div class="slide-bg" style="background-image: url('${slide.image}');"></div>
            <div class="slide-content">
                <span class="slide-tag">${slide.tag}</span>
                <h2 class="slide-title">${slide.title}</h2>
                <p class="slide-desc">${slide.desc}</p>
                <div class="slide-buttons">
                    <a href="reservas.html" class="btn-slide">FAZER RESERVA</a>
                    <a href="cardapio.html" class="btn-slide-outline">EXPLORAR CARDÁPIO</a>
                </div>
            </div>
        `;
        container.appendChild(slideDiv);
        
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (idx === 0) dot.classList.add('active');
        dot.setAttribute('data-index', idx);
        dot.addEventListener('click', () => goToSlide(idx));
        dotsContainer.appendChild(dot);
    });
}

// Renderizar Storytelling (grade alternada)
function renderStorytelling() {
    const grid = document.getElementById('storyGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    storytellingData.forEach((item, index) => {
        const isEven = index % 2 === 0;
        const storyDiv = document.createElement('div');
        storyDiv.className = `story-item reveal-item ${!isEven ? 'reverse' : ''}`;
        
        storyDiv.innerHTML = `
            <div class="story-image">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
            <div class="story-text">
                <div class="story-subtitle">${item.subtitle}</div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
        `;
        grid.appendChild(storyDiv);
    });
}

// Renderizar Stats
function renderStats() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    statsGrid.innerHTML = '';
    
    statsData.forEach((stat, index) => {
        const card = document.createElement('div');
        card.className = `stat-card reveal-item`;
        card.innerHTML = `
            <div class="stat-icon"><i class="${stat.icon}"></i></div>
            <div class="stat-number">${stat.number}</div>
            <div class="stat-label">${stat.label}</div>
        `;
        statsGrid.appendChild(card);
    });
}

// ==================== FUNÇÕES DO CARROSSEL ====================

function updateCarousel() {
    slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;
    
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
    resetAutoInterval();
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel();
    resetAutoInterval();
}

function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
    resetAutoInterval();
}

function resetAutoInterval() {
    if (autoInterval) clearInterval(autoInterval);
    autoInterval = setInterval(() => {
        nextSlide();
    }, 6000);
}

// ==================== SCROLL REVEAL ====================

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });
    
    revealElements.forEach(el => observer.observe(el));
}

// ==================== INICIALIZAÇÃO ====================

function init() {
    renderCarousel();
    renderStorytelling();
    renderStats();
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    slides = document.querySelectorAll('.carousel-slide');
    if (slides.length) {
        updateCarousel();
        resetAutoInterval();
    }
    
    setTimeout(() => {
        initScrollReveal();
    }, 200);
    
    window.addEventListener('load', () => {
        initScrollReveal();
    });
}

document.addEventListener('DOMContentLoaded', init);