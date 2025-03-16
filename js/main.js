document.addEventListener('DOMContentLoaded', function() {
    // Scroll to Top Function
    window.scrollToTop = function(event) {
        event.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Mobile Menu Handling
    const setupMobileMenu = () => {
        const nav = document.querySelector('.nav-links');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const menuIcon = menuBtn.querySelector('img');
        const body = document.body;
        let isMenuOpen = false;

        const toggleMenu = () => {
            isMenuOpen = !isMenuOpen;
            nav.classList.toggle('active');
            menuIcon.src = `assets/icons/${isMenuOpen ? 'close' : 'menu'}.svg`;
            menuBtn.setAttribute('aria-expanded', isMenuOpen);
            body.style.overflow = isMenuOpen ? 'hidden' : '';
        };

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        document.addEventListener('click', (e) => {
            if (isMenuOpen && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
                toggleMenu();
            }
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) toggleMenu();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                toggleMenu();
            }
        });
    };

    // Simple Direct Download
    const setupDownloads = () => {
        const downloadBtn = document.querySelector('.download-btn');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                // Let the default HTML download attribute handle it
                // No need to prevent default
            });
        }
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
        const header = document.querySelector('.header');
        let lastScroll = 0;
        const scrollThreshold = 5;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            header.classList.toggle('scrolled', currentScroll > 0);
            
            if (Math.abs(currentScroll - lastScroll) < scrollThreshold) return;
            
            if (currentScroll <= 0) {
                header.classList.remove('scrolled-up', 'scrolled-down');
            } else if (currentScroll > lastScroll && !header.classList.contains('scrolled-down')) {
                header.classList.remove('scrolled-up');
                header.classList.add('scrolled-down');
            } else if (currentScroll < lastScroll && header.classList.contains('scrolled-down')) {
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

        document.querySelectorAll('.features-card, .roadmap-card, .tech-items span, .support-card')
            .forEach(el => observer.observe(el));
    };

    // Video handling
    const videos = document.querySelectorAll('.feature-video');
    
    // Pause all other videos when one starts playing
    videos.forEach(video => {
        video.addEventListener('play', function() {
            videos.forEach(otherVideo => {
                if (otherVideo !== video) {
                    otherVideo.pause();
                }
            });
        });
    });

    // Video tab functionality
    const setupVideoTabs = () => {
        const tabs = document.querySelectorAll('.video-tab');
        const panels = document.querySelectorAll('.video-panel');
        
        function switchTab(targetTab) {
            // Remove active class from all tabs and panels
            tabs.forEach(tab => tab.classList.remove('active'));
            panels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            targetTab.classList.add('active');
            const targetPanel = document.getElementById(`${targetTab.dataset.video}-panel`);
            targetPanel.classList.add('active');
            
            // Pause all videos except the active one
            videos.forEach(video => {
                if (video.parentElement.parentElement.id !== `${targetTab.dataset.video}-panel`) {
                    video.pause();
                }
            });
        }

        // Add click event listeners to tabs
        tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab));
        });

        // Add event listeners to pause other videos when one starts playing
        videos.forEach(video => {
            video.addEventListener('play', () => {
                videos.forEach(otherVideo => {
                    if (otherVideo !== video) {
                        otherVideo.pause();
                    }
                });
            });
        });
    };

    // Initialize all functionality
    const init = () => {
        setupTheme();
        setupScreenshots();
        setupIntersectionObserver();
        setupVideoTabs();
    };

    init();
});