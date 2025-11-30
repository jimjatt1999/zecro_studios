document.addEventListener('DOMContentLoaded', () => {
    // 1. Tokyo Digital Clock
    function updateTokyoClock() {
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (hoursEl && minutesEl && secondsEl) {
            const now = new Date();
            // Get Tokyo time (JST is UTC+9)
            const tokyoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

            const hours = String(tokyoTime.getHours()).padStart(2, '0');
            const minutes = String(tokyoTime.getMinutes()).padStart(2, '0');
            const seconds = String(tokyoTime.getSeconds()).padStart(2, '0');

            hoursEl.textContent = hours;
            minutesEl.textContent = minutes;
            secondsEl.textContent = seconds;
        }

        // Legacy time element (for other pages)
        const timeElement = document.getElementById('time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
    }
    setInterval(updateTokyoClock, 1000);
    updateTokyoClock();

    // 2. Typing Animation for Subtitle (Looping)
    const subtitleElement = document.querySelector('.subtitle');
    if (subtitleElement) {
        const textToType = "[creative space by jimi olaoya]";
        let charIndex = 0;
        let isDeleting = false;

        function typeLoop() {
            const currentText = textToType.substring(0, charIndex);
            subtitleElement.textContent = currentText;

            if (!isDeleting && charIndex < textToType.length) {
                // Typing
                charIndex++;
                setTimeout(typeLoop, 100);
            } else if (isDeleting && charIndex > 0) {
                // Deleting
                charIndex--;
                setTimeout(typeLoop, 50);
            } else {
                // Switching state
                isDeleting = !isDeleting;
                // Pause before deleting or re-typing
                setTimeout(typeLoop, isDeleting ? 2000 : 500);
            }
        }

        // Start the loop
        typeLoop();
    }
});
