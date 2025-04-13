// Shizen app studio script
// Add interactivity later (e.g., dark mode toggle)

document.addEventListener('DOMContentLoaded', () => {
    console.log('Shizen app studio site loaded.');

    setupScreenshotGalleries();
    setupVideoLightbox();
    setupThemeToggle();

    // Run eye tracking only on the neura page
    if (document.body.id === 'page-neura') {
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
        // Update button text based on the NEXT theme it will switch to
        let nextThemeText = '';
        if (theme === 'light') nextThemeText = 'Dark';
        else if (theme === 'dark') nextThemeText = 'GB'; // GB for Game Boy
        else nextThemeText = 'Light'; // After GB comes Light
        toggleButton.textContent = nextThemeText;
        console.log(`Theme set to ${theme}, button shows ${nextThemeText}`);
    };

    // Check initial theme
    const savedTheme = localStorage.getItem('theme');
    // No longer rely solely on prefers-color-scheme for initial, prioritize saved
    const initialTheme = savedTheme || 'light'; // Default to light if nothing saved
    applyTheme(initialTheme);

    // Add click listener to cycle themes
    toggleButton.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme;
        if (currentTheme === 'light') {
            newTheme = 'dark';
        } else if (currentTheme === 'dark') {
            newTheme = 'gameboy';
        } else { // If current is gameboy (or anything else unexpected), go to light
            newTheme = 'light';
        }
        applyTheme(newTheme);
    });

    // Remove the OS theme change listener for simplicity with three themes
    /* 
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only change if no theme is explicitly saved by the user
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
    */
} 