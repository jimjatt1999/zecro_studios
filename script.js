// Shizen app studio script
// Add interactivity later (e.g., dark mode toggle)

document.addEventListener('DOMContentLoaded', () => {
    console.log('Shizen app studio site loaded.');

    setupScreenshotGalleries();
    setupVideoLightbox();
    setupThemeToggle();

    // Run eye tracking only on the neuralai page
    if (document.body.id === 'page-neuralai') {
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

        if (images.length <= 1) {
             // Hide controls if only one image
             if (prevBtn) prevBtn.style.display = 'none';
             if (nextBtn) nextBtn.style.display = 'none';
             if (indicatorsContainer) indicatorsContainer.style.display = 'none';
             return; // No setup needed for single image galleries
        }

        // Create indicators
        if (indicatorsContainer) {
             // Clear existing dots if any (useful for dynamic updates later)
            indicatorsContainer.innerHTML = '';
            images.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.classList.add('indicator-dot');
                if (index === 0) dot.classList.add('active');
                dot.addEventListener('click', () => showImage(index));
                indicatorsContainer.appendChild(dot);
            });
        }
        const indicators = indicatorsContainer ? indicatorsContainer.querySelectorAll('.indicator-dot') : null;

        function showImage(index) {
            images[currentIndex].classList.remove('active');
            if (indicators) indicators[currentIndex].classList.remove('active');

            currentIndex = (index + images.length) % images.length; // Loop around

            images[currentIndex].classList.add('active');
            if (indicators) indicators[currentIndex].classList.add('active');
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
        }
    });
}

function setupVideoLightbox() {
    const videoLinks = document.querySelectorAll('.video-link');
    const lightbox = document.getElementById('video-lightbox');
    const lightboxVideo = lightbox.querySelector('video');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    if (!lightbox || !lightboxVideo || !closeBtn) return;

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
    console.log("Attempting to set up eye tracking..."); // Debug log
    const eyesPlaceholder = document.querySelector('.animated-eyes-placeholder');
    const irises = eyesPlaceholder?.querySelectorAll('.iris');

    if (!irises || irises.length === 0) {
        console.error("Eye tracking setup failed: Could not find iris elements."); // Debug log
        return;
    }

    console.log(`Found ${irises.length} iris elements. Adding mouse listeners.`); // Debug log

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        const moveX = x * 25; // Adjust multiplier for sensitivity
        const moveY = y * 20;

        irises.forEach(iris => {
            // Using requestAnimationFrame for smoother updates
            requestAnimationFrame(() => {
                iris.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
            });
        });
    });

    // Reset eyes when mouse leaves window
     document.addEventListener('mouseleave', () => {
         console.log("Mouse left window, resetting eyes."); // Debug log
         irises.forEach(iris => {
             requestAnimationFrame(() => {
                 iris.style.transform = `translate(-50%, -50%)`;
            });
         });
     });
}

// Function to handle theme toggling
function setupThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;

    // Function to apply the theme
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        console.log(`Theme set to ${theme}`);
    };

    // Check initial theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(currentTheme);

    // Add click listener
    toggleButton.addEventListener('click', () => {
        let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Optional: Listen for OS theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only change if no theme is explicitly saved by the user
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
} 