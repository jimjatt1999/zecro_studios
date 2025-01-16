class DarkMode {
    constructor() {
        this.darkMode = false;
        this.toggle = document.getElementById('themeToggle');
        this.toggleIcon = this.toggle.querySelector('img');
        this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.init();
    }

    init() {
        // Check saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.darkMode = savedTheme === 'dark';
            this.setTheme(this.darkMode);
        } else {
            // Check system preference
            this.darkMode = this.prefersDark.matches;
            this.setTheme(this.darkMode);
        }

        // Setup event listeners
        this.toggle.addEventListener('click', () => this.toggleTheme());
        this.prefersDark.addEventListener('change', (e) => this.handleSystemPreference(e));
    }

    setTheme(isDark) {
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        this.updateIcon(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        this.setTheme(this.darkMode);
    }

    handleSystemPreference(e) {
        if (!localStorage.getItem('theme')) {
            this.darkMode = e.matches;
            this.setTheme(this.darkMode);
        }
    }

    updateIcon(isDark) {
        this.toggleIcon.src = `assets/icons/${isDark ? 'sun' : 'moon'}.svg`;
        this.toggleIcon.style.transform = `rotate(${isDark ? '360deg' : '0deg'})`;
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    new DarkMode();
});