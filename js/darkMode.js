class DarkMode {
    constructor() {
        this.darkMode = false;
        this.toggle = document.getElementById('themeToggle');
        this.toggleIcon = this.toggle.querySelector('img');
        this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.init();
    }

    init() {
        // Check saved preference first
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.darkMode = savedTheme === 'dark';
            this.setTheme(this.darkMode);
        } else {
            // If no saved preference, check system preference
            this.darkMode = this.prefersDark.matches;
            this.setTheme(this.darkMode);
        }

        // Setup event listeners
        this.toggle.addEventListener('click', () => this.toggleTheme());
        this.prefersDark.addEventListener('change', (e) => this.handleSystemPreference(e));

        // Add transition class after initial load
        setTimeout(() => {
            document.body.classList.add('theme-transition');
        }, 100);
    }

    setTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        this.updateIcon(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        // Dispatch event for other components that might need to react to theme changes
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { isDark } 
        }));
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        this.setTheme(this.darkMode);

        // Add animation class
        this.toggleIcon.classList.add('rotate');
        setTimeout(() => {
            this.toggleIcon.classList.remove('rotate');
        }, 300);
    }

    handleSystemPreference(e) {
        // Only update theme based on system preference if user hasn't set a preference
        if (!localStorage.getItem('theme')) {
            this.darkMode = e.matches;
            this.setTheme(this.darkMode);
        }
    }

    updateIcon(isDark) {
        // Update icon with transition
        this.toggleIcon.style.transform = `rotate(${isDark ? '360deg' : '0deg'})`;
        setTimeout(() => {
            this.toggleIcon.src = `assets/icons/${isDark ? 'sun' : 'moon'}.svg`;
        }, 150);

        // Update toggle button aria-label
        this.toggle.setAttribute('aria-label', 
            isDark ? 'Switch to light mode' : 'Switch to dark mode'
        );
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    new DarkMode();
});