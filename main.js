document.addEventListener('DOMContentLoaded', () => {
    // 1. Time Update
    function updateTime() {
        const timeElement = document.getElementById('time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
    }
    setInterval(updateTime, 1000);
    updateTime();

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
