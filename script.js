// Shizen app studio script
// Add interactivity later (e.g., dark mode toggle)

document.addEventListener('DOMContentLoaded', () => {
    console.log('Shizen app studio site loaded.');

    setupScreenshotGalleries();
    setupVideoLightbox();
    setupThemeToggle();
    setupReveals();
    decorateDetailHeadings();

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

function setupVideoLightbox() {
    const videoLinks = document.querySelectorAll('.video-link');
    const lightbox = document.getElementById('video-lightbox');

    // Check if the lightbox element itself exists first!
    if (!lightbox) {
        // If no lightbox on this page, maybe hide video links or just exit
        // console.log("No video lightbox found on this page.");
        return; 
    }

    // Now that we know lightbox exists, query inside it
    const lightboxVideo = lightbox.querySelector('video');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    // Check if the inner elements exist
    if (!lightboxVideo || !closeBtn) {
        console.error("Lightbox structure incomplete. Video or close button missing.");
        return;
    }

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
        // Update button text to show current theme
        toggleButton.textContent = theme === 'light' ? 'Dark' : 'Light';
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