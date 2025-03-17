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

    // Video handling
    const videoContainers = document.querySelectorAll('.video-container');
    
    videoContainers.forEach(container => {
        const video = container.querySelector('video');
        if (video) {
            // Force video reload
            video.load();
            
            // Add error handling
            video.addEventListener('error', (e) => {
                console.error('Error loading video:', e);
                container.classList.add('video-error');
            });
            
            // Add loading indicator
            video.addEventListener('loadstart', () => {
                container.classList.add('video-loading');
            });
            
            // Remove loading indicator when video can play
            video.addEventListener('canplay', () => {
                container.classList.remove('video-loading');
            });
        }
    });

    // Initialize all functionality
    const init = () => {
        setupMobileMenu();
        setupDownloads();
        setupSmoothScroll();
        setupHeaderScroll();
        setupIntersectionObserver();
        setupVideoTabs();
        setupLightboxFixed();
    };

    // Fixed Lightbox Modal Functionality
    const setupLightboxFixed = () => {
        console.log("Setting up lightbox");
        
        // Make sure the lightbox modal exists, if not, create it
        let lightboxModal = document.getElementById('lightboxModal');
        if (!lightboxModal) {
            console.log("Creating lightbox modal");
            lightboxModal = document.createElement('div');
            lightboxModal.id = 'lightboxModal';
            lightboxModal.className = 'lightbox-modal';
            lightboxModal.innerHTML = `
                <div class="lightbox-content">
                    <button class="lightbox-close" aria-label="Close lightbox">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <div class="lightbox-body">
                        <!-- Content will be dynamically inserted here -->
                    </div>
                    <div class="lightbox-navigation">
                        <button class="lightbox-nav-btn prev-btn" aria-label="Previous item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="lightbox-nav-btn next-btn" aria-label="Next item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(lightboxModal);
        }
        
        const lightboxContent = lightboxModal.querySelector('.lightbox-content');
        const lightboxBody = lightboxModal.querySelector('.lightbox-body');
        const closeBtn = lightboxModal.querySelector('.lightbox-close');
        const prevBtn = lightboxModal.querySelector('.prev-btn');
        const nextBtn = lightboxModal.querySelector('.next-btn');
        
        let currentItems = [];
        let currentIndex = 0;
        
        // Open the lightbox
        const openLightbox = (items, index = 0) => {
            console.log("Opening lightbox with items:", items);
            currentItems = items;
            currentIndex = index;
            
            // Add active class to show the modal
            lightboxModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            
            // Load the content
            updateLightboxContent();
            
            // Show/hide navigation buttons based on the number of items
            prevBtn.style.display = currentItems.length > 1 ? 'flex' : 'none';
            nextBtn.style.display = currentItems.length > 1 ? 'flex' : 'none';
        };
        
        // Close the lightbox
        const closeLightbox = () => {
            console.log("Closing lightbox");
            lightboxModal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
            
            // Pause videos if any
            const videos = lightboxBody.querySelectorAll('video');
            videos.forEach(video => video.pause());
            
            // Clear the content after animation
            setTimeout(() => {
                lightboxBody.innerHTML = '';
            }, 300);
        };
        
        // Update the lightbox content based on current index
        const updateLightboxContent = () => {
            const item = currentItems[currentIndex];
            console.log("Updating lightbox content with item:", item);
            lightboxBody.innerHTML = '';
            
            if (item.type === 'video') {
                const video = document.createElement('video');
                video.classList.add('lightbox-video');
                video.controls = true;
                video.src = item.src;
                video.muted = item.muted || false;
                video.playsInline = true;
                video.autoplay = true;
                lightboxBody.appendChild(video);
            } else if (item.type === 'image') {
                const img = document.createElement('img');
                img.classList.add('lightbox-image');
                img.src = item.src;
                img.alt = item.alt || '';
                lightboxBody.appendChild(img);
            } else if (item.type === 'gallery') {
                const gallery = document.createElement('div');
                gallery.classList.add('lightbox-gallery');
                
                item.images.forEach(image => {
                    const galleryItem = document.createElement('div');
                    galleryItem.classList.add('lightbox-gallery-item');
                    
                    const img = document.createElement('img');
                    img.classList.add('lightbox-image');
                    img.src = image.src;
                    img.alt = image.alt || '';
                    
                    galleryItem.appendChild(img);
                    gallery.appendChild(galleryItem);
                });
                
                lightboxBody.appendChild(gallery);
            } else if (item.type === 'html') {
                // For custom HTML content
                lightboxBody.innerHTML = item.html;
            }
        };
        
        // Navigate to the previous item
        const prevItem = () => {
            currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
            updateLightboxContent();
        };
        
        // Navigate to the next item
        const nextItem = () => {
            currentIndex = (currentIndex + 1) % currentItems.length;
            updateLightboxContent();
        };
        
        // Event listeners
        closeBtn.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', prevItem);
        nextBtn.addEventListener('click', nextItem);
        
        // Close when clicking outside the content
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightboxModal.classList.contains('active')) return;
            
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                prevItem();
            } else if (e.key === 'ArrowRight') {
                nextItem();
            }
        });
        
        // Setup clickable elements - DISABLED for now as we're using hover effects instead
        console.log("Using hover effects instead of click events for elements");
        
        return {
            open: openLightbox,
            close: closeLightbox
        };
    };

    init();
});