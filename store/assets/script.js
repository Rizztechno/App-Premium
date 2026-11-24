/* ==========================================================================
   Qiza.id — Toko: katalog, keranjang, checkout WhatsApp & sinkron Supabase
   Bergantung pada: assets/config.js, assets/utils.js, supabase-js, lucide
   ========================================================================== */

const { esc, safeBadgeClass, safeImageUrl, safeSlug, formatRupiah, isValidWa, openPendingTab, goToUrl } = window.QizaUtils;
const CFG = window.QIZA_CONFIG || {};

// Klien Supabase untuk pengunjung (anon). Tidak menyimpan sesi login apa pun.
const sbClient = (window.supabase && CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY)
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
    : null;

const storeAdminWa = CFG.ADMIN_WA || '6282233129573';
let stockStatusMap = {};
let activeCategory = 'all';
let selectedVariants = {};
let lastSyncAt = 0;

// Keranjang dari localStorage, divalidasi bentuknya (data bisa dimanipulasi pengguna).
function loadCart() {
    try {
        const raw = JSON.parse(localStorage.getItem('qiza_cart') || '[]');
        if (!Array.isArray(raw)) return [];
        return raw.filter(i => i && typeof i.productId === 'string' && typeof i.variantId === 'string')
            .map(i => ({
                cartItemId: `${i.productId}__${i.variantId}`,
                productId: String(i.productId),
                productName: String(i.productName || ''),
                variantId: String(i.variantId),
                variantLabel: String(i.variantLabel || ''),
                price: Number.isFinite(Number(i.price)) ? Number(i.price) : 0,
                qty: Math.min(10, Math.max(1, parseInt(i.qty, 10) || 1))
            }));
    } catch (e) { return []; }
}
let cart = loadCart();

// Katalog TIDAK punya data bawaan. Satu-satunya sumber harga & stok adalah database
// Supabase (diatur lewat panel admin), jadi harga lama tidak pernah 'nyangkut' di toko.
const productsData = [];
let catalogState = 'loading'; // 'loading' | 'ok' | 'error'

// 4. High-Precision Vector Icons matching official app icons
const customAppIconsSVG = {
    'canva': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <defs>
                <linearGradient id="canvaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#00C4CC"/>
                    <stop offset="50%" stop-color="#2B72E8"/>
                    <stop offset="100%" stop-color="#7D2AE8"/>
                </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#canvaGrad)"/>
            <text x="50" y="59" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="bold" font-size="29" letter-spacing="-0.5">Canva</text>
        </svg>
    `,
    'alight-motion': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#182238"/>
            <path d="M 22 45 A 31 31 0 1 1 80 54" fill="none" stroke="#18F2A5" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M 33 34 A 22 22 0 1 1 67 69" fill="none" stroke="#18F2A5" stroke-width="5" stroke-linecap="round"/>
            <path d="M 46 33 A 14 14 0 1 1 42 60" fill="none" stroke="#18F2A5" stroke-width="4.5" stroke-linecap="round"/>
        </svg>
    `,
    'capcut': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#FFFFFF"/>
            <g fill="none" stroke="#000000" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M 71 39 L 71 32 C 71 28 68 25 64 25 L 26 25 C 22 25 19 28 19 32 L 19 39 L 81 69"/>
                <path d="M 71 61 L 71 68 C 71 72 68 75 64 75 L 26 75 C 22 75 19 72 19 68 L 19 61 L 81 31"/>
            </g>
        </svg>
    `,
    'meitu': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#F21D4E"/>
            <circle cx="50" cy="50" r="37" fill="none" stroke="#FFFFFF" stroke-width="4.5"/>
            <path d="M 28 61 L 28 46 C 28 41 33 41 37 43 C 42 45 46 39 51 39 C 56 39 55 47 60 47 L 72 41 L 72 46 L 66 49 L 66 61" fill="none" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,
    'vidio': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#FF004D"/>
            <text x="50" y="58" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-style="italic" font-weight="800" font-size="27" letter-spacing="-0.5">Vidio</text>
        </svg>
    `,
    'disney': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <defs>
                <radialGradient id="disneyBg" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stop-color="#13256B"/>
                    <stop offset="100%" stop-color="#050B24"/>
                </radialGradient>
                <linearGradient id="disneyArc" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stop-color="#1A3A9C" stop-opacity="0.1"/>
                    <stop offset="60%" stop-color="#38BDF8"/>
                    <stop offset="100%" stop-color="#E0F2FE"/>
                </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#disneyBg)"/>
            <path d="M 25 46 C 36 27 65 27 76 48" fill="none" stroke="url(#disneyArc)" stroke-width="3" stroke-linecap="round"/>
            <text x="45" y="64" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-weight="bold" font-size="23">Disney</text>
            <path d="M 79 52 V 64 M 73 58 H 85" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>
        </svg>
    `,
    'loklok': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#C4B5FD"/>
            <path d="M 20 55 C 18 32 23 18 28 18 C 33 18 39 26 42 26 C 46 26 52 17 57 17 C 63 17 70 30 68 52 Z" fill="#8B7EC8"/>
            <ellipse cx="34" cy="40" rx="3" ry="4.5" fill="#FFFFFF"/>
            <ellipse cx="51" cy="39" rx="3" ry="4.5" fill="#FFFFFF"/>
            <path d="M 38 47 Q 43 56 48 46 Z" fill="#FFFFFF"/>
            <line x1="17" y1="45" x2="26" y2="46" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="17" y1="51" x2="26" y2="51" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M 0 74 Q 50 64 100 74 L 100 100 L 0 100 Z" fill="#FFFFFF"/>
            <g transform="rotate(10 73 55)">
                <rect x="57" y="42" width="30" height="24" rx="7" fill="#8B7EC8" stroke="#FFFFFF" stroke-width="3.5"/>
                <line x1="65" y1="36" x2="68" y2="42" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
                <line x1="78" y1="36" x2="75" y2="42" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
                <polygon points="69,49 69,59 78,54" fill="#FFFFFF"/>
            </g>
            <text x="50" y="91" text-anchor="middle" fill="#8B7EC8" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="14" letter-spacing="0.5">LOKLOK</text>
        </svg>
    `,
    'viu': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#FBBF00"/>
            <circle cx="26" cy="51" r="12" fill="none" stroke="#FFFFFF" stroke-width="3.5"/>
            <polyline points="23,46 30,51 23,56" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="45,44 51,58 57,44" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="64" cy="36" r="2.6" fill="#FFFFFF"/>
            <line x1="64" y1="44" x2="64" y2="58" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
            <path d="M 72 44 V 52 A 6 6 0 0 0 84 52 V 44" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
        </svg>
    `,
    'wink': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#050505"/>
            <rect x="24" y="34" width="9" height="18" rx="4.5" fill="#FFFFFF"/>
            <rect x="47" y="34" width="24" height="9" rx="4.5" transform="rotate(-18 59 38.5)" fill="#FFFFFF"/>
            <path d="M 27 65 C 40 77 65 73 73 54" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/>
            <path d="M 73 14 Q 74 23 83 24 Q 74 25 73 34 Q 72 25 63 24 Q 72 23 73 14 Z" fill="#FFFFFF"/>
        </svg>
    `,
    'iqiyi': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#00BE06"/>
            <text x="50" y="59" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-weight="800" font-size="26" letter-spacing="0.5">iQIYI</text>
        </svg>
    `,
    'youtube': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#FFFFFF"/>
            <rect x="14" y="26" width="72" height="48" rx="14" fill="#FF0000"/>
            <polygon points="43,39 43,61 63,50" fill="#FFFFFF"/>
        </svg>
    `,
    'spotify': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect width="100" height="100" rx="22" fill="#121212"/>
            <circle cx="50" cy="50" r="34" fill="#1ED760"/>
            <path d="M 33 41 C 46 37 61 39 70 45" fill="none" stroke="#121212" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M 36 51 C 46 48 58 49 66 54" fill="none" stroke="#121212" stroke-width="4.8" stroke-linecap="round"/>
            <path d="M 39 60 C 47 58 56 59 62 63" fill="none" stroke="#121212" stroke-width="4.2" stroke-linecap="round"/>
        </svg>
    `,
    'apple-music': `
        <svg viewBox="0 0 100 100" class="w-full h-full">
            <defs>
                <linearGradient id="amGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FA57C1"/>
                    <stop offset="100%" stop-color="#FA243C"/>
                </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#amGrad)"/>
            <path d="M 41 64 V 33 L 69 27 V 58" fill="none" stroke="#FFFFFF" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="41" y1="41" x2="69" y2="35" stroke="#FFFFFF" stroke-width="5.5"/>
            <ellipse cx="35" cy="65" rx="8" ry="6" transform="rotate(-15 35 65)" fill="#FFFFFF"/>
            <ellipse cx="63" cy="59" rx="8" ry="6" transform="rotate(-15 63 59)" fill="#FFFFFF"/>
        </svg>
    `
};

// Logo aplikasi: ikon SVG bawaan (hanya dari tabel di atas) atau gambar https:// tervalidasi.
function renderAppLogo(product, sizeClass = 'w-12 h-12') {
    const img = safeImageUrl(product.imageUrl);
    if (img) {
        return `
            <div class="${sizeClass} rounded-2xl overflow-hidden flex items-center justify-center shadow-md shrink-0">
                <img src="${esc(img)}" alt="${esc(product.name)}" referrerpolicy="no-referrer" loading="lazy" class="w-full h-full object-cover">
            </div>`;
    }
    const svgMarkup = Object.prototype.hasOwnProperty.call(customAppIconsSVG, product.id)
        ? customAppIconsSVG[product.id]
        : `<div class="w-full h-full bg-brand-600 flex items-center justify-center font-bold text-white text-xs">${esc(String(product.name || 'APP').slice(0, 3).toUpperCase())}</div>`;
    return `
        <div class="${sizeClass} rounded-2xl overflow-hidden flex items-center justify-center shadow-md shrink-0">
            ${svgMarkup}
        </div>`;
}

function isProductReady(productId) {
    return stockStatusMap[productId] !== false;
}

function updateCatalogCounters() {
    const total = productsData.length;
    const readyCount = productsData.filter(p => isProductReady(p.id)).length;
    if (catalogState !== 'ok') {
        const dash = catalogState === 'loading' ? '…' : '–';
        const nb = document.getElementById('nav-catalog-count'); if (nb) nb.textContent = dash;
        const ml = document.getElementById('mobile-catalog-label'); if (ml) ml.textContent = 'Katalog Aplikasi';
        const hs = document.getElementById('hero-apps-stat'); if (hs) hs.textContent = dash;
        const hr = document.getElementById('hero-ready-text'); if (hr) hr.textContent = catalogState === 'loading' ? 'Memuat katalog…' : 'Katalog belum termuat';
        return;
    }
    const navBadge = document.getElementById('nav-catalog-count');
    const mobileLabel = document.getElementById('mobile-catalog-label');
    const heroStat = document.getElementById('hero-apps-stat');
    const heroReady = document.getElementById('hero-ready-text');

    if (navBadge) navBadge.textContent = total;
    if (mobileLabel) mobileLabel.textContent = `Katalog Aplikasi (${total})`;
    if (heroStat) heroStat.textContent = `${total}+ Apps`;
    if (heroReady) heroReady.textContent = `${readyCount} Aplikasi Ready Order`;
}

// ==================== SUPABASE LIVE SYNC ====================
function sanitizeVariants(raw, slug) {
    const list = Array.isArray(raw) ? raw : [];
    const clean = list
        .filter(v => v && typeof v.id === 'string' && typeof v.label === 'string' && Number.isFinite(Number(v.price)) && Number(v.price) >= 0)
        .map(v => ({ id: v.id.slice(0, 60), label: v.label.slice(0, 60), price: Math.round(Number(v.price)) }));
    return clean.length ? clean : [];
}

// Samakan isi keranjang dengan harga/stok terbaru dari database.
function reconcileCart() {
    cart = cart.map(item => {
        const prod = productsData.find(p => p.id === item.productId);
        const variant = prod && prod.variants.find(v => v.id === item.variantId);
        if (!prod || !variant || !isProductReady(prod.id)) return null;
        return { ...item, productName: prod.name, variantLabel: variant.label, price: variant.price };
    }).filter(Boolean);
    localStorage.setItem('qiza_cart', JSON.stringify(cart));
}

async function syncProductsFromSupabase(showErrorToast = true) {
    if (!sbClient) { catalogState = 'error'; renderProducts(); return; }
    try {
        const { data, error } = await sbClient
            .from('products')
            .select('slug,name,category,category_label,badge,badge_color,image_url,description,variants,is_ready')
            .eq('is_visible', true)
            .order('sort_order', { ascending: true })
            .order('id', { ascending: true });

        if (error) throw error;

        // Database dijawab dengan sukses -> database adalah sumber kebenaran
        // (termasuk bila admin menyembunyikan semua produk).
        productsData.length = 0;
        stockStatusMap = {};
        selectedVariants = {};
        (data || []).forEach(row => {
            const slug = safeSlug(row.slug);
            const variants = sanitizeVariants(row.variants, slug);
            if (!slug || variants.length === 0) return;
            productsData.push({
                id: slug,
                name: String(row.name || slug),
                category: ['editing', 'streaming', 'music'].includes(row.category) ? row.category : 'editing',
                categoryLabel: String(row.category_label || ''),
                badge: String(row.badge || 'Promo'),
                badgeColor: safeBadgeClass(row.badge_color),
                imageUrl: safeImageUrl(row.image_url),
                description: String(row.description || ''),
                variants
            });
            selectedVariants[slug] = 0;
            stockStatusMap[slug] = row.is_ready !== false;
        });

        catalogState = 'ok';
        lastSyncAt = Date.now();
        reconcileCart();
        updateCatalogCounters();
        renderHeroMiniIcons();
        renderProducts();
        updateCartUI();
    } catch (err) {
        console.warn('Gagal sinkron dengan Supabase:', err);
        // Bila sebelumnya sudah pernah berhasil, tetap tampilkan data terakhir; bila belum, tampilkan error + tombol coba lagi.
        if (catalogState !== 'ok') { catalogState = 'error'; renderProducts(); updateCatalogCounters(); }
        if (showErrorToast) showToast('Katalog belum bisa dimuat. Periksa koneksi lalu coba lagi.');
    }
}

// ==================== NAVIGASI ====================
function navigateTo(page, sectionId = null, searchPreset = '') {
    const homePage = document.getElementById('page-home');
    const katalogPage = document.getElementById('page-katalog');

    if (page === 'katalog') {
        homePage.classList.add('hidden');
        katalogPage.classList.remove('hidden');
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = searchPreset || '';
            filterProducts();
        }
        window.history.replaceState(null, '', '#katalog');
    } else {
        katalogPage.classList.add('hidden');
        homePage.classList.remove('hidden');
        window.history.replaceState(null, '', sectionId ? `#${sectionId}` : '#home');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.nav === page) {
            link.classList.add('text-white', 'font-semibold');
            link.classList.remove('text-slate-300');
        } else {
            link.classList.remove('text-white', 'font-semibold');
            link.classList.add('text-slate-300');
        }
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        if (btn.dataset.navMobile === page) {
            btn.className = 'mobile-nav-btn flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-brand-600 text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/20';
        } else {
            btn.className = 'mobile-nav-btn flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60 transition-all flex items-center justify-center gap-1.5';
        }
    });

    if (sectionId) {
        setTimeout(() => {
            const target = document.getElementById(sectionId);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (window.lucide) lucide.createIcons();
}

function openDirectAdminChat() {
    const text = 'Halo Admin Qiza.id 👋, saya ingin bertanya tentang aplikasi premium.';
    window.open(`https://wa.me/${storeAdminWa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

// ==================== RENDER ====================
function renderHeroMiniIcons() {
    const container = document.getElementById('hero-mini-icons');
    if (!container) return;
    container.innerHTML = productsData.slice(0, 8).map(app => `
        <button type="button" data-action="hero-search" data-name="${esc(app.name)}" class="group flex flex-col items-center p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800/80 transition-all">
            <div class="transform group-hover:scale-110 transition-transform">
                ${renderAppLogo(app, 'w-11 h-11')}
            </div>
            <span class="text-[11px] font-medium text-slate-300 mt-1.5 truncate max-w-full">${esc(app.name.split(' ')[0])}</span>
        </button>
    `).join('');
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();

    const filtered = productsData.filter(product => {
        const matchCat = activeCategory === 'all' || product.category === activeCategory;
        const matchSearch = product.name.toLowerCase().includes(searchQuery) ||
                            product.description.toLowerCase().includes(searchQuery) ||
                            product.categoryLabel.toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
    });

    if (catalogState !== 'ok' && productsData.length === 0) {
        emptyState.classList.add('hidden');
        grid.innerHTML = catalogState === 'loading'
            ? `<div class="col-span-full text-center py-16 text-sm text-slate-400">Memuat katalog…</div>`
            : `<div class="col-span-full glass-card rounded-3xl text-center py-14 space-y-3">
                   <p class="font-display font-bold text-white">Katalog belum bisa dimuat</p>
                   <p class="text-xs text-slate-400">Periksa koneksi internet kamu, lalu coba lagi.</p>
                   <button type="button" data-click="retryCatalog" class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold">Coba Lagi</button>
               </div>`;
        return;
    }

    if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = filtered.map(product => {
        const activeVarIdx = selectedVariants[product.id] || 0;
        const currentVariant = product.variants[activeVarIdx] || product.variants[0];
        const isReady = isProductReady(product.id);
        const pid = esc(product.id);

        const variantButtonsHtml = product.variants.map((v, idx) => {
            const isSelected = idx === activeVarIdx;
            return `
                <button type="button" data-action="select-variant" data-pid="${pid}" data-idx="${idx}"
                    class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all text-left truncate ${
                        isSelected
                        ? 'bg-brand-600/25 border-brand-500 text-white shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }">${esc(v.label)}</button>`;
        }).join('');

        return `
            <div class="glass-card rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 group ${!isReady ? 'opacity-75' : ''}">
                <div>
                    <div class="flex items-start justify-between gap-2 mb-4">
                        <div class="p-1 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg group-hover:scale-105 transition-transform">
                            ${renderAppLogo(product, 'w-12 h-12')}
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            ${isReady
                                ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">● Stok Ready</span>`
                                : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">● Stok Habis</span>`
                            }
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${safeBadgeClass(product.badgeColor)}">${esc(product.badge)}</span>
                        </div>
                    </div>

                    <div class="mb-2">
                        <span class="text-[11px] font-medium text-brand-400 uppercase tracking-wider">${esc(product.categoryLabel)}</span>
                        <h3 class="font-display font-bold text-lg text-white group-hover:text-brand-300 transition-colors">${esc(product.name)}</h3>
                    </div>

                    <p class="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">${esc(product.description)}</p>

                    <div class="mb-4">
                        <span class="block text-[11px] font-semibold text-slate-400 mb-1.5">Pilih Paket / Durasi:</span>
                        <div class="flex flex-wrap gap-1.5">${variantButtonsHtml}</div>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800/80 space-y-3">
                    <div class="flex items-baseline justify-between">
                        <span class="text-xs text-slate-400">Harga Paket</span>
                        <span class="font-display font-extrabold text-xl text-white">${formatRupiah(currentVariant.price)}</span>
                    </div>

                    ${isReady ? `
                        <div class="grid grid-cols-5 gap-2">
                            <button type="button" data-action="add-cart" data-pid="${pid}" title="Tambah ke Keranjang"
                                class="col-span-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95">
                                <i data-lucide="shopping-cart" class="w-4 h-4 text-brand-400"></i>
                                <span>+ Cart</span>
                            </button>
                            <button type="button" data-action="buy-now" data-pid="${pid}"
                                class="col-span-3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                                <span>Beli Sekarang</span>
                            </button>
                        </div>
                    ` : `
                        <button type="button" disabled class="w-full py-2.5 px-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-500 text-xs font-semibold cursor-not-allowed">
                            Stok Sedang Kosong
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function selectVariant(productId, variantIdx) {
    selectedVariants[productId] = variantIdx;
    renderProducts();
}

function setCategory(cat) {
    activeCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        if (btn.dataset.cat === cat) {
            btn.className = 'cat-btn active shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition-all';
        } else {
            btn.className = 'cat-btn shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60 transition-all';
        }
    });
    renderProducts();
}

function filterProducts() { renderProducts(); }

function resetFilters() {
    document.getElementById('search-input').value = '';
    setCategory('all');
}

// ==================== KERANJANG ====================
function saveCart() {
    localStorage.setItem('qiza_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId, silent = false) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    if (!isProductReady(productId)) {
        showToast('Maaf, stok aplikasi ini sedang habis.');
        return;
    }
    const variant = product.variants[selectedVariants[productId] || 0] || product.variants[0];
    const cartItemId = `${product.id}__${variant.id}`;

    const existing = cart.find(item => item.cartItemId === cartItemId);
    if (existing) {
        existing.qty = Math.min(10, existing.qty + 1);
    } else {
        cart.push({
            cartItemId,
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantLabel: variant.label,
            price: variant.price,
            qty: 1
        });
    }
    saveCart();
    if (!silent) showToast(`${product.name} (${variant.label}) masuk keranjang!`);
}

function buyNowDirect(productId) {
    if (!isProductReady(productId)) {
        showToast('Maaf, stok aplikasi ini sedang habis.');
        return;
    }
    addToCart(productId, true);
    openCheckoutModal();
}

function updateCartQty(cartItemId, delta) {
    const idx = cart.findIndex(item => item.cartItemId === cartItemId);
    if (idx === -1) return;
    cart[idx].qty = Math.min(10, cart[idx].qty + delta);
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    saveCart();
}

function removeCartItem(cartItemId) {
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    saveCart();
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('btn-proceed-checkout');

    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    if (badge) badge.textContent = totalQty;
    if (totalEl) totalEl.textContent = formatRupiah(totalPrice);
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 space-y-3">
                <div class="w-14 h-14 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                    <i data-lucide="shopping-bag" class="w-7 h-7"></i>
                </div>
                <p class="font-display font-bold text-sm text-white">Keranjang masih kosong</p>
                <p class="text-xs text-slate-400">Pilih aplikasi premium di katalog untuk mulai memesan.</p>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = cart.map(item => {
        const prod = productsData.find(p => p.id === item.productId);
        const cid = esc(item.cartItemId);
        return `
            <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    ${prod ? renderAppLogo(prod, 'w-10 h-10') : ''}
                    <div class="min-w-0">
                        <h4 class="font-bold text-sm text-white truncate">${esc(item.productName)}</h4>
                        <p class="text-[11px] text-brand-400 truncate">${esc(item.variantLabel)}</p>
                        <p class="text-xs font-bold text-emerald-400 mt-0.5">${formatRupiah(item.price * item.qty)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" data-action="cart-qty" data-id="${cid}" data-delta="-1" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center">-</button>
                    <span class="w-6 text-center text-xs font-bold text-white">${item.qty}</span>
                    <button type="button" data-action="cart-qty" data-id="${cid}" data-delta="1" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center">+</button>
                    <button type="button" data-action="cart-remove" data-id="${cid}" class="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-rose-400">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

function toggleCartDrawer() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    const isClosed = drawer.classList.contains('translate-x-full');
    if (isClosed) {
        overlay.classList.remove('hidden');
        drawer.classList.remove('translate-x-full');
        // harga terbaru sebelum checkout
        if (Date.now() - lastSyncAt > 10000) syncProductsFromSupabase(false);
    } else {
        overlay.classList.add('hidden');
        drawer.classList.add('translate-x-full');
    }
}

function openCheckoutModal() {
    if (cart.length === 0) return;
    document.getElementById('cart-overlay').classList.add('hidden');
    document.getElementById('cart-drawer').classList.add('translate-x-full');

    const summaryContainer = document.getElementById('checkout-summary-items');
    const totalEl = document.getElementById('checkout-summary-total');
    let total = 0;

    summaryContainer.innerHTML = cart.map(item => {
        const sub = item.price * item.qty;
        total += sub;
        return `
            <div class="flex items-center justify-between">
                <span>${esc(item.productName)} (${esc(item.variantLabel)}) x${item.qty}</span>
                <span class="font-semibold text-white">${formatRupiah(sub)}</span>
            </div>`;
    }).join('');
    totalEl.textContent = formatRupiah(total);

    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ==================== CHECKOUT ====================
const ORDER_ERRORS = {
    invalid_name: 'Nama 2–80 karakter, tanpa tautan atau simbol < >.',
    invalid_wa: 'Nomor WhatsApp tidak valid.',
    invalid_email: 'Format email tidak valid.',
    invalid_payment: 'Metode pembayaran tidak valid.',
    invalid_note: 'Catatan maks 200 karakter, tanpa baris baru atau simbol < >.',
    invalid_items: 'Keranjang tidak valid.',
    invalid_qty: 'Jumlah item tidak valid (1–10).',
    rate_limited: 'Terlalu banyak pesanan dari nomor ini. Coba lagi beberapa menit lagi.',
    product_unavailable: 'Ada produk di keranjang yang sudah tidak tersedia / stok habis. Keranjang diperbarui.',
    variant_unavailable: 'Paket di keranjang sudah berubah. Keranjang diperbarui, silakan cek ulang.',
    price_changed: 'Harga baru saja diperbarui. Keranjang sudah disesuaikan, silakan cek total lalu kirim ulang.'
};

let isSubmittingOrder = false;
async function submitWhatsAppOrder(e) {
    e.preventDefault();
    if (isSubmittingOrder || cart.length === 0) return;

    const name = document.getElementById('buyer-name').value.trim();
    const waNumber = document.getElementById('buyer-wa').value.trim();
    const email = document.getElementById('buyer-email').value.trim();
    const note = document.getElementById('buyer-note').value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    if (name.length < 2) { showToast('Nama minimal 2 karakter.'); return; }
    if (!isValidWa(waNumber)) { showToast('Nomor WhatsApp tidak valid.'); return; }

    isSubmittingOrder = true;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    const tab = openPendingTab(); // dibuka sinkron agar tidak diblok popup-blocker

    let orderCode, total, orderItems;
    try {
        if (!sbClient) {
            if (tab && !tab.closed) tab.close();
            showToast('Sistem pesanan belum siap. Muat ulang halaman lalu coba lagi.');
            return;
        }
        {
            const { data, error } = await sbClient.rpc('create_order', {
                p_name: name, p_wa: waNumber, p_email: email, p_payment: paymentMethod, p_note: note,
                p_items: cart.map(i => ({ slug: i.productId, variant_id: i.variantId, qty: i.qty })),
                p_expected_total: cart.reduce((a, i) => a + i.price * i.qty, 0)
            });
            if (error) {
                const code = Object.keys(ORDER_ERRORS).find(k => (error.message || '').includes(k));
                if (code) {
                    if (tab && !tab.closed) tab.close();
                    showToast(ORDER_ERRORS[code]);
                    if (['product_unavailable', 'variant_unavailable', 'price_changed'].includes(code)) {
                        await syncProductsFromSupabase(false);
                        if (code === 'price_changed') openCheckoutModal();
                    }
                    return;
                }
                // Gangguan jaringan/server: JANGAN kirim order dengan harga dari browser.
                if (tab && !tab.closed) tab.close();
                console.warn('create_order gagal:', error);
                showToast('Pesanan belum bisa dicatat (koneksi bermasalah). Coba lagi sebentar lagi.');
                return;
            }
            if (!data || !data.order_code) {
                if (tab && !tab.closed) tab.close();
                showToast('Pesanan belum bisa dicatat. Coba lagi sebentar lagi.');
                return;
            }
            orderCode = data.order_code;
            total = data.total;          // total dihitung server
            orderItems = data.items;
        }

        const itemsListText = orderItems.map((item, idx) =>
            `${idx + 1}. *${item.productName}* (${item.variantLabel}) x${item.qty} = ${formatRupiah(item.subtotal)}`
        ).join('\n');

        const message =
`Halo Admin *Qiza.id* 👋, saya ingin *cek stok & order* aplikasi premium:

🧾 *No. Pengajuan:* ${orderCode}
👤 *Nama:* ${name}
📱 *No. WA:* ${waNumber}
📧 *Email Akun:* ${email || '-'}

🛒 *Detail Pesanan:*
${itemsListText}

💰 *Estimasi Total:* *${formatRupiah(total)}*
💳 *Rencana Bayar:* ${paymentMethod}
📝 *Catatan:* ${note || '-'}

Mohon konfirmasi ketersediaan stok & kirim *Resi Pembayaran* resminya ya Min. Terima kasih! 🙏`;

        const whatsappUrl = `https://wa.me/${storeAdminWa}?text=${encodeURIComponent(message)}`;

        cart = [];
        saveCart();
        closeCheckoutModal();
        document.getElementById('checkout-form').reset();
        showToast('Order tercatat! Membuka WhatsApp...');
        goToUrl(tab, whatsappUrl);
    } finally {
        isSubmittingOrder = false;
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==================== UI LAIN ====================
function toggleFaq() {
    const btn = this; // elemen tombol (dipasang oleh bindActions)
    const answer = btn.nextElementSibling;
    const icon = btn.querySelector('svg');
    answer.classList.toggle('hidden');
    if (icon) icon.classList.toggle('rotate-180');
}

let toastTimeout;
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    toastMsg.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.add('opacity-0', 'translate-y-4'), 3200);
}

// Delegasi klik untuk tombol hasil render dinamis (tanpa inline handler berisi data).
document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const { action, pid, idx, id, delta, name } = el.dataset;
    switch (action) {
        case 'select-variant': selectVariant(pid, parseInt(idx, 10) || 0); break;
        case 'add-cart': addToCart(pid); break;
        case 'buy-now': buyNowDirect(pid); break;
        case 'cart-qty': updateCartQty(id, parseInt(delta, 10) || 0); break;
        case 'cart-remove': removeCartItem(id); break;
        case 'hero-search': navigateTo('katalog', null, name || ''); break;
    }
});

function retryCatalog() {
    catalogState = 'loading';
    renderProducts();
    updateCatalogCounters();
    syncProductsFromSupabase();
}

// Daftar aksi yang boleh dipanggil dari atribut data-click / data-input / data-submit di HTML.
window.QizaUtils.bindActions({
    navigateTo, toggleCartDrawer, openCheckoutModal, closeCheckoutModal, openDirectAdminChat,
    setCategory, resetFilters, toggleFaq, retryCatalog, filterProducts, submitWhatsAppOrder
});

window.addEventListener('DOMContentLoaded', () => {
    updateCatalogCounters();
    renderHeroMiniIcons();
    renderProducts();
    updateCartUI();
    syncProductsFromSupabase();
    if (window.location.hash === '#katalog') navigateTo('katalog');
    if (window.lucide) lucide.createIcons();
});

// Ambil harga/stok terbaru setiap kali tab toko kembali dibuka.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastSyncAt > 30000) {
        syncProductsFromSupabase(false);
    }
});
