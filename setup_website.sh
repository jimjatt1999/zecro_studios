#!/bin/bash

# Create the root directory for the project
mkdir -p shizen-website

# Navigate into the shizen-website directory
cd shizen-website

# Create main files
touch index.html styles.css README.md

# Create the assets directory structure
mkdir -p assets/images/features
mkdir -p assets/icons
mkdir -p assets/videos

# Create image files in the images folder
touch assets/images/features/media-processing.svg
touch assets/images/features/ai-analysis.svg
touch assets/images/features/smart-review.svg
touch assets/images/app-screenshot.png
touch assets/images/demo-thumbnail.jpg
touch assets/images/logo.svg

# Create icon files in the icons folder
touch assets/icons/github.svg
touch assets/icons/x.svg
touch assets/icons/moon.svg
touch assets/icons/mac.svg
touch assets/icons/windows.svg

# Create video files in the videos folder
touch assets/videos/demo.mp4

# Create the js directory and main JavaScript files
mkdir -p js
touch js/main.js
touch js/darkMode.js

echo "shizen-website structure created successfully!"