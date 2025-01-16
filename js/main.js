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

    // Download Handling
    const setupDownloads = () => {
        const downloadBtn = document.querySelector('.download-btn');
        const progress = document.querySelector('.download-progress');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                try {
                    // Show loading state
                    downloadBtn.textContent = 'Starting download...';
                    downloadBtn.disabled = true;

                    // Fetch the file
                    const response = await fetch('/releases/mac/shizen.dmg');
                    const reader = response.body.getReader();
                    const contentLength = +response.headers.get('Content-Length');

                    let receivedLength = 0;
                    const chunks = [];

                    while(true) {
                        const {done, value} = await reader.read();

                        if (done) break;

                        chunks.push(value);
                        receivedLength += value.length;

                        // Update progress bar
                        const percentComplete = (receivedLength / contentLength) * 100;
                        progress.style.width = `${percentComplete}%`;
                    }

                    // Combine chunks and trigger download
                    const blob = new Blob(chunks);
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = 'SHIZEN.dmg';

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Cleanup
                    window.URL.revokeObjectURL(downloadUrl);
                    progress.style.width = '0';
                    downloadBtn.textContent = 'Download for Mac';
                    downloadBtn.disabled = false;

                } catch (error) {
                    console.error('Download failed:', error);
                    downloadBtn.textContent = 'Download Failed';
                    setTimeout(() => {
                        downloadBtn.textContent = 'Download for Mac';
                        downloadBtn.disabled = false;
                        progress.style.width = '0';
                    }, 2000);
                }
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

    // Handle window resize
    const setupResizeHandler = () => {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768) {
                    const nav = document.querySelector('.nav-links');
                    nav.classList.remove('active');
                    document.querySelector('.mobile-menu-btn img').src = 'assets/icons/menu.svg';
                }
            }, 250);
        });
    };

    // Initialize all functionality
    setupMobileMenu();
    setupDownloads();
    setupSmoothScroll();
    setupHeaderScroll();
    setupIntersectionObserver();
    setupVideo();
    setupResizeHandler();
});