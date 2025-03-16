class DarkMode {
    constructor() {
        this.darkMode = false;
        this.toggle = document.getElementById('themeToggle');
        this.floatingToggle = document.getElementById('floatingThemeToggle');
        
        // Make sure elements are found before accessing properties
        if (this.toggle) {
            this.toggleIcon = this.toggle.querySelector('img');
        } else {
            console.error('Theme toggle button not found');
            return;
        }
        
        if (this.floatingToggle) {
            this.floatingToggleIcon = this.floatingToggle.querySelector('img');
        } else {
            console.warn('Floating theme toggle button not found');
            this.floatingToggleIcon = null;
        }
        
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
        if (this.floatingToggle) {
            this.floatingToggle.addEventListener('click', () => this.toggleTheme());
        }
        this.prefersDark.addEventListener('change', (e) => this.handleSystemPreference(e));

        // Add transition class after initial load
        setTimeout(() => {
            document.body.classList.add('theme-transition');
        }, 100);
        
        console.log('Dark mode initialized with state:', this.darkMode);
    }

    setTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        this.updateIcons(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        // Dispatch event for other components that might need to react to theme changes
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { isDark } 
        }));
        
        // Smoothly transition between screenshot sets
        this.updateScreenshots(isDark);
    }
    
    updateScreenshots(isDark) {
        // This is optional as CSS handles the transition,
        // but we could add additional animations here if needed
        const lightScreenshots = document.querySelector('.light-screenshots');
        const darkScreenshots = document.querySelector('.dark-screenshots');
        
        if (lightScreenshots && darkScreenshots) {
            // Apply any special transition effects if needed
            console.log(`Switching to ${isDark ? 'dark' : 'light'} screenshots`);
        }
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        this.setTheme(this.darkMode);

        // Add animation class to both icons
        this.toggleIcon.classList.add('rotate');
        if (this.floatingToggleIcon) {
            this.floatingToggleIcon.classList.add('rotate');
        }
        
        setTimeout(() => {
            this.toggleIcon.classList.remove('rotate');
            if (this.floatingToggleIcon) {
                this.floatingToggleIcon.classList.remove('rotate');
            }
        }, 500);
    }

    handleSystemPreference(e) {
        // Only update theme based on system preference if user hasn't set a preference
        if (!localStorage.getItem('theme')) {
            this.darkMode = e.matches;
            this.setTheme(this.darkMode);
        }
    }

    updateIcons(isDark) {
        // Update icons with transition
        setTimeout(() => {
            this.toggleIcon.src = `assets/icons/${isDark ? 'sun' : 'moon'}.svg`;
            if (this.floatingToggleIcon) {
                this.floatingToggleIcon.src = `assets/icons/${isDark ? 'sun' : 'moon'}.svg`;
            }
        }, 150);

        // Update toggle buttons aria-label
        this.toggle.setAttribute('aria-label', 
            isDark ? 'Switch to light mode' : 'Switch to dark mode'
        );
        
        if (this.floatingToggle) {
            this.floatingToggle.setAttribute('aria-label', 
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
            );
        }
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    try {
        new DarkMode();
    } catch (e) {
        console.error('Error initializing dark mode:', e);
    }
});