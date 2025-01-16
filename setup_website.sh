#!/bin/bash

# Create the root directory for the website
mkdir -p website

# Navigate into the website directory
cd website

# Create main files
touch index.html styles.css

# Create subdirectories
mkdir -p assets/images assets/icons js

# Create image files in the images folder
touch assets/images/app-screenshot.png
touch assets/images/feature-1.png
touch assets/images/feature-2.png
touch assets/images/feature-3.png

# Create icon files in the icons folder
touch assets/icons/github.svg
touch assets/icons/twitter.svg

# Create the JavaScript file
touch js/main.js

echo "Website structure created successfully!"