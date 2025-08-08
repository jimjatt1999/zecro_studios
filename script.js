// Shizen app studio script
// Add interactivity later (e.g., dark mode toggle)

document.addEventListener('DOMContentLoaded', () => {
    console.log('Shizen app studio site loaded.');

    setupScreenshotGalleries();
    setupVideoLightbox();
    setupImageLightbox();
    setupThemeToggle();
    setupReveals();
    decorateDetailHeadings();
    initStackCarousel();
    markActiveHeroLink();

    // Run eye tracking only if the placeholder exists
    if (document.querySelector('.animated-eyes-placeholder')) {
        setupEyeTracking();
    }

    // Future JS code here
});

function setupScreenshotGalleries() {
    const galleries = document.querySelectorAll('.screenshot-gallery');

    galleries.forEach(gallery => {
        const galleryId = gallery.id;
        const images = gallery.querySelectorAll('.gallery-image');
        const prevBtn = document.querySelector(`.gallery-btn.prev[data-gallery="${galleryId}"]`);
        const nextBtn = document.querySelector(`.gallery-btn.next[data-gallery="${galleryId}"]`);
        const indicatorsContainer = document.querySelector(`.gallery-indicators[data-gallery="${galleryId}"]`);
        let currentIndex = 0;
        let indicators = null; // Initialize indicators as null
        let autoplayTimer = null;
        let isPaused = false;

        // Check if controls/indicators even exist before proceeding
        const controlsExist = prevBtn && nextBtn;
        const indicatorsExist = indicatorsContainer;

        if (images.length <= 1) {
            // Hide controls if they exist and only one image
            if (controlsExist) {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            }
            if (indicatorsExist) {
                indicatorsContainer.style.display = 'none';
            }
             return; // No setup needed for single image galleries
        }

        // Create indicators only if the container exists
        if (indicatorsExist) {
            indicatorsContainer.innerHTML = ''; // Clear existing dots
            images.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.classList.add('indicator-dot');
                if (index === 0) dot.classList.add('active');
                dot.addEventListener('click', () => showImage(index));
                indicatorsContainer.appendChild(dot);
            });
            indicators = indicatorsContainer.querySelectorAll('.indicator-dot'); // Assign indicators after creation
        }

        function showImage(index) {
            // Check if images exist at the current and target index
            if (!images[currentIndex] || !images[index]) return; 
            
            images[currentIndex].classList.remove('active');
            // Only update indicators if they exist
            if (indicators && indicators[currentIndex]) {
                indicators[currentIndex].classList.remove('active');
            }

            currentIndex = (index + images.length) % images.length; // Loop around

            images[currentIndex].classList.add('active');
            // Only update indicators if they exist
            if (indicators && indicators[currentIndex]) {
                indicators[currentIndex].classList.add('active');
            }
        }

        // Add listeners only if buttons exist
        if (prevBtn) {
            prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
        }

        // Open modal when clicking any screenshot
        gallery.addEventListener('click', (e) => {
            const clickedImage = e.target.closest('.gallery-image');
            if (!clickedImage) return;
            const items = Array.from(images).map(img => ({ src: img.currentSrc || img.src, alt: img.alt }));
            const startIndex = Math.max(0, Array.from(images).indexOf(clickedImage));
            openImageLightbox(items, startIndex);
        });

        // Swipe support (mobile)
        let touchStartX = 0;
        let touchEndX = 0;
        gallery.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });
        gallery.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const delta = touchEndX - touchStartX;
            if (Math.abs(delta) > 30) {
                if (delta > 0) showImage(currentIndex - 1);
                else showImage(currentIndex + 1);
            }
        }, { passive: true });

        // Autoplay with pause on hover/touch
        const startAutoplay = () => {
            if (autoplayTimer) clearInterval(autoplayTimer);
            autoplayTimer = setInterval(() => {
                if (!isPaused) showImage(currentIndex + 1);
            }, 4500);
        };
        gallery.addEventListener('mouseenter', () => { isPaused = true; });
        gallery.addEventListener('mouseleave', () => { isPaused = false; });
        gallery.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
        gallery.addEventListener('touchend', () => { isPaused = false; }, { passive: true });
        startAutoplay();

        // Lazy loading
        images.forEach(img => {
            if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
        });
    });
}

