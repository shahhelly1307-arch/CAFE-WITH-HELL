/**
 * Full 3D treehouse exploration — ground → stairs → cabin → decks → upper level
 */

gsap.registerPlugin(ScrollTrigger);

const EYE = 9.15;
const EYE_UPPER = 17.65;
window.EYE_HEIGHT = EYE;

const TABLES = {
    'table-2': { x: 3.0, z: 2.6 },
    'table-1': { x: -1.4, z: 0.4 },
    'table-3': { x: -1.8, z: -1.8 },
    'table-4': { x: 2.2, z: -1.5 }
};

function initScrollAnimations() {
    document.querySelectorAll('.scroll-section').forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            start: 'top 55%',
            end: 'bottom 45%',
            onToggle: (self) => {
                section.classList.toggle('active', self.isActive);
                if (self.isActive) {
                    const id = section.getAttribute('id');
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            }
        });
    });

    document.querySelectorAll('.nav-link, a.cta-btn[href]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href?.startsWith('#')) return;
            e.preventDefault();
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
        });
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('open');
                navMenu.classList.remove('open');
            });
        });
    }

    gsap.to('.hero-content .main-title', {
        scrollTrigger: { trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1 },
        y: -60, opacity: 0.3, ease: 'none'
    });

    const cam = { x: 6, y: 2.8, z: 36, lookX: 0, lookY: 14, lookZ: 0, fov: 60 };
    window.bookingWalkReady = false;
    window.scrollWalkActive = true;
    let lastHighlighted = null;

    function setHighlight(id) {
        if (lastHighlighted === id) return;
        if (lastHighlighted) window.highlightTable?.(lastHighlighted, false);
        lastHighlighted = id;
        if (id) window.highlightTable?.(id, true);
    }

    function updateCamera() {
        if (!camera) return;
        const bob = window.walkBob || 0;
        camera.position.set(cam.x, cam.y + bob, cam.z);
        camera.lookAt(cam.lookX, cam.lookY + bob * 0.3, cam.lookZ);
        if (cam.fov !== camera.fov) {
            camera.fov = cam.fov;
            camera.updateProjectionMatrix();
        }
        if (orbitControls) orbitControls.target.set(cam.lookX, cam.lookY, cam.lookZ);
    }

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#scroll-wrapper',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.1,
            onUpdate: (self) => {
                const p = self.progress;
                window.scrollWalkActive = p < 0.94;
                window.bookingWalkReady = p > 0.52;
                window.walkBob = (p > 0.06 && p < 0.9) ? Math.sin(Date.now() * 0.009) * 0.04 : 0;

                const hint = document.getElementById('scene-hint');
                if (hint && !window.freeExploreMode) {
                    if (p > 0.52 && p < 0.94) {
                        hint.classList.remove('hidden');
                        hint.querySelector('span:last-child').textContent =
                            window.userOrder ? 'Click a table — waiter delivers your order' : 'Click a glowing table to reserve';
                    } else if (p > 0.04) {
                        hint.classList.remove('hidden');
                        hint.querySelector('span:last-child').textContent = 'Scroll to tour the full treehouse';
                    } else {
                        hint.classList.add('hidden');
                    }
                }

                if (p > 0.54 && p < 0.62) setHighlight('table-2');
                else if (p > 0.62 && p < 0.70) setHighlight('table-1');
                else if (p > 0.78 && p < 0.84) setHighlight('table-3');
                else if (p > 0.84 && p < 0.90) setHighlight('table-4');
                else if (p < 0.54) setHighlight(null);

                if (p > 0.94 && !window.freeExploreMode) enableUserControls();
                else if (!window.freeExploreMode) disableUserControls();
            }
        }
    });

    tl.eventCallback('onUpdate', updateCamera);
    const door = window.cabinDoorHinge;

    // —— ACT 1: Forest approach ——
    tl.to(cam, { x: 5, y: 2.5, z: 28, lookX: 0, lookY: 12, lookZ: 2, fov: 58, ease: 'none' });
    tl.to(cam, { x: 3, y: 2, z: 14, lookX: 0, lookY: 9, lookZ: 4, ease: 'none' });

    // —— ACT 2: Climb spiral stairs ——
    tl.to(cam, { x: 2.5, y: 5.5, z: 7, lookX: 0, lookY: 8, lookZ: 2, ease: 'none' });
    tl.to(cam, { x: 1.5, y: 7.8, z: 3.5, lookX: 0.85, lookY: 8.8, lookZ: 2, ease: 'none' });

    // —— ACT 3: Door opens, enter cabin ——
    tl.to(cam, { x: 0.4, y: EYE, z: 2.4, lookX: 0.85, lookY: EYE, lookZ: 1.65, fov: 55, ease: 'none' });
    if (door) tl.to(door.rotation, { y: 1.65, ease: 'power1.inOut' }, '<');
    tl.to(cam, { x: 0.2, y: EYE, z: 1.2, lookX: -0.5, lookY: EYE + 0.15, lookZ: 0, ease: 'none' });
    tl.to(cam, { x: -0.7, y: EYE, z: 0, lookX: -1.5, lookY: EYE + 0.25, lookZ: -1.1, fov: 52, ease: 'none' });

    // —— ACT 4: Lower deck tables ——
    tl.to(cam, {
        x: TABLES['table-2'].x + 0.6, y: EYE, z: TABLES['table-2'].z + 1.3,
        lookX: TABLES['table-2'].x, lookY: EYE + 0.1, lookZ: TABLES['table-2'].z, fov: 48, ease: 'none'
    });
    tl.to(cam, {
        x: TABLES['table-1'].x + 0.7, y: EYE, z: TABLES['table-1'].z + 1.0,
        lookX: TABLES['table-1'].x, lookY: EYE + 0.12, lookZ: TABLES['table-1'].z, fov: 44, ease: 'none'
    });

    // —— ACT 5: Climb to upper crow's nest deck ——
    tl.to(cam, { x: 1.0, y: 11, z: 1.5, lookX: 0, lookY: 14, lookZ: 0, fov: 50, ease: 'none' });
    tl.to(cam, { x: 0.5, y: 14, z: 0, lookX: 0, lookY: 16, lookZ: -1, ease: 'none' });
    tl.to(cam, {
        x: TABLES['table-3'].x + 1.2, y: EYE_UPPER, z: TABLES['table-3'].z + 1.5,
        lookX: TABLES['table-3'].x, lookY: EYE_UPPER, lookZ: TABLES['table-3'].z, fov: 46, ease: 'none'
    });
    tl.to(cam, {
        x: TABLES['table-4'].x + 1.0, y: EYE_UPPER, z: TABLES['table-4'].z + 1.2,
        lookX: TABLES['table-4'].x, lookY: EYE_UPPER, lookZ: TABLES['table-4'].z, fov: 42, ease: 'none'
    });

    // —— ACT 6: Exterior reveal ——
    tl.to(cam, { x: -12, y: 18, z: 16, lookX: 0, lookY: 12, lookZ: 0, fov: 55, ease: 'none' });
    tl.to(cam, { x: 0, y: 22, z: 24, lookX: 0, lookY: 11, lookZ: 0, fov: 58, ease: 'none' });

    updateCamera();
}

function enableUserControls() {
    if (orbitControls && !orbitControls.enabled) {
        orbitControls.enabled = true;
        document.getElementById('webgl-canvas').style.cursor = 'grab';
    }
}

function disableUserControls() {
    if (orbitControls && orbitControls.enabled && !window.freeExploreMode) {
        orbitControls.enabled = false;
        document.getElementById('webgl-canvas').style.cursor = 'default';
    }
}

window.enableUserControls = enableUserControls;

window.addEventListener('load', () => setTimeout(initScrollAnimations, 300));
