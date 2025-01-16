class DarkMode {
    constructor() {
        this.darkMode = false;
        this.toggle = document.getElementById('darkModeToggle');
        this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.init();
    }

    init() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            this.darkMode = savedTheme === 'dark';
        } else {
            // Check system preference
            this.darkMode = this.prefersDark.matches;
            document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        }

        // Setup event listeners
        this.toggle.addEventListener('click', () => this.toggleDarkMode());
        this.prefersDark.addEventListener('change', (e) => this.handleSystemPreference(e));

        // Update toggle button
        this.updateToggleButton();
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
        this.updateToggleButton();

        // Add transition animation
        document.body.style.transition = 'background-color 0.3s, color 0.3s';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    handleSystemPreference(e) {
        if (!localStorage.getItem('theme')) {
            this.darkMode = e.matches;
            document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
            this.updateToggleButton();
        }
    }

    updateToggleButton() {
        const icon = this.toggle.querySelector('img');
        icon.style.transform = this.darkMode ? 'rotate(360deg)' : 'rotate(0deg)';
        icon.style.transition = 'transform 0.3s ease';
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    new DarkMode();
});