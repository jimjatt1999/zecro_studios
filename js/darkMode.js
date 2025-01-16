class DarkMode {
    constructor() {
        this.darkMode = false;
        this.toggle = document.getElementById('darkModeToggle');
        this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.init();
    }

    init() {
        // Check saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            this.darkMode = savedTheme === 'dark';
        } else {
            // Check system preference
            this.darkMode = this.prefersDark.matches;
            document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        }

        // Setup listeners
        this.toggle.addEventListener('click', () => this.toggleDarkMode());
        this.prefersDark.addEventListener('change', (e) => this.handleSystemPreference(e));
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    }

    handleSystemPreference(e) {
        if (!localStorage.getItem('theme')) {
            this.darkMode = e.matches;
            document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        }
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    new DarkMode();
});