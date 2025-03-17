document.addEventListener('DOMContentLoaded', function() {
    // Use requestIdleCallback for non-critical initializations
    const initNonCritical = () => {
        setupVideoTabs();
        setupLightboxFixed();
    };
    
    // Initialize critical UI components right away
    setupMobileMenu();
    setupThemeToggle();
    setupMacbookAnimation();
    setupScreenshotSlider();
    setupDownloads();
    setupSmoothScroll();
    setupLightbox();
    optimizeSEO();
    
    // Defer other initializations
    if ('requestIdleCallback' in window) {
        requestIdleCallback(initNonCritical);
    } else {
        setTimeout(initNonCritical, 200);
    }
    
    // Lazy load images that are offscreen
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        
        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    lazyImageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(image => {
            if (image.dataset.src) {
                lazyImageObserver.observe(image);
            }
        });
    }

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

    // Theme Toggle
    const setupThemeToggle = () => {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        
        if (!themeToggle || !themeIcon) return;
        
        // Check for saved theme preference or respect OS preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.src = 'assets/images/sun.svg';
        }
        
        themeToggle.addEventListener('click', function() {
            let currentTheme = document.documentElement.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Add rotation animation
            themeIcon.classList.add('rotate');
            
            // Update icon
            themeIcon.src = newTheme === 'dark' ? 'assets/images/sun.svg' : 'assets/images/moon.svg';
            
            // Remove animation class after animation completes
            setTimeout(() => {
                themeIcon.classList.remove('rotate');
            }, 500);
        });
    };

    // MacBook Animation
    const setupMacbookAnimation = () => {
        const macbook = document.querySelector('.css-macbook');
        if (!macbook) return;
        
        // Add animate class after a short delay for initial animation
        setTimeout(() => {
            macbook.classList.add('animate');
        }, 500);
        
        // Add scrolled class when scrolling begins
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                macbook.classList.add('scrolled');
            }
        }, { passive: true });
        
        // Setup MacBook screen slider
        const screenImages = document.querySelectorAll('.css-macbook-image');
        const screenIndicators = document.querySelectorAll('.screen-indicator');
        const screenPrevBtn = document.querySelector('.screen-prev');
        const screenNextBtn = document.querySelector('.screen-next');
        
        if (!screenImages.length || !screenIndicators.length || !screenPrevBtn || !screenNextBtn) return;
        
        let currentScreenIndex = 0;
        
        // Function to update active screen
        function updateActiveScreen(index) {
            screenImages.forEach(img => img.classList.remove('active'));
            screenIndicators.forEach(indicator => indicator.classList.remove('active'));
            
            // Handle light/dark mode images
            document.querySelectorAll('.light-screenshots .css-macbook-image')[index].classList.add('active');
            document.querySelectorAll('.dark-screenshots .css-macbook-image')[index].classList.add('active');
            
            screenIndicators[index].classList.add('active');
            currentScreenIndex = index;
        }
        
        // Next button
        screenNextBtn.addEventListener('click', () => {
            let newIndex = (currentScreenIndex + 1) % screenImages.length / 2;
            updateActiveScreen(newIndex);
        });
        
        // Previous button
        screenPrevBtn.addEventListener('click', () => {
            let newIndex = (currentScreenIndex - 1 + screenImages.length / 2) % (screenImages.length / 2);
            updateActiveScreen(newIndex);
        });
        
        // Indicator clicks
        screenIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => updateActiveScreen(index));
        });
        
        // Auto-advance slides every 5 seconds
        let screenInterval = setInterval(() => {
            let newIndex = (currentScreenIndex + 1) % (screenImages.length / 2);
            updateActiveScreen(newIndex);
        }, 5000);
        
        // Pause auto-advance on hover
        const macbookScreen = document.querySelector('.css-macbook-screen');
        if (macbookScreen) {
            macbookScreen.addEventListener('mouseenter', () => clearInterval(screenInterval));
            macbookScreen.addEventListener('mouseleave', () => {
                screenInterval = setInterval(() => {
                    let newIndex = (currentScreenIndex + 1) % (screenImages.length / 2);
                    updateActiveScreen(newIndex);
                }, 5000);
            });
        }
    };

    // Screenshot Slider
    const setupScreenshotSlider = () => {
        const mobileImages = document.querySelectorAll('.mobile-gallery-image');
        const mobileIndicators = document.querySelectorAll('.mobile-gallery-indicator');
        const mobilePrevBtn = document.querySelector('.prev-btn');
        const mobileNextBtn = document.querySelector('.next-btn');
        
        if (!mobileImages.length || !mobileIndicators.length || !mobilePrevBtn || !mobileNextBtn) return;
        
        let currentMobileIndex = 0;
        
        // Function to update active slide
        function updateActiveMobile(index) {
            mobileImages.forEach(img => img.classList.remove('active'));
            mobileIndicators.forEach(indicator => indicator.classList.remove('active'));
            
            mobileImages[index].classList.add('active');
            mobileIndicators[index].classList.add('active');
            currentMobileIndex = index;
        }
        
        // Next button
        mobileNextBtn.addEventListener('click', () => {
            let newIndex = (currentMobileIndex + 1) % mobileImages.length;
            updateActiveMobile(newIndex);
        });
        
        // Previous button
        mobilePrevBtn.addEventListener('click', () => {
            let newIndex = (currentMobileIndex - 1 + mobileImages.length) % mobileImages.length;
            updateActiveMobile(newIndex);
        });
        
        // Indicator clicks
        mobileIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => updateActiveMobile(index));
        });
        
        // Auto-advance slides every 5 seconds
        let mobileInterval = setInterval(() => {
            let newIndex = (currentMobileIndex + 1) % mobileImages.length;
            updateActiveMobile(newIndex);
        }, 5000);
        
        // Pause auto-advance on hover
        const mobileGallery = document.querySelector('.mobile-screenshot-gallery');
        if (mobileGallery) {
            mobileGallery.addEventListener('mouseenter', () => clearInterval(mobileInterval));
            mobileGallery.addEventListener('mouseleave', () => {
                mobileInterval = setInterval(() => {
                    let newIndex = (currentMobileIndex + 1) % mobileImages.length;
                    updateActiveMobile(newIndex);
                }, 5000);
            });
        }
    };

    // Simple Direct Download
    const setupDownloads = () => {
        const downloadBtns = document.querySelectorAll('.download-btn');
        
        if (!downloadBtns.length) return;
        
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const platform = this.getAttribute('data-platform');
                if (platform === 'mac') {
                    // Start download
                    window.location.href = 'downloads/shizen-0.9.5-beta.dmg';
                    
                    // Show confirmation message
                    alert('Your download is starting. Thank you for trying Shizen!');
                } else if (platform === 'windows') {
                    // Show waitlist form
                    alert('Windows version is coming soon. We\'ve added you to the waitlist!');
                }
            });
        });
    };

    // Smooth Scroll
    const setupSmoothScroll = () => {
        const links = document.querySelectorAll('a[href^="#"]');
        
        if (!links.length) return;
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (!targetElement) return;
                
                const navLinks = document.querySelector('.nav-links');
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    document.body.classList.remove('menu-active');
                }

                    window.scrollTo({
                    top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
            });
        });
    };

    // Lightbox
    const setupLightbox = () => {
        const featureCards = document.querySelectorAll('.feature-card');
        const videoContainers = document.querySelectorAll('.video-container');
        const lightboxModal = document.getElementById('lightboxModal');
        const lightboxBody = document.getElementById('lightboxBody');
        const lightboxClose = document.getElementById('lightboxClose');
        
        if (!featureCards.length || !lightboxModal || !lightboxBody || !lightboxClose) return;
        
        // Close lightbox when clicking close button
        lightboxClose.addEventListener('click', () => {
            lightboxModal.classList.remove('active');
            
            // Pause any playing videos
            const activeVideos = lightboxBody.querySelectorAll('video');
            activeVideos.forEach(video => video.pause());
        });
        
        // Close lightbox when clicking outside content
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                lightboxModal.classList.remove('active');
                
                // Pause any playing videos
                const activeVideos = lightboxBody.querySelectorAll('video');
                activeVideos.forEach(video => video.pause());
            }
        });
        
        // Open lightbox when clicking feature cards
        featureCards.forEach(card => {
            card.addEventListener('click', () => {
                const videoContainer = card.querySelector('.video-container');
                const video = videoContainer?.querySelector('video');
                
                if (video) {
                    const videoClone = video.cloneNode(true);
                    videoClone.classList.add('lightbox-video');
                    videoClone.controls = true;
                    videoClone.autoplay = true;
                    
                    // Clear previous content and add new
                    lightboxBody.innerHTML = '';
                    lightboxBody.appendChild(videoClone);
                    
                    // Show lightbox
                    lightboxModal.classList.add('active');
                }
            });
        });
        
        // Enable video clicks directly
        videoContainers.forEach(container => {
            container.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering card click
                
                const video = container.querySelector('video');
                
                if (video) {
                    const videoClone = video.cloneNode(true);
                    videoClone.classList.add('lightbox-video');
                    videoClone.controls = true;
                    videoClone.autoplay = true;
                    
                    // Clear previous content and add new
                    lightboxBody.innerHTML = '';
                    lightboxBody.appendChild(videoClone);
                    
                    // Show lightbox
                    lightboxModal.classList.add('active');
                }
            });
        });
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

    // SEO optimization functions
    const optimizeSEO = () => {
        // Add schema markup dynamically if needed
        addKeywordRichContent();
        
        // Track outbound links for analytics
        trackOutboundLinks();
        
        // Fix any broken image alt texts
        fixMissingAltText();
        
        // Add structured breadcrumbs
        addStructuredBreadcrumbs();
        
        // Add relevant keyword variations to headings
        enhanceHeadingsWithKeywords();
    };

    function addKeywordRichContent() {
        // Add additional keyword-rich content in hidden elements for SEO
        const seoContent = document.createElement('div');
        seoContent.className = 'seo-content';
        seoContent.setAttribute('aria-hidden', 'true');
        seoContent.style.display = 'none';
        
        seoContent.innerHTML = `
            <h2>Learn Japanese with Spaced Repetition System (SRS) on MacBook</h2>
            <p>Shizen is the ultimate Japanese learning application for MacBook users looking for an alternative to Anki.
            Our advanced SRS technology helps you learn Japanese vocabulary, kanji, and grammar more efficiently than
            traditional flashcard applications.</p>
            
            <h3>Why Shizen is better than Anki for Japanese learning</h3>
            <ul>
                <li>Specialized Japanese language features not available in general SRS apps</li>
                <li>Audio segmentation technology for natural Japanese listening practice</li>
                <li>Optimized spaced repetition algorithm specifically for Japanese language patterns</li>
                <li>Integration with Japanese dictionaries and reference materials</li>
                <li>Beautiful MacBook-optimized interface for a superior learning experience</li>
            </ul>
        `;
        
        document.body.appendChild(seoContent);
    }

    function trackOutboundLinks() {
        // Track outbound links for SEO analytics
        const links = document.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            if (!link.getAttribute('rel')) {
                link.setAttribute('rel', 'noopener');
            }
            
            // Add tracking attribute for analytics
            link.setAttribute('data-outbound', 'true');
        });
    }

    function fixMissingAltText() {
        // Ensure all images have descriptive alt text
        const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
        images.forEach(img => {
            const parent = img.parentElement;
            const nearestText = parent.textContent.trim().substring(0, 50);
            img.setAttribute('alt', nearestText || 'Shizen Japanese Learning App');
        });
    }

    function addStructuredBreadcrumbs() {
        // Add structured breadcrumbs for better SEO
        const header = document.querySelector('.header');
        if (!header) return;
        
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.setAttribute('aria-label', 'breadcrumbs');
        breadcrumbs.style.display = 'none'; // Hidden visually but available for screen readers and SEO
        
        const currentPath = window.location.pathname;
        const pathSegments = currentPath.split('/').filter(segment => segment);
        
        let breadcrumbHtml = '<a href="/">Home</a>';
        let breadcrumbSchema = [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": window.location.origin
            }
        ];
        
        if (pathSegments.length > 0) {
            let position = 2;
            let currentPath = '';
            
            pathSegments.forEach(segment => {
                currentPath += '/' + segment;
                const readableSegment = segment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                breadcrumbHtml += ` > <a href="${currentPath}">${readableSegment}</a>`;
                
                breadcrumbSchema.push({
                    "@type": "ListItem",
                    "position": position,
                    "name": readableSegment,
                    "item": window.location.origin + currentPath
                });
                
                position++;
            });
        }
        
        breadcrumbs.innerHTML = breadcrumbHtml;
        
        // Add breadcrumb schema
        const breadcrumbScript = document.createElement('script');
        breadcrumbScript.type = 'application/ld+json';
        breadcrumbScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbSchema
        });
        
        document.head.appendChild(breadcrumbScript);
        header.after(breadcrumbs);
    }

    function enhanceHeadingsWithKeywords() {
        // Add keyword variations to headings for SEO
        const keywordPairs = [
            { selector: '.accent-text', prepend: 'Japanese ' },
            { selector: 'h2:contains("Features")', append: ' for Japanese Learning' },
            { selector: 'h2:contains("Learning")', append: ' with SRS Technology' },
            { selector: 'h3:contains("SRS")', append: ' (Spaced Repetition System)' }
        ];
        
        keywordPairs.forEach(pair => {
            const elements = document.querySelectorAll(pair.selector);
            elements.forEach(el => {
                if (pair.prepend) {
                    el.textContent = pair.prepend + el.textContent;
                }
                if (pair.append) {
                    el.textContent = el.textContent + pair.append;
                }
            });
        });
    }
});