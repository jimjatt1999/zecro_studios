document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Handling
    const setupMobileMenu = () => {
        const nav = document.querySelector('.nav-links');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const menuIcon = menuBtn.querySelector('img');
        let isMenuOpen = false;

        const toggleMenu = () => {
            isMenuOpen = !isMenuOpen;
            nav.classList.toggle('active');
            menuIcon.src = `assets/icons/${isMenuOpen ? 'close' : 'menu'}.svg`;
            menuBtn.setAttribute('aria-expanded', isMenuOpen);
        };

        menuBtn.addEventListener('click', toggleMenu);

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
                toggleMenu();
            }
        });

        // Close menu when clicking nav links
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) toggleMenu();
            });
        });
    };

    // Smooth Scroll
    const setupSmoothScroll = () => {
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
    };

    // Header Scroll Behavior
    const setupHeaderScroll = () => {
        const header = document.querySelector('.site-header');
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll <= 0) {
                header.classList.remove('scrolled-up', 'scrolled-down');
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
    };

    // Intersection Observer for Animations
    const setupIntersectionObserver = () => {
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
        document.querySelectorAll('.feature-card, .roadmap-item, .tech-items span, .support-card')
            .forEach(el => observer.observe(el));
    };

    // Video Handling
    const setupVideo = () => {
        const video = document.querySelector('#demoVideo');
        if (video) {
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            video.parentElement.appendChild(spinner);

            const toggleSpinner = (show) => {
                spinner.style.display = show ? 'block' : 'none';
            };

            video.addEventListener('loadstart', () => toggleSpinner(true));
            video.addEventListener('canplay', () => toggleSpinner(false));
            video.addEventListener('waiting', () => toggleSpinner(true));
            video.addEventListener('playing', () => toggleSpinner(false));
        }
    };

    // Handle Download Buttons
    const setupDownloadButtons = () => {
        const downloadBtns = document.querySelectorAll('.download-btn:not([disabled])');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Add download started feedback
                const originalText = btn.textContent;
                btn.textContent = 'Starting download...';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        });
    };

    // Initialize all functionality
    setupMobileMenu();
    setupSmoothScroll();
    setupHeaderScroll();
    setupIntersectionObserver();
    setupVideo();
    setupDownloadButtons();

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Update any responsive functionality if needed
            if (window.innerWidth > 768) {
                const nav = document.querySelector('.nav-links');
                nav.classList.remove('active');
                document.querySelector('.mobile-menu-btn img').src = 'assets/icons/menu.svg';
            }
        }, 250);
    });
});