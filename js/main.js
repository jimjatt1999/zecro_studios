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
    document.querySelectorAll('.feature-card, .download-card, .support-card, .tech-items span')
        .forEach(el => observer.observe(el));

    // Video handling
    const video = document.querySelector('.video-container video');
    if (video) {
        const spinner = document.querySelector('.loading-spinner');
        
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

    // Download button animation
    document.querySelectorAll('.download-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.add('downloading');
            setTimeout(() => {
                this.classList.remove('downloading');
            }, 2000);
        });
    });

    // Mobile menu handling
    const setupMobileMenu = () => {
        const nav = document.querySelector('.site-nav');
        if (!nav.querySelector('.mobile-menu-btn')) {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" 
                          stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            
            menuBtn.addEventListener('click', () => {
                nav.classList.toggle('mobile-menu-open');
            });
            
            nav.prepend(menuBtn);
        }
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
            if (window.innerWidth <= 768) {
                setupMobileMenu();
            }
        }, 250);
    });
});