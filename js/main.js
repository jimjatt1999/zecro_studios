document.addEventListener('DOMContentLoaded', function() {
    // Video loading and handling
    const video = document.getElementById('demoVideo');
    if (video) {
        const wrapper = video.parentElement;
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        wrapper.appendChild(spinner);

        video.addEventListener('loadeddata', () => {
            spinner.style.display = 'none';
        });

        video.addEventListener('waiting', () => {
            spinner.style.display = 'block';
        });

        video.addEventListener('playing', () => {
            spinner.style.display = 'none';
        });
    }

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
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
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .roadmap-item, .support-card').forEach(
        el => observer.observe(el)
    );

    // Download button animation
    const downloadBtns = document.querySelectorAll('.download-btn:not([disabled])');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.add('downloading');
            setTimeout(() => {
                this.classList.remove('downloading');
            }, 2000);
        });
    });

    // Mobile menu handling
    const setupMobileMenu = () => {
        const nav = document.querySelector('nav');
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;

        nav.querySelector('.nav-container').appendChild(mobileMenuBtn);

        mobileMenuBtn.addEventListener('click', () => {
            nav.classList.toggle('mobile-menu-open');
        });
    };

    if (window.innerWidth <= 768) {
        setupMobileMenu();
    }

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth <= 768) {
                if (!document.querySelector('.mobile-menu-btn')) {
                    setupMobileMenu();
                }
            }
        }, 250);
    });
});