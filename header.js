// Reusable header component
function createHeader() {
    return `
        <header class="site-header">
            <div class="container header-container">
                <div class="header-title-block">
                    <a href="index.html" class="header-link">
                        <div class="logo-title-container">
                            <img src="assets/zecrostudioslogo.jpeg" alt="Zecro Studios Logo" class="site-logo">
                            <h1>Zecro Studios</h1>
                        </div>
                    </a>
                    <p class="subtitle">Cool, useful projects built with care.</p>
                </div>
                <nav class="header-nav">
                    <a href="index.html" class="nav-link ${window.location.pathname.includes('index.html') || window.location.pathname === '/' ? 'active' : ''}">Home</a>
                    <a href="about.html" class="nav-link ${window.location.pathname.includes('about.html') ? 'active' : ''}">About Developer</a>
                    <button id="theme-toggle" class="theme-toggle">Dark</button>
                </nav>
            </div>
        </header>
    `;
}

// Inject header into page
document.addEventListener('DOMContentLoaded', function() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = createHeader();
        
        // Re-initialize theme toggle functionality
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            // Copy theme toggle logic from script.js
            initializeThemeToggle();
        }
    }
});

function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check for saved theme preference or default to 'light' mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'dark' ? 'Light' : 'Dark';

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? 'Light' : 'Dark';
    });
} 