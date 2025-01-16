document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Video handling
    const video = document.querySelector('#demoVideo');
    if (video) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        video.parentElement.appendChild(spinner);

        video.addEventListener('loadstart', () => {
            spinner.style.display = 'block';
        });

        video.addEventListener('canplay', () => {
            spinner.style.display = 'none';
        });

        video.addEventListener('waiting', () => {
            spinner.style.display = 'block';
        });

        video.addEventListener('playing', () => {
            spinner.style.display = 'none';
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .tech-items span, .support-card')
        .forEach(el => observer.observe(el));

    // Header scroll behavior
    let lastScroll = 0;
    const header = document.querySelector('.site-header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scrolled-up');
            header.classList.remove('scrolled-down');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scrolled-down')) {
            // Scrolling down
            header.classList.remove('scrolled-up');
            header.classList.add('scrolled-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scrolled-down')) {
            // Scrolling up
            header.classList.remove('scrolled-down');
            header.classList.add('scrolled-up');
        }
        
        lastScroll = currentScroll;
    });

    // Mobile menu handling
    const setupMobileMenu = () => {
        const nav = document.querySelector('.nav-links');
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = `
            <img src="assets/icons/menu.svg" alt="Menu" class="menu-icon">
            <img src="assets/icons/close.svg" alt="Close" class="close-icon hidden">
        `;
        
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('mobile-menu-open');
            menuBtn.classList.toggle('menu-open');
        });
        
        document.querySelector('.header-container').prepend(menuBtn);
    };

    // Initialize mobile menu if needed
    if (window.innerWidth <= 768) {
        setupMobileMenu();
    }

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-btn')) {
                setupMobileMenu();
            }
        }, 250);
    });
});