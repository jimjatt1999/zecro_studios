class DarkMode {
    constructor() {
        this.darkMode = false;
        this.toggle = document.getElementById('darkModeToggle');
        this.toggleIcon = this.toggle.querySelector('img');
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

        // Setup event listeners
        this.toggle.addEventListener('click', () => this.toggleDarkMode());
        this.prefersDark.addEventListener('change', (e) => this.handleSystemPreference(e));

        // Initial icon update
        this.updateIcon();
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        const theme = this.darkMode ? 'dark' : 'light';
        
        // Add transition class
        document.body.classList.add('theme-transition');
        
        // Update theme
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update icon with animation
        this.updateIcon();
        
        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    }

    handleSystemPreference(e) {
        if (!localStorage.getItem('theme')) {
            this.darkMode = e.matches;
            document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
            this.updateIcon();
        }
    }

    updateIcon() {
        // Update icon source
        this.toggleIcon.src = `assets/icons/${this.darkMode ? 'sun' : 'moon'}.svg`;
        
        // Add rotation animation
        this.toggleIcon.style.transform = `rotate(${this.darkMode ? '360deg' : '0deg'})`;
        this.toggleIcon.style.transition = 'transform 0.3s ease';
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    new DarkMode();
});