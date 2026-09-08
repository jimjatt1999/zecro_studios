// 3D Book View & Interactive 360° Inspector
(function () {
    let modal = null;
    let stage = null;
    let model = null;
    let coverImg = null;
    let spineText = null;
    let titleEl = null;
    let authorEl = null;
    let noteEl = null;
    let currentRotY = -34;
    let targetRotY = -34;
    let currentRotX = 8;
    let targetRotX = 8;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let autoRotate = true;
    let autoRotateTimer = null;
    let animFrame = null;

    function buildModal() {
        if (document.getElementById('book-3d-modal')) {
            modal = document.getElementById('book-3d-modal');
            stage = modal.querySelector('.book-3d-viewer-stage');
            model = modal.querySelector('.book-3d-viewer-model');
            coverImg = modal.querySelector('#book-3d-view-cover');
            spineText = modal.querySelector('#book-3d-view-spine');
            titleEl = modal.querySelector('#book-3d-view-title');
            authorEl = modal.querySelector('#book-3d-view-author');
            noteEl = modal.querySelector('#book-3d-view-note');
            return;
        }

        modal = document.createElement('dialog');
        modal.id = 'book-3d-modal';
        modal.className = 'book-3d-modal';
        modal.setAttribute('aria-labelledby', 'book-3d-view-title');

        modal.innerHTML = `
            <div class="book-3d-modal-shell">
                <button type="button" class="book-3d-close-btn" id="book-3d-close" aria-label="Close">✕</button>

                <div class="book-3d-canvas-wrap" id="book-3d-drag-area">
                    <div class="book-3d-viewer-stage">
                        <div class="book-3d-viewer-model" id="book-3d-viewer-model">
                            <!-- Front Cover -->
                            <div class="book-face book-face-front">
                                <img id="book-3d-view-cover" src="" alt="">
                                <div class="book-cover-sheen"></div>
                                <div class="book-hinge-groove"></div>
                            </div>
                            <!-- Spine (Left) -->
                            <div class="book-face book-face-spine">
                                <div class="book-spine-rib book-spine-rib-top"></div>
                                <span id="book-3d-view-spine" class="book-spine-text"></span>
                                <div class="book-spine-rib book-spine-rib-bottom"></div>
                            </div>
                            <!-- Pages Block -->
                            <div class="book-face book-face-pages-right"></div>
                            <div class="book-face book-face-pages-top"></div>
                            <div class="book-face book-face-pages-bottom"></div>
                            <!-- Back Cover -->
                            <div class="book-face book-face-back">
                                <div class="book-back-inner">
                                    <span class="book-back-logo">ZECRO</span>
                                    <span class="book-back-sub">EDITION</span>
                                </div>
                            </div>
                        </div>
                        <div class="book-3d-viewer-shadow" id="book-3d-viewer-shadow"></div>
                    </div>
                </div>

                <div class="book-3d-info">
                    <h3 id="book-3d-view-title" class="book-3d-title"></h3>
                    <p id="book-3d-view-author" class="book-3d-author"></p>
                    <blockquote id="book-3d-view-note" class="book-3d-note" hidden></blockquote>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        stage = modal.querySelector('.book-3d-viewer-stage');
        model = modal.querySelector('.book-3d-viewer-model');
        coverImg = modal.querySelector('#book-3d-view-cover');
        spineText = modal.querySelector('#book-3d-view-spine');
        titleEl = modal.querySelector('#book-3d-view-title');
        authorEl = modal.querySelector('#book-3d-view-author');
        noteEl = modal.querySelector('#book-3d-view-note');

        const closeBtn = modal.querySelector('#book-3d-close');
        closeBtn?.addEventListener('click', closeViewer);

        modal.addEventListener('close', onModalClose);
        modal.addEventListener('click', (e) => {
            if (!e.target.closest('#book-3d-drag-area')) closeViewer();
        });

        initInteraction();
    }

    function initInteraction() {
        const dragArea = modal.querySelector('#book-3d-drag-area');
        if (!dragArea) return;

        function onPointerDown(e) {
            isDragging = true;
            startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            autoRotate = false;
            clearTimeout(autoRotateTimer);
            dragArea.classList.add('is-dragging');
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            const dx = x - startX;
            const dy = y - startY;

            targetRotY += dx * 0.72;
            targetRotX = Math.max(-42, Math.min(42, targetRotX - dy * 0.45));

            startX = x;
            startY = y;
        }

        function onPointerUp() {
            if (!isDragging) return;
            isDragging = false;
            dragArea.classList.remove('is-dragging');

            clearTimeout(autoRotateTimer);
            autoRotateTimer = setTimeout(() => {
                autoRotate = true;
            }, 3200);
        }

        dragArea.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        dragArea.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp, { passive: true });

        window.addEventListener('keydown', (e) => {
            if (!modal || !modal.open) return;
            if (e.key === 'ArrowLeft') {
                targetRotY -= 18;
                autoRotate = false;
            } else if (e.key === 'ArrowRight') {
                targetRotY += 18;
                autoRotate = false;
            } else if (e.key === 'ArrowUp') {
                targetRotX = Math.min(42, targetRotX + 12);
                autoRotate = false;
            } else if (e.key === 'ArrowDown') {
                targetRotX = Math.max(-42, targetRotX - 12);
                autoRotate = false;
            } else if (e.key === 'Escape') {
                closeViewer();
            }
        });
    }

    function renderLoop() {
        if (!modal || !modal.open) {
            animFrame = null;
            return;
        }

        if (autoRotate && !isDragging) {
            targetRotY += 0.28;
        }

        currentRotY += (targetRotY - currentRotY) * 0.12;
        currentRotX += (targetRotX - currentRotX) * 0.12;

        if (model) {
            model.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;
        }

        const shadow = modal.querySelector('#book-3d-viewer-shadow');
        if (shadow) {
            const rad = (currentRotY * Math.PI) / 180;
            const cos = Math.abs(Math.cos(rad));
            const sin = Math.abs(Math.sin(rad));
            const scaleX = 0.85 + sin * 0.35;
            const scaleY = 0.8 + cos * 0.25;
            const skew = Math.sin(rad) * 14;
            const opacity = 0.45 + cos * 0.25;
            shadow.style.transform = `translateX(-50%) rotateX(82deg) skewX(${skew.toFixed(1)}deg) scale(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)})`;
            shadow.style.opacity = opacity.toFixed(2);
        }

        animFrame = requestAnimationFrame(renderLoop);
    }

    function openViewer(book) {
        if (!book) return;
        buildModal();

        if (coverImg) {
            coverImg.src = book.cover || '';
            coverImg.alt = book.title;
        }
        if (spineText) spineText.textContent = book.title;
        if (titleEl) titleEl.textContent = book.title;
        if (authorEl) authorEl.textContent = book.author || '';
        if (noteEl) {
            noteEl.textContent = book.note || '';
            noteEl.hidden = !book.note;
        }

        currentRotY = -50;
        targetRotY = -34;
        currentRotX = 12;
        targetRotX = 8;
        autoRotate = true;

        if (!modal.open) {
            modal.showModal();
        }

        if (!animFrame) {
            animFrame = requestAnimationFrame(renderLoop);
        }
    }

    function closeViewer() {
        if (modal && modal.open) {
            modal.close();
        }
    }

    function onModalClose() {
        autoRotate = false;
        clearTimeout(autoRotateTimer);
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }
    }

    window.openBook3DViewer = openViewer;
    window.closeBook3DViewer = closeViewer;

    document.addEventListener('DOMContentLoaded', () => {
        const shelf = document.getElementById('water-books');
        if (!shelf) return;

        shelf.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.book-item');
            if (!card) return;
            const wrap = card.querySelector('.book-3d');
            if (!wrap) return;

            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;

            const tiltY = -28 + px * 24;
            const tiltX = 8 - py * 16;
            wrap.style.transform = `rotateY(${tiltY.toFixed(1)}deg) rotateX(${tiltX.toFixed(1)}deg) translateY(-8px) translateZ(12px)`;
        });

        shelf.addEventListener('mouseleave', () => {
            shelf.querySelectorAll('.book-3d').forEach((b) => {
                b.style.transform = '';
            });
        });
    });
})();
