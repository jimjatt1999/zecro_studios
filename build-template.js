const fs = require('fs');
const path = require('path');

// Header template
const headerTemplate = `
    <header class="site-header">
        <div class="container header-container">
            <div class="header-title-block">
                <a href="index.html" class="header-link">
                                            <div class="logo-title-container">
                            <img src="assets/zecrostudioslogo.jpeg" alt="Zecro Studios Logo" class="site-logo">
                            <h1>Zecro Studios</h1>
                        </div>
                    </a>
            </div>
            <nav class="header-nav">
                <a href="index.html" class="nav-link">Home</a>
                <a href="about.html" class="nav-link">About Developer</a>
                <button id="theme-toggle" class="theme-toggle">Dark</button>
            </nav>
        </div>
    </header>
`;

// Footer template
const footerTemplate = `
    <footer class="site-footer">
        <div class="container">
            <p>&copy; 2024 Zecro Studios</p>
            <p>Built by Jimi Olaoya</p>
            <p>Contact: <a href="mailto:jimjatt1999@gmail.com">jimjatt1999@gmail.com</a> | GitHub: <a href="https://github.com/jimjatt1999" target="_blank" rel="noopener noreferrer">@jimjatt1999</a></p>
        </div>
    </footer>
`;

// Function to build HTML files
function buildHTML(templatePath, outputPath, pageSpecificContent) {
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    template = template.replace('{{HEADER}}', headerTemplate);
    template = template.replace('{{FOOTER}}', footerTemplate);
    template = template.replace('{{CONTENT}}', pageSpecificContent);
    
    fs.writeFileSync(outputPath, template);
    console.log(`Built: ${outputPath}`);
}

// Example usage:
// buildHTML('templates/page-template.html', 'index.html', '<main>Your page content here</main>');

module.exports = { buildHTML, headerTemplate, footerTemplate }; 