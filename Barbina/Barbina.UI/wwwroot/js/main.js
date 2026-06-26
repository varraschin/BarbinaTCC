document.addEventListener('DOMContentLoaded', function() {
    
    // === MARCADOR DE PÁGINA ATIVA (NOVO) ===
    const currentPath = window.location.pathname.split("/").pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav a');

    navLinks.forEach(link => {
        // Remove qualquer classe active existente primeiro
        link.classList.remove('active');
        
        // Verifica se o href do link coincide com a página atual
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // EFEITO DO HEADER AO ROLAR A PÁGINA
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
                header.style.backdropFilter = 'blur(5px)';
            } else {
                header.style.backgroundColor = 'var(--dark-color)';
                header.style.backdropFilter = 'none';
            }
        });
    }

    // MENU MOBILE
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            const isActive = nav.classList.toggle('active');
            document.body.style.overflow = isActive ? 'hidden' : '';
            const icon = menuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                document.body.style.overflow = '';
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    // ANIMAÇÃO DE ELEMENTOS AO APARECER NA TELA
    const animatedElements = document.querySelectorAll('.anim-fade-up');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }

    // NAVEGAÇÃO DO CARDÁPIO
    const menuCategories = document.querySelector('.menu-categories');
    if (menuCategories) {
        const categoryBtns = document.querySelectorAll('.category-btn');
        const menuItems = document.querySelectorAll('.menu-items');

        categoryBtns.forEach((btn) => {
            btn.addEventListener('click', function () {
                categoryBtns.forEach((b) => b.classList.remove('active'));
                menuItems.forEach((item) => item.classList.remove('active'));

                this.classList.add('active');
                const category = this.getAttribute('data-category');
                const targetMenu = document.getElementById(category);
                if (targetMenu) {
                    targetMenu.classList.add('active');
                }
            });
        });

        const hash = window.location.hash.substring(1);
        if (hash) {
            const initialButton = document.querySelector(`.category-btn[data-category="${hash}"]`);
            if (initialButton) {
                initialButton.click();
            }
        }
    }
    
    // FAQ ACCORDION
    const faqList = document.querySelector('.faq-list');
    if (faqList) {
        const faqPerguntas = document.querySelectorAll('.faq-pergunta');
        
        faqPerguntas.forEach(pergunta => {
            pergunta.addEventListener('click', function() {
                const faqItem = this.parentElement;
                const resposta = this.nextElementSibling;
                const isActive = faqItem.classList.contains('active');
                
                document.querySelectorAll('.faq-item').forEach(item => {
                    if (item !== faqItem) {
                        item.classList.remove('active');
                        const otherAns = item.querySelector('.faq-resposta');
                        if (otherAns) otherAns.style.maxHeight = null;
                    }
                });

                if (!resposta) return;

                if (!isActive) {
                    faqItem.classList.add('active');
                    resposta.style.maxHeight = resposta.scrollHeight + "px";
                } else {
                    faqItem.classList.remove('active');
                    resposta.style.maxHeight = null;
                }
            });
        });
    }
});