function initStackCarousel() {
    const scroller = document.getElementById('stack-carousel');
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll('.stack-card'));
    const prevBtn = document.querySelector('.stack-explore .stack-nav.prev');
    const nextBtn = document.querySelector('.stack-explore .stack-nav.next');
    const setActive = () => {
        const mid = scroller.scrollLeft + scroller.clientWidth / 2;
        let best = null, bestDist = Infinity;
        cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const center = rect.left + rect.width / 2;
            const dist = Math.abs(center - (window.innerWidth / 2));
            if (dist < bestDist) { bestDist = dist; best = card; }
        });
        cards.forEach((c) => c.classList.remove('active'));
        if (best) best.classList.add('active');
    };
    setActive();
    scroller.addEventListener('scroll', () => { window.requestAnimationFrame(setActive); }, { passive: true });

    const scrollByCard = (dir) => {
        const first = cards[0];
        if (!first) return;
        const cardRect = first.getBoundingClientRect();
        const gap = parseFloat(getComputedStyle(scroller).columnGap || getComputedStyle(scroller).gap || 16);
        scroller.scrollBy({ left: dir * (cardRect.width + gap), behavior: 'smooth' });
    };
    prevBtn && prevBtn.addEventListener('click', () => scrollByCard(-1));
    nextBtn && nextBtn.addEventListener('click', () => scrollByCard(1));

    // Drag to scroll behavior with click passthrough
    let isDown = false; let startX = 0; let startLeft = 0; let downTarget = null;
    scroller.addEventListener('pointerdown', (e) => {
        isDown = true;
        startX = e.clientX;
        startLeft = scroller.scrollLeft;
        downTarget = e.target;
        scroller.setPointerCapture(e.pointerId);
    });
    scroller.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        scroller.scrollLeft = startLeft - (e.clientX - startX);
    });
    scroller.addEventListener('pointerup', (e) => {
        if (!isDown) return;
        const delta = Math.abs(e.clientX - startX);
        isDown = false;
        try { scroller.releasePointerCapture(e.pointerId); } catch (_) {}
        if (delta < 6) {
            const anchor = (downTarget && downTarget.closest) ? downTarget.closest('a.stack-card') : null;
            if (anchor) anchor.click();
        }
        downTarget = null;
    });
    scroller.addEventListener('pointercancel', () => { isDown = false; downTarget = null; });
}

function markActiveHeroLink() {
    const links = document.querySelectorAll('.hero-mini-nav a');
    if (!links || links.length === 0) return;
    const pathname = location.pathname.split('/').pop() || 'index.html';
    links.forEach((a) => {
        const href = a.getAttribute('href');
        if (!href) return;
        const hrefPath = href.split('#')[0];
        if (hrefPath === pathname || (pathname === '' && hrefPath === 'index.html')) {
            a.classList.add('active');
        }
        if (href.includes('#') && pathname === 'index.html' && href.startsWith('index.html#')) {
            // On homepage, mark Explore apps as active when requested
            const id = href.split('#')[1];
            if (document.getElementById(id)) {
                a.classList.add('active');
            }
        }
    });
}
function setupVideoLightbox() {
    const videoLinks = document.querySelectorAll('.video-link');
    if (videoLinks.length === 0) return;
    let lightbox = document.getElementById('video-lightbox');

    // Lazily create a video lightbox if missing (for detail pages)
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'video-lightbox';
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" aria-label="Close">&times;</button>
                <video controls preload="metadata"></video>
            </div>
        `;
        document.body.appendChild(lightbox);
    }

    // Now that we know lightbox exists, query inside it
    const lightboxVideo = lightbox.querySelector('video');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    // Check if the inner elements exist
    if (!lightboxVideo || !closeBtn) return;

    videoLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const videoSrc = link.getAttribute('href');
            lightboxVideo.src = videoSrc;
            lightbox.classList.add('active');
            lightboxVideo.play(); // Optional: start playing immediately
        });
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightboxVideo.pause();
        lightboxVideo.src = ''; // Clear source
    }

    closeBtn.addEventListener('click', closeLightbox);

    // Optional: Close lightbox when clicking outside the video
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) { // Check if the click was directly on the background
            closeLightbox();
        }
    });

    // Optional: Close lightbox with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}

// Shared image lightbox (created once, used by all galleries)
let imageLightboxEl = null;
let imageLightboxImg = null;
let imageLightboxClose = null;
let imageLightboxPrev = null;
let imageLightboxNext = null;
let imageItems = [];
let imageIndex = 0;

function setupImageLightbox() {
    // Build lightbox lazily if missing
    imageLightboxEl = document.getElementById('image-lightbox');
    if (!imageLightboxEl) {
        imageLightboxEl = document.createElement('div');
        imageLightboxEl.id = 'image-lightbox';
        imageLightboxEl.className = 'lightbox';
        imageLightboxEl.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" aria-label="Close">&times;</button>
                <button class="lightbox-nav prev" aria-label="Previous">‹</button>
                <img alt="Screenshot" />
                <button class="lightbox-nav next" aria-label="Next">›</button>
            </div>
        `;
        document.body.appendChild(imageLightboxEl);
    }
    imageLightboxImg = imageLightboxEl.querySelector('img');
    imageLightboxClose = imageLightboxEl.querySelector('.lightbox-close');
    imageLightboxPrev = imageLightboxEl.querySelector('.lightbox-nav.prev');
    imageLightboxNext = imageLightboxEl.querySelector('.lightbox-nav.next');

    // Close handlers
    const close = () => {
        imageLightboxEl.classList.remove('active');
        imageLightboxImg.src = '';
    };
    imageLightboxClose.addEventListener('click', close);
    imageLightboxEl.addEventListener('click', (e) => {
        // Clicking backdrop closes; click on image handled in img listener
        const content = imageLightboxEl.querySelector('.lightbox-content');
        if (!content.contains(e.target)) return; // safety
        if (!imageLightboxImg.contains(e.target)) {
            close();
        }
    });

    // Button navigation
    imageLightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showImageInLightbox(imageIndex - 1); });
    imageLightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showImageInLightbox(imageIndex + 1); });

    // Also allow image-half click to navigate
    imageLightboxImg.addEventListener('click', (e) => {
        const rect = imageLightboxImg.getBoundingClientRect();
        const goNext = (e.clientX - rect.left) > rect.width / 2;
        showImageInLightbox(goNext ? imageIndex + 1 : imageIndex - 1);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (!imageLightboxEl.classList.contains('active')) return;
        if (e.key === 'Escape') return imageLightboxEl.classList.remove('active');
        if (e.key === 'ArrowRight') showImageInLightbox(imageIndex + 1);
        if (e.key === 'ArrowLeft') showImageInLightbox(imageIndex - 1);
    });

    // Swipe on mobile
    let touchStartX = 0;
    imageLightboxEl.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    imageLightboxEl.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 30) showImageInLightbox(dx < 0 ? imageIndex + 1 : imageIndex - 1);
    }, { passive: true });
}

function openImageLightbox(items, startIndex) {
    imageItems = items || [];
    imageIndex = startIndex || 0;
    if (!imageLightboxEl) setupImageLightbox();
    showImageInLightbox(imageIndex, true);
}

function showImageInLightbox(nextIndex, firstOpen = false) {
    if (!imageItems.length) return;
    imageIndex = (nextIndex + imageItems.length) % imageItems.length;
    const item = imageItems[imageIndex];
    if (!item) return;
    imageLightboxImg.src = item.src;
    imageLightboxImg.alt = item.alt || 'Screenshot';
    if (firstOpen) imageLightboxEl.classList.add('active');
}

// New function for eye tracking animation
function setupEyeTracking() {
    console.log("Attempting to set up eye tracking...");
    const eyesPlaceholder = document.querySelector('.animated-eyes-placeholder');
    // Important: Query *within* the placeholder to get the correct irises
    const irises = eyesPlaceholder?.querySelectorAll('.iris');

    if (!eyesPlaceholder || !irises || irises.length === 0) {
        console.error("Eye tracking setup failed: Could not find placeholder or iris elements.");
        return;
    }

    console.log(`Found ${irises.length} iris elements. Adding mouse listeners.`);

    const eyes = eyesPlaceholder.querySelectorAll('.eye'); // Get the eye elements
    let blinkTimeout; // Variable to hold the blink timer

    document.addEventListener('mousemove', (e) => {
        // Calculate cursor position relative to the center of the screen
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        
        // Calculate movement range - smaller value means less movement
        // These values might need tuning based on eye/iris size
        const moveX = x * 10; // Max horizontal movement in pixels
        const moveY = y * 10; // Max vertical movement in pixels

        irises.forEach(iris => {
            // Using requestAnimationFrame for smoother animation
            requestAnimationFrame(() => {
                iris.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
            });
        });
    });

    // Optional: Reset eyes when mouse leaves the window
     document.addEventListener('mouseleave', () => {
         irises.forEach(iris => {
             requestAnimationFrame(() => {
                 iris.style.transform = `translate(-50%, -50%)`; // Center the iris
            });
         });
     });

    // Function to trigger a blink on both eyes
    function triggerBlink() {
        eyes.forEach(eye => {
            const eyelid = eye.querySelector('.eyelid');
            if (eyelid) {
                 // Use direct style manipulation for a single blink
                eyelid.style.height = '100%'; // Close
                setTimeout(() => {
                    eyelid.style.height = '0'; // Open after short delay
                }, 150); // Blink duration
            }
        });
        // Schedule the next random blink
        scheduleNextBlink();
    }

    // Function to schedule the next blink at a random interval
    function scheduleNextBlink() {
        clearTimeout(blinkTimeout); // Clear any existing timer
        const randomDelay = Math.random() * 5000 + 2000; // Random delay between 2-7 seconds
        blinkTimeout = setTimeout(triggerBlink, randomDelay);
    }

    // Start the blinking cycle
    scheduleNextBlink();
}

// Function to handle theme toggling
function setupThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;

    // Function to apply the theme
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Accessible label and pressed state; visual anim handled via CSS
        toggleButton.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        toggleButton.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    };

    // Check initial theme - respect system preference if no saved theme
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    applyTheme(initialTheme);

    // Add click listener to toggle between light/dark
    toggleButton.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        // Small haptic-like feedback via class (for CSS micro-anim, optional)
        toggleButton.classList.remove('tapped');
        // force reflow
        void toggleButton.offsetWidth;
        toggleButton.classList.add('tapped');
    });

    // Listen for system theme changes if user hasn't manually set a theme
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
} 

// IntersectionObserver-based reveal
function setupReveals() {
    const targets = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || targets.length === 0) return;
    targets.forEach((el)=> el.classList.add('wait'));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    targets.forEach((el) => observer.observe(el));
}

// Add reveal to h2 on detail pages for polish
function decorateDetailHeadings() {
    document.querySelectorAll('.app-detail-page h2').forEach((h) => {
        h.classList.add('reveal', 'wait');
    });
}