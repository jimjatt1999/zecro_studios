// Shizen MacBook 3D Model Viewer
class MacBookViewer {
    constructor(containerSelector) {
        // Container element
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Container not found:', containerSelector);
            return;
        }

        // Screenshots
        this.screenshots = [
            'assets/images/app_screenshots/1.png',
            'assets/images/app_screenshots/2.png',
            'assets/images/app_screenshots/3.png',
            'assets/images/app_screenshots/4.png',
            'assets/images/app_screenshots/5.png'
        ];
        this.currentScreenshotIndex = 0;
        this.isTransitioning = false;

        // Control elements
        this.prevButton = document.getElementById('prevScreenshot');
        this.nextButton = document.getElementById('nextScreenshot');
        this.indicatorsContainer = document.getElementById('modelIndicators');

        // Three.js properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.macbookModel = null;
        this.screenMesh = null;
        this.matteMesh = null;
        this.controls = null;
        this.animationFrame = null;
        this.screenTexture = null;
        this.clock = new THREE.Clock();
        this.mixer = null;
        
        // Loading timeout - reduced for faster fallback
        this.loadingTimeout = null;
        this.loadingStartTime = Date.now();
        this.isUsingFallback = false;
        
        // Scroll position
        this.scrollY = 0;
        this.targetRotation = 0;
        
        // Check if device is likely low-end
        this.isLowEndDevice = window.navigator.hardwareConcurrency <= 4 || 
                             !this.hasWebGLSupport() || 
                             window.innerWidth < 768;

        // For low-end devices, use fallback immediately
        if (this.isLowEndDevice) {
            this.showFallback();
        } else {
            // Initialize 3D for capable devices
            this.init();
        }
    }
    
    hasWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    init() {
        // Set loading timeout - fallback to static image if model takes too long (reduced to 4 seconds)
        this.loadingTimeout = setTimeout(() => {
            this.showFallback();
        }, 4000); 
        
        this.setupThreeJS();
        this.setupLights();
        this.loadMacBookModel();
        this.setupControls();
        this.createIndicators();
        this.animate();
        
        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Scroll handler for opening/closing animation
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            this.scrollY = Math.min(Math.max(scrollPosition / maxScroll, 0), 1);
        });
        
        // Update loading message after a few seconds
        setTimeout(() => {
            const loadingText = this.container.querySelector('.loading-spinner p');
            if (loadingText && !this.isUsingFallback) {
                loadingText.textContent = "Still loading... switching to simplified view soon";
                loadingText.classList.add('loading-timeout');
            }
        }, 2000);
    }

    showFallback() {
        if (this.isUsingFallback) return;
        console.log('Switching to simplified view after', (Date.now() - this.loadingStartTime)/1000, 'seconds');
        
        // Mark as using fallback
        this.isUsingFallback = true;
        
        // Clean up 3D resources
        this.cleanup();
        
        // Remove loading spinner
        const loadingSpinner = this.container.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.remove();
        }
        
        // Create a fallback image display (without error message)
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'fallback-container';
        fallbackDiv.style.width = '100%';
        fallbackDiv.style.height = '100%';
        fallbackDiv.style.position = 'relative';
        
        const fallbackImg = document.createElement('img');
        fallbackImg.src = this.screenshots[0];
        fallbackImg.alt = 'Shizen App Screenshot';
        fallbackImg.className = 'fallback-image';
        
        fallbackDiv.appendChild(fallbackImg);
        
        // Clear container and add fallback content
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.container.appendChild(fallbackDiv);
        
        // Enable controls for fallback view
        this.setupFallbackNavigation();
    }
    
    setupFallbackNavigation() {
        // Make controls visible
        const controlsEl = document.querySelector('.model-controls');
        if (controlsEl) {
            controlsEl.style.opacity = '1';
            controlsEl.style.pointerEvents = 'all';
        }
        
        // Update event listeners for fallback mode
        if (this.prevButton) {
            this.prevButton.onclick = () => this.changeFallbackImage(-1);
        }
        
        if (this.nextButton) {
            this.nextButton.onclick = () => this.changeFallbackImage(1);
        }
        
        // Create indicators for fallback
        this.updateIndicators();
        
        // Set up indicator clicks
        const indicators = document.querySelectorAll('.model-indicator');
        indicators.forEach((indicator, index) => {
            indicator.onclick = () => this.goToFallbackImage(index);
        });
    }
    
    changeFallbackImage(direction) {
        this.currentScreenshotIndex = (this.currentScreenshotIndex + direction + this.screenshots.length) % this.screenshots.length;
        const fallbackImage = this.container.querySelector('.fallback-image');
        if (fallbackImage) {
            fallbackImage.src = this.screenshots[this.currentScreenshotIndex];
        }
        this.updateIndicators();
    }
    
    goToFallbackImage(index) {
        if (index === this.currentScreenshotIndex) return;
        this.currentScreenshotIndex = index;
        const fallbackImage = this.container.querySelector('.fallback-image');
        if (fallbackImage) {
            fallbackImage.src = this.screenshots[this.currentScreenshotIndex];
        }
        this.updateIndicators();
    }

    setupThreeJS() {
        // Create scene with minimized settings
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);

        // Setup camera with better parameters for performance
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(12, width / height, 0.1, 1000);
        this.camera.position.set(0, -10, 220);

        // Optimize renderer for performance - use WebGL1 for broader compatibility
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,  // Disable antialiasing for performance
            alpha: true,
            powerPreference: 'high-performance',
            precision: 'lowp'  // Use low precision for better performance
        });
        this.renderer.setSize(width, height);
        
        // Use lowest possible pixel ratio for better performance
        this.renderer.setPixelRatio(1);
        
        // Disable physically correct lights to improve performance
        this.renderer.physicallyCorrectLights = false;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Disable shadows completely for performance
        this.renderer.shadowMap.enabled = false;
        
        // Add renderer to DOM
        this.container.appendChild(this.renderer.domElement);
    }

    setupLights() {
        // Ultra simplified lighting for performance
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 10, 10);
        this.scene.add(mainLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
    }

    loadMacBookModel() {
        // Preload the first screenshot texture
        const textureLoader = new THREE.TextureLoader();
        this.screenTexture = textureLoader.load(
            this.screenshots[0],
            // Success callback
            () => {},
            // Progress callback
            () => {},
            // Error callback
            (err) => {
                console.error('Error loading texture:', err);
            }
        );
        
        // Use a simpler, lighter loader approach
        const loader = new THREE.GLTFLoader();
        
        // Simplified GLB loading with early timeouts
        loader.load(
            'models/mac.glb',
            (gltf) => {
                // Cancel timeout since model loaded successfully
                if (this.loadingTimeout) {
                    clearTimeout(this.loadingTimeout);
                    this.loadingTimeout = null;
                }
                
                // Don't process model if we've already switched to fallback
                if (this.isUsingFallback) return;
                
                this.macbookModel = gltf.scene;
                this.macbookModel.position.set(0, -14, 20);
                
                // Use a simplified approach to finding and setting up the important meshes
                this.setupModelMeshes(gltf.scene);
                
                // Add model to scene
                this.scene.add(this.macbookModel);
                
                // Hide loading spinner
                const loadingSpinner = this.container.querySelector('.loading-spinner');
                if (loadingSpinner) {
                    loadingSpinner.style.display = 'none';
                }
                
                console.log('Model loaded successfully in', (Date.now() - this.loadingStartTime)/1000, 'seconds');
            },
            (xhr) => {
                // Loading progress
                const progress = Math.round(xhr.loaded / xhr.total * 100);
                const loadingText = this.container.querySelector('.loading-spinner p');
                if (loadingText && progress > 0 && progress < 100) {
                    loadingText.textContent = `Loading: ${progress}%`;
                }
                
                // If loading is too slow (over 50% after 3 seconds), show fallback
                if (Date.now() - this.loadingStartTime > 3000 && progress < 50) {
                    if (this.loadingTimeout) {
                        clearTimeout(this.loadingTimeout);
                        this.loadingTimeout = null;
                    }
                    this.showFallback();
                }
            },
            (error) => {
                // Error handling
                console.error('Error loading model:', error);
                this.showFallback();
            }
        );
    }
    
    setupModelMeshes(model) {
        // Fast traversal to find screen and matte meshes
        model.traverse((node) => {
            if (node.isMesh) {
                // Check mesh names
                if (node.name === 'screen') {
                    this.screenMesh = node;
                    this.screenMesh.rotation.x = THREE.MathUtils.degToRad(180);
                } else if (node.name === 'matte') {
                    this.matteMesh = node;
                    
                    // Apply preloaded texture
                    if (this.screenTexture) {
                        // Simplify material setup for performance
                        this.matteMesh.material.map = this.screenTexture;
                        this.matteMesh.material.needsUpdate = true;
                    }
                }
                
                // Apply universal optimizations to all meshes
                node.frustumCulled = true; // Enable culling
                node.matrixAutoUpdate = false; // Disable auto matrix updates
                node.updateMatrix(); // Update matrix once
                
                // Simplify materials
                if (node.material) {
                    node.material.precision = 'lowp';
                    node.material.fog = false;
                    node.material.flatShading = true;
                    node.material.lights = false;
                }
            }
        });
    }

    setupControls() {
        // Only set up Three.js controls if we're not using fallback and controls are needed
        if (!this.isUsingFallback) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            
            // Limit controls even further
            this.controls.minPolarAngle = Math.PI / 3;
            this.controls.maxPolarAngle = Math.PI / 2.5;
            this.controls.minDistance = 150;
            this.controls.maxDistance = 250;
            this.controls.enableRotate = false;
            this.controls.enableZoom = false; // Disable zoom for better performance
        }
        
        // Set up navigation controls
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => this.prevScreenshot());
        }
        
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.nextScreenshot());
        }
    }

    createIndicators() {
        if (!this.indicatorsContainer) return;
        
        this.indicatorsContainer.innerHTML = '';
        this.screenshots.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = index === this.currentScreenshotIndex ? 'model-indicator active' : 'model-indicator';
            indicator.onclick = () => this.goToScreenshot(index);
            this.indicatorsContainer.appendChild(indicator);
        });
    }

    updateIndicators() {
        if (!this.indicatorsContainer) return;
        
        const indicators = this.indicatorsContainer.querySelectorAll('.model-indicator');
        indicators.forEach((indicator, index) => {
            if (index === this.currentScreenshotIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    goToScreenshot(index) {
        if (this.isUsingFallback) {
            this.goToFallbackImage(index);
            return;
        }
        
        if (index === this.currentScreenshotIndex || this.isTransitioning) return;
        this.isTransitioning = true;
        this.currentScreenshotIndex = index;
        this.updateScreenshot();
    }

    nextScreenshot() {
        if (this.isUsingFallback) {
            this.changeFallbackImage(1);
            return;
        }
        
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.currentScreenshotIndex = (this.currentScreenshotIndex + 1) % this.screenshots.length;
        this.updateScreenshot();
    }

    prevScreenshot() {
        if (this.isUsingFallback) {
            this.changeFallbackImage(-1);
            return;
        }
        
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.currentScreenshotIndex = (this.currentScreenshotIndex - 1 + this.screenshots.length) % this.screenshots.length;
        this.updateScreenshot();
    }

    updateScreenshot() {
        if (!this.matteMesh || this.isUsingFallback) return;
        
        // Load new texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            this.screenshots[this.currentScreenshotIndex],
            (texture) => {
                // Apply new texture
                this.screenTexture = texture;
                this.matteMesh.material.map = this.screenTexture;
                this.matteMesh.material.needsUpdate = true;
                
                // Update indicators
                this.updateIndicators();
                
                // Reset transition state with a small delay
                setTimeout(() => {
                    this.isTransitioning = false;
                }, 300);
            }
        );
    }

    onWindowResize() {
        if (this.isUsingFallback) return;
        
        // Update camera aspect ratio
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(width, height);
    }

    animate() {
        if (this.isUsingFallback) return;
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Animate screen opening/closing based on scroll position with less frequently updated rotation
        if (this.screenMesh) {
            // Calculate target rotation based on scroll position (180° when closed, 90° when fully open)
            const targetRotation = THREE.MathUtils.degToRad(180 - this.scrollY * 60);
            
            // Use a larger delta for faster, less smooth animation (better performance)
            this.screenMesh.rotation.x += (targetRotation - this.screenMesh.rotation.x) * 0.1;
            
            // Only update the matrix when needed
            this.screenMesh.updateMatrix();
        }
        
        // Render the scene (simplified for better performance)
        this.renderer.render(this.scene, this.camera);
    }

    cleanup() {
        // Clean up Three.js resources
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Clear references to avoid memory leaks
        this.scene = null;
        this.camera = null;
        this.macbookModel = null;
        this.screenMesh = null;
        this.matteMesh = null;
    }
}

// Initialize MacBook viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const macbookViewer = new MacBookViewer('#macbook-container');
    
    // Store instance in window for debugging
    window.macbookViewer = macbookViewer;
}); 