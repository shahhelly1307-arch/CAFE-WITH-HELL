/**
 * UI: menu rendering, gallery, dark mode, contact validation
 */

window.userOrder = null;

const CATEGORY_LABELS = {
    coffee: 'Coffee',
    fastfood: 'Fast Food',
    desserts: 'Desserts',
    beverages: 'Beverages',
    specials: 'Special Dishes'
};

const WAITER_MAP = {
    coffee: 'coffee',
    fastfood: 'bakery',
    desserts: 'bakery',
    beverages: 'elixirs',
    specials: 'bakery'
};

function formatINR(price) {
    return '₹' + price.toLocaleString('en-IN');
}

function setUserOrder(item, category) {
    window.userOrder = { ...item, category, waiterType: WAITER_MAP[category] || 'coffee' };
    const banner = document.getElementById('order-banner');
    const nameEl = document.getElementById('order-item-name');
    if (banner) banner.classList.remove('hidden');
    if (nameEl) nameEl.textContent = `${item.name} — ${formatINR(item.price)}`;
    document.querySelectorAll('.menu-card.selected').forEach(el => el.classList.remove('selected'));
    if (typeof placeFoodOnTray === 'function' && window.waiterGroup) {
        placeFoodOnTray({ ...item, category: window.userOrder.waiterType });
    }
}

function renderMenu(searchTerm = '') {
    const term = searchTerm.toLowerCase().trim();
    Object.keys(CAFE_MENU).forEach(cat => {
        const container = document.getElementById(`${cat}-items`);
        if (!container) return;
        const filtered = CAFE_MENU[cat].filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.desc.toLowerCase().includes(term)
        );
        if (!filtered.length) {
            container.innerHTML = '<p class="no-results">No items match your search.</p>';
            return;
        }
        container.innerHTML = filtered.map(item => `
            <article class="menu-card ${window.userOrder?.id === item.id ? 'selected' : ''}" data-id="${item.id}">
                <div class="menu-card-img" style="background-image:url('${item.image}')"></div>
                <div class="menu-card-body">
                    <div class="menu-item-header">
                        <h4 class="menu-name">${item.name}</h4>
                        <span class="menu-price">${formatINR(item.price)}</span>
                    </div>
                    <p class="menu-desc">${item.desc}</p>
                    <button type="button" class="menu-order-btn">+ Add to Order</button>
                </div>
            </article>
        `).join('');
        container.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const item = CAFE_MENU[cat].find(i => i.id === card.dataset.id);
                if (item) setUserOrder(item, cat);
                renderMenu(document.getElementById('menu-search')?.value || '');
            });
        });
    });
}

const GALLERY_IMAGES = [
    { src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', alt: 'Treehouse exterior in forest' },
    { src: 'https://images.unsplash.com/photo-1493857671505-7297e71e2c48?w=600&q=80', alt: 'Cozy cafe interior' },
    { src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80', alt: 'Coffee and pastries' },
    { src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80', alt: 'Cafe seating area' },
    { src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=80', alt: 'Forest canopy view' },
    { src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80', alt: 'Artisan coffee pour' },
    { src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80', alt: 'Restaurant ambiance' },
    { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', alt: 'Fine dining table setting' }
];

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = GALLERY_IMAGES.map((img, i) => `
        <figure class="gallery-item" style="animation-delay:${i * 0.08}s">
            <img src="${img.src}" alt="${img.alt}" loading="lazy">
            <figcaption>${img.alt}</figcaption>
        </figure>
    `).join('');
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.toggle('active', c.id === `tab-${tabId}`);
            });
        });
    });
}

function initDarkMode() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const saved = localStorage.getItem('canopy-theme');
    if (saved === 'dark') document.body.classList.add('dark-mode');
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('canopy-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}

function initExploreMode() {
    const btn = document.getElementById('explore-3d-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        window.freeExploreMode = true;
        if (typeof enableUserControls === 'function') enableUserControls();
        window.bookingWalkReady = true;
        document.getElementById('reserve-section')?.scrollIntoView({ behavior: 'smooth' });
        const hint = document.getElementById('scene-hint');
        if (hint) {
            hint.classList.remove('hidden');
            hint.querySelector('span:last-child').textContent = 'Drag to explore the full treehouse · Click tables to book';
        }
    });
}

function validateContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;
        const fields = [
            { id: 'contact-name', rule: v => v.trim().length >= 2, msg: 'Enter your full name' },
            { id: 'contact-email', rule: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Enter a valid email' },
            { id: 'contact-phone', rule: v => /^[0-9+\s-]{10,15}$/.test(v.trim()), msg: 'Enter a valid phone number' },
            { id: 'contact-date', rule: v => v !== '', msg: 'Select date & time' },
            { id: 'contact-guests', rule: v => v !== '', msg: 'Select number of guests' }
        ];
        fields.forEach(({ id, rule, msg }) => {
            const el = document.getElementById(id);
            const err = document.getElementById(`${id}-error`);
            if (!el) return;
            if (!rule(el.value)) {
                valid = false;
                if (err) err.textContent = msg;
                el.classList.add('input-error');
            } else {
                if (err) err.textContent = '';
                el.classList.remove('input-error');
            }
        });
        if (!valid) return;
        const success = document.getElementById('contact-success');
        if (success) {
            success.classList.remove('hidden');
            document.getElementById('contact-success-msg').textContent =
                `Thank you, ${document.getElementById('contact-name').value}! We'll confirm your reservation shortly.`;
        }
        form.reset();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    renderGallery();
    initTabs();
    initDarkMode();
    initExploreMode();
    validateContactForm();
    const search = document.getElementById('menu-search');
    if (search) search.addEventListener('input', e => renderMenu(e.target.value));
});
