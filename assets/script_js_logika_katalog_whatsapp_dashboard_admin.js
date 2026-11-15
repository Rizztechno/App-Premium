/* ==========================================================================
   Toolify.id — Store Logic, App Logos, Cart, WhatsApp Checkout & Admin System
   ========================================================================== */

// 1. Global Store State & LocalStorage Persistence
let storeAdminWa = localStorage.getItem('toolify_admin_wa') || '6281234567890';
let storeAdminPin = localStorage.getItem('toolify_admin_pin') || '1234';
let storePaymentInfo = localStorage.getItem('toolify_payment_info') || '• DANA / GoPay / OVO: 0812-3456-7890 (a.n Toolify.id)\n• BCA / SeaBank: 1234567890 (a.n Toolify.id)\n• QRIS: Minta barcode QRIS ke admin jika bayar via QRIS';
let cart = JSON.parse(localStorage.getItem('toolify_cart') || '[]');
let ordersQueue = JSON.parse(localStorage.getItem('toolify_orders_queue') || '[]');
let stockStatusMap = JSON.parse(localStorage.getItem('toolify_stock_map') || '{}');
let activeCategory = 'all';
let selectedVariants = {};
let isAdminAuthenticated = false;

// 2. Complete 13 Unique Premium Apps Data
const productsData = [
    {
        id: 'canva',
        name: 'Canva Pro',
        category: 'editing',
        categoryLabel: 'Desain Grafis',
        badge: 'Terlaris',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        description: 'Akses jutaan template premium, Magic Studio AI, hapus background instan, & brand kit.',
        variants: [
            { id: 'canva-1m', label: '1 Bulan Invite', price: 8000 },
            { id: 'canva-1y', label: '1 Tahun Invite', price: 25000 },
            { id: 'canva-head', label: 'Head Designer 1 Bln', price: 35000 }
        ]
    },
    {
        id: 'capcut',
        name: 'CapCut Pro',
        category: 'editing',
        categoryLabel: 'Video Editing',
        badge: 'Best Seller',
        badgeColor: 'bg-white/15 text-white border-white/25',
        description: 'Efek transisi Pro, Auto Caption akurat, AI Body Effects, & export 4K tanpa watermark.',
        variants: [
            { id: 'cc-7d', label: '7 Hari Private', price: 7000 },
            { id: 'cc-1m-share', label: '1 Bulan Sharing', price: 15000 },
            { id: 'cc-1m-priv', label: '1 Bulan Private', price: 32000 }
        ]
    },
    {
        id: 'alight-motion',
        name: 'Alight Motion Pro',
        category: 'editing',
        categoryLabel: 'Motion Graphics',
        badge: 'Preset XML',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        description: 'Unlock semua efek keyframe, vektor grafis, font kustom, & import preset XML/5MB bebas.',
        variants: [
            { id: 'am-1m', label: '1 Bulan Private', price: 14000 },
            { id: 'am-1y', label: '1 Tahun Private', price: 28000 }
        ]
    },
    {
        id: 'wink',
        name: 'Wink VIP',
        category: 'editing',
        categoryLabel: 'AI Video Retouch',
        badge: 'AI HD 4K',
        badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        description: 'Pertajam kualitas video buram jadi 4K Ultra HD, AI Beauty retouch, & stabilisasi video.',
        variants: [
            { id: 'wink-7d', label: '7 Hari Sharing', price: 9000 },
            { id: 'wink-1m-share', label: '1 Bulan Sharing', price: 18000 },
            { id: 'wink-1m-priv', label: '1 Bulan Private', price: 38000 }
        ]
    },
    {
        id: 'meitu',
        name: 'Meitu VIP',
        category: 'editing',
        categoryLabel: 'AI Photo & Filter',
        badge: 'AI Art',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        description: 'Edit foto AI anime, filter estetik eksklusif, retouch wajah natural, & hapus objek otomatis.',
        variants: [
            { id: 'meitu-1m-share', label: '1 Bulan Sharing', price: 16000 },
            { id: 'meitu-1m-priv', label: '1 Bulan Private', price: 35000 }
        ]
    },
    {
        id: 'viu',
        name: 'Viu Premium',
        category: 'streaming',
        categoryLabel: 'Drakor & Variety',
        badge: 'Hemat',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        description: 'Nonton drama Korea & variety show terbaru tanpa iklan, download offline, & kualitas Full HD.',
        variants: [
            { id: 'viu-1m', label: '1 Bulan Private', price: 10000 },
            { id: 'viu-3m', label: '3 Bulan Private', price: 22000 },
            { id: 'viu-1y', label: '1 Tahun Anti Limit', price: 35000 }
        ]
    },
    {
        id: 'vidio',
        name: 'Vidio Premier',
        category: 'streaming',
        categoryLabel: 'Sports & Series',
        badge: 'Liga & Series',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        description: 'Streaming Vidio Original Series, Liga Inggris / UCL, & tayangan TV nasional bebas iklan.',
        variants: [
            { id: 'vidio-plat-1m', label: 'Platinum 1 Bln Share', price: 18000 },
            { id: 'vidio-plat-priv', label: 'Platinum 1 Bln Priv', price: 32000 },
            { id: 'vidio-diamond', label: 'Diamond EPL 1 Bln', price: 55000 }
        ]
    },
    {
        id: 'iqiyi',
        name: 'iQIYI VIP',
        category: 'streaming',
        categoryLabel: 'Drachin & Anime',
        badge: 'Blu-ray 4K',
        badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
        description: 'Nonton drama China, anime populer, & film Asia dengan subtitle Indonesia dan kualitas 1080P/4K.',
        variants: [
            { id: 'iqiyi-1m-share', label: '1 Bulan Sharing', price: 12000 },
            { id: 'iqiyi-1y-share', label: '1 Tahun Sharing', price: 29000 },
            { id: 'iqiyi-1m-priv', label: '1 Bulan Private', price: 34000 }
        ]
    },
    {
        id: 'disney',
        name: 'Disney+ Hotstar',
        category: 'streaming',
        categoryLabel: 'Marvel, Pixar & Star',
        badge: '4K Dolby',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        description: 'Koleksi lengkap Marvel, Pixar, Star Wars, National Geographic, & serial eksklusif Disney+.',
        variants: [
            { id: 'disney-1m-share', label: '1 Bulan Sharing', price: 22000 },
            { id: 'disney-1m-priv', label: '1 Bulan Private', price: 59000 }
        ]
    },
    {
        id: 'youtube',
        name: 'YouTube Premium',
        category: 'streaming',
        categoryLabel: 'No Ads + YT Music',
        badge: 'Favorit',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        description: 'Nonton video bebas iklan, putar di latar belakang, & sudah termasuk YouTube Music Premium.',
        variants: [
            { id: 'yt-1m-fam', label: '1 Bulan Famplan', price: 10000 },
            { id: 'yt-1m-ind', label: '1 Bulan Individual', price: 18000 },
            { id: 'yt-3m-ind', label: '3 Bulan Individual', price: 42000 }
        ]
    },
    {
        id: 'loklok',
        name: 'Loklok VIP',
        category: 'streaming',
        categoryLabel: 'Film, Drakor & Anime',
        badge: 'Full Sub Indo',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        description: 'Streaming film box office, drama Korea, & anime ongoing tanpa iklan dengan kualitas 1080P.',
        variants: [
            { id: 'loklok-1m-share', label: '1 Bulan Sharing', price: 15000 },
            { id: 'loklok-1m-priv', label: '1 Bulan Private', price: 32000 }
        ]
    },
    {
        id: 'spotify',
        name: 'Spotify Premium',
        category: 'music',
        categoryLabel: 'Music Streaming',
        badge: 'Terlaris',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        description: 'Dengarkan jutaan lagu & podcast bebas iklan, skip sepuasnya, lirik real-time, & mode offline.',
        variants: [
            { id: 'spot-1m-fam', label: '1 Bulan Famplan', price: 14000 },
            { id: 'spot-1m-ind', label: '1 Bulan Individual', price: 24000 },
            { id: 'spot-3m-ind', label: '3 Bulan Individual', price: 58000 }
        ]
    },
    {
        id: 'apple-music',
        name: 'Apple Music',
        category: 'music',
        categoryLabel: 'Lossless & Spatial Audio',
        badge: 'Hi-Res Audio',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        description: 'Kualitas suara Lossless Audio & Dolby Atmos Spatial Audio untuk pengguna iOS maupun Android.',
        variants: [
            { id: 'am-1m-fam', label: '1 Bulan Famplan', price: 15000 },
            { id: 'am-1m-ind', label: '1 Bulan Individual', price: 25000 },
            { id: 'am-3m-ind', label: '3 Bulan Individual', price: 55000 }
        ]
    }
];

// 3. High-Precision Vector Icons matching official app icons
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

// Render Exact App Logo SVG
function renderAppLogo(product, sizeClass = 'w-12 h-12') {
    const svgMarkup = customAppIconsSVG[product.id] || `
        <div class="w-full h-full bg-brand-600 flex items-center justify-center font-bold text-white text-xs">
            ${product.name.slice(0, 3)}
        </div>
    `;
    return `
        <div class="${sizeClass} rounded-2xl overflow-hidden flex items-center justify-center shadow-md shrink-0">
            ${svgMarkup}
        </div>
    `;
}

// Initialize default variant selection & stock readiness
productsData.forEach(p => {
    selectedVariants[p.id] = 0;
    if (stockStatusMap[p.id] === undefined) {
        stockStatusMap[p.id] = true;
    }
});

function isProductReady(productId) {
    return stockStatusMap[productId] !== false;
}

// Format Rupiah Helper
function formatRupiah(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

// Page Navigation Controller (Separates Beranda & Katalog Pages)
function navigateTo(page, sectionId = null, searchPreset = '') {
    const homePage = document.getElementById('page-home');
    const katalogPage = document.getElementById('page-katalog');

    if (page === 'katalog') {
        homePage.classList.add('hidden');
        katalogPage.classList.remove('hidden');
        if (searchPreset !== undefined) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = searchPreset;
                filterProducts();
            }
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

    lucide.createIcons();
}

// Render Hero Mini Icons Showcase (first 8 apps)
function renderHeroMiniIcons() {
    const container = document.getElementById('hero-mini-icons');
    if (!container) return;
    container.innerHTML = productsData.slice(0, 8).map(app => `
        <button type="button" onclick="navigateTo('katalog', null, '${app.name}')" class="group flex flex-col items-center p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800/80 transition-all">
            <div class="transform group-hover:scale-110 transition-transform">
                ${renderAppLogo(app, 'w-11 h-11')}
            </div>
            <span class="text-[11px] font-medium text-slate-300 mt-1.5 truncate max-w-full">${app.name.split(' ')[0]}</span>
        </button>
    `).join('');
}

// Render Product Cards Grid
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

    if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = filtered.map(product => {
        const activeVarIdx = selectedVariants[product.id] || 0;
        const currentVariant = product.variants[activeVarIdx];
        const isReady = isProductReady(product.id);

        const variantButtonsHtml = product.variants.map((v, idx) => {
            const isSelected = idx === activeVarIdx;
            return `
                <button 
                    type="button"
                    onclick="selectVariant('${product.id}', ${idx})"
                    class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all text-left truncate ${
                        isSelected 
                        ? 'bg-brand-600/25 border-brand-500 text-white shadow-sm' 
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }"
                >
                    ${v.label}
                </button>
            `;
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
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${product.badgeColor}">
                                ${product.badge}
                            </span>
                        </div>
                    </div>

                    <div class="mb-2">
                        <span class="text-[11px] font-medium text-brand-400 uppercase tracking-wider">${product.categoryLabel}</span>
                        <h3 class="font-display font-bold text-lg text-white group-hover:text-brand-300 transition-colors">${product.name}</h3>
                    </div>

                    <p class="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                        ${product.description}
                    </p>

                    <div class="mb-4">
                        <span class="block text-[11px] font-semibold text-slate-400 mb-1.5">Pilih Paket / Durasi:</span>
                        <div class="flex flex-wrap gap-1.5">
                            ${variantButtonsHtml}
                        </div>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800/80 space-y-3">
                    <div class="flex items-baseline justify-between">
                        <span class="text-xs text-slate-400">Harga Paket</span>
                        <span class="font-display font-extrabold text-xl text-white">${formatRupiah(currentVariant.price)}</span>
                    </div>

                    ${isReady ? `
                        <div class="grid grid-cols-5 gap-2">
                            <button 
                                type="button"
                                onclick="addToCart('${product.id}')"
                                title="Tambah ke Keranjang"
                                class="col-span-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            >
                                <i data-lucide="shopping-cart" class="w-4 h-4 text-brand-400"></i>
                                <span>+ Cart</span>
                            </button>
                            <button 
                                type="button"
                                onclick="buyNowDirect('${product.id}')"
                                class="col-span-3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-brand-600/20 transition-all active:scale-95"
                            >
                                <span>Beli Sekarang</span>
                            </button>
                        </div>
                    ` : `
                        <button 
                            type="button"
                            disabled
                            class="w-full py-2.5 px-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-500 text-xs font-semibold cursor-not-allowed"
                        >
                            Stok Sedang Kosong
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// Variant & Filter Handlers
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

function filterProducts() {
    renderProducts();
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    setCategory('all');
}

// Cart Functions
function saveCart() {
    localStorage.setItem('toolify_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId, silent = false) {
    if (!isProductReady(productId)) {
        showToast('Maaf, stok aplikasi ini sedang habis.');
        return;
    }
    const product = productsData.find(p => p.id === productId);
    const varIdx = selectedVariants[productId] || 0;
    const variant = product.variants[varIdx];
    const cartItemId = `${product.id}__${variant.id}`;

    const existing = cart.find(item => item.cartItemId === cartItemId);
    if (existing) {
        existing.qty += 1;
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
    if (!silent) {
        showToast(`${product.name} (${variant.label}) masuk keranjang!`);
    }
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
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
    }
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
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = cart.map(item => {
        const prod = productsData.find(p => p.id === item.productId);
        return `
            <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    ${prod ? renderAppLogo(prod, 'w-10 h-10') : ''}
                    <div class="min-w-0">
                        <h4 class="font-bold text-sm text-white truncate">${item.productName}</h4>
                        <p class="text-[11px] text-brand-400 truncate">${item.variantLabel}</p>
                        <p class="text-xs font-bold text-emerald-400 mt-0.5">${formatRupiah(item.price * item.qty)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" onclick="updateCartQty('${item.cartItemId}', -1)" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center">-</button>
                    <span class="w-6 text-center text-xs font-bold text-white">${item.qty}</span>
                    <button type="button" onclick="updateCartQty('${item.cartItemId}', 1)" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center">+</button>
                    <button type="button" onclick="removeCartItem('${item.cartItemId}')" class="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-rose-400">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function toggleCartDrawer() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    const isClosed = drawer.classList.contains('translate-x-full');

    if (isClosed) {
        overlay.classList.remove('hidden');
        drawer.classList.remove('translate-x-full');
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
                <span>${item.productName} (${item.variantLabel}) x${item.qty}</span>
                <span class="font-semibold text-white">${formatRupiah(sub)}</span>
            </div>
        `;
    }).join('');

    totalEl.textContent = formatRupiah(total);

    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Submit Order to Admin Queue & Redirect to WhatsApp
function submitWhatsAppOrder(e) {
    e.preventDefault();

    const name = document.getElementById('buyer-name').value.trim();
    const waNumber = document.getElementById('buyer-wa').value.trim();
    const email = document.getElementById('buyer-email').value.trim() || '-';
    const note = document.getElementById('buyer-note').value.trim() || '-';
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    let total = 0;
    const orderItems = cart.map(item => {
        const sub = item.price * item.qty;
        total += sub;
        return { ...item, subtotal: sub };
    });

    const itemsListText = orderItems.map((item, idx) => {
        return `${idx + 1}. *${item.productName}* (${item.variantLabel}) x${item.qty} = ${formatRupiah(item.subtotal)}`;
    }).join('\n');

    const orderId = 'TLF-' + Math.floor(100000 + Math.random() * 900000);
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    ordersQueue.unshift({
        id: orderId,
        createdAt: nowStr,
        buyerName: name,
        buyerWa: waNumber,
        buyerEmail: email,
        paymentMethod: paymentMethod,
        note: note,
        items: orderItems,
        total: total,
        status: 'pending'
    });
    saveOrdersQueue();

    const message = 
`Halo Admin *Toolify.id* 👋, saya ingin *cek stok & order* aplikasi premium:

🧾 *No. Pengajuan:* ${orderId}
👤 *Nama:* ${name}
📱 *No. WA:* ${waNumber}
📧 *Email Akun:* ${email}

🛒 *Detail Pesanan:*
${itemsListText}

💰 *Estimasi Total:* *${formatRupiah(total)}*
💳 *Rencana Bayar:* ${paymentMethod}
📝 *Catatan:* ${note}

Mohon konfirmasi ketersediaan stok & kirim *Resi Pembayaran* resminya ya Min. Terima kasih! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${storeAdminWa}?text=${encodedMessage}`;

    cart = [];
    saveCart();
    closeCheckoutModal();
    showToast('Order masuk antrean Admin! Mengarahkan ke WhatsApp...');

    window.open(whatsappUrl, '_blank');
}

function openDirectAdminChat() {
    const msg = encodeURIComponent('Halo Admin Toolify.id! Saya mau tanya-tanya soal aplikasi premium yang ready.');
    window.open(`https://wa.me/${storeAdminWa}?text=${msg}`, '_blank');
}

// ==================== ADMIN ACCESS, STOCK & RESI / REFUND SYSTEM ====================
function saveOrdersQueue() {
    localStorage.setItem('toolify_orders_queue', JSON.stringify(ordersQueue));
    updatePendingBadge();
}

function updatePendingBadge() {
    const badge = document.getElementById('pending-order-badge');
    if (!badge) return;
    const pendingCount = ordersQueue.filter(o => o.status === 'pending').length;
    if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function openAdminAccess() {
    if (isAdminAuthenticated) {
        openAdminModal();
    } else {
        document.getElementById('admin-pin-input').value = '';
        document.getElementById('pin-error-msg').classList.add('hidden');
        const pinModal = document.getElementById('admin-pin-modal');
        pinModal.classList.remove('hidden');
        pinModal.classList.add('flex');
        setTimeout(() => document.getElementById('admin-pin-input').focus(), 100);
    }
}

function closeAdminPinModal() {
    const pinModal = document.getElementById('admin-pin-modal');
    pinModal.classList.add('hidden');
    pinModal.classList.remove('flex');
}

function verifyAdminPin() {
    const entered = document.getElementById('admin-pin-input').value.trim();
    if (entered === storeAdminPin) {
        isAdminAuthenticated = true;
        closeAdminPinModal();
        openAdminModal();
        showToast('Selamat datang di Dashboard Admin!');
    } else {
        document.getElementById('pin-error-msg').classList.remove('hidden');
    }
}

function logoutAdmin() {
    isAdminAuthenticated = false;
    closeAdminModal();
    showToast('Sesi Admin dikunci.');
}

function openAdminModal() {
    document.getElementById('admin-wa-input').value = storeAdminWa;
    document.getElementById('admin-payment-info-input').value = storePaymentInfo;
    document.getElementById('admin-new-pin-input').value = storeAdminPin;
    renderAdminOrders();
    renderAdminStockList();
    const modal = document.getElementById('admin-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function switchAdminTab(tabName) {
    ['orders', 'stock', 'settings'].forEach(t => {
        const panel = document.getElementById(`admin-panel-${t}`);
        const btn = document.getElementById(`admin-tab-${t}`);
        if (t === tabName) {
            panel.classList.remove('hidden');
            btn.className = 'admin-tab-btn px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 border-brand-500 text-white whitespace-nowrap';
        } else {
            panel.classList.add('hidden');
            btn.className = 'admin-tab-btn px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white whitespace-nowrap';
        }
    });
}

function formatBuyerWaForLink(rawPhone) {
    let clean = (rawPhone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
}

function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;

    if (ordersQueue.length === 0) {
        container.innerHTML = `
            <div class="p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <p class="font-display font-bold text-sm text-white">Belum ada pesanan masuk</p>
                <p class="text-xs text-slate-400 mt-1">Setiap pesanan pelanggan dari katalog akan muncul di sini untuk Anda verifikasi stoknya terlebih dahulu.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ordersQueue.map((order, idx) => {
        let statusBadge = '';
        if (order.status === 'pending') {
            statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">⏳ Menunggu Cek Stok Admin</span>`;
        } else if (order.status === 'approved') {
            statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✅ Stok Ready • Resi Terbit</span>`;
        } else {
            statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">↩️ Stok Kosong / Refund</span>`;
        }

        const itemsHtml = order.items.map(it => `
            <li class="flex justify-between text-xs text-slate-300">
                <span>• ${it.productName} (${it.variantLabel}) x${it.qty}</span>
                <span class="font-semibold">${formatRupiah(it.subtotal)}</span>
            </li>
        `).join('');

        return `
            <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-display font-bold text-sm text-white">${order.id}</span>
                            <span class="text-[11px] text-slate-500">• ${order.createdAt}</span>
                        </div>
                        <p class="text-xs text-slate-300 mt-0.5">Pembeli: <strong>${order.buyerName}</strong> (${order.buyerWa}) • Email: <span class="text-brand-300">${order.buyerEmail}</span></p>
                    </div>
                    ${statusBadge}
                </div>

                <ul class="space-y-1 bg-slate-900/70 p-3 rounded-xl border border-slate-800/60">
                    ${itemsHtml}
                    <li class="pt-1.5 mt-1.5 border-t border-slate-800 flex justify-between text-xs font-bold text-white">
                        <span>Total (${order.paymentMethod})</span>
                        <span class="text-emerald-400">${formatRupiah(order.total)}</span>
                    </li>
                </ul>

                <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button onclick="approveOrderAndSendResi(${idx})" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all">
                        <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                        <span>Terima Stok Ready & Kirim Resi WA</span>
                    </button>
                    <button onclick="rejectOrderAndSendRefund(${idx})" class="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all">
                        <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                        <span>Stok Kosong / Ajukan Refund WA</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function approveOrderAndSendResi(orderIndex) {
    const order = ordersQueue[orderIndex];
    if (!order) return;

    ordersQueue[orderIndex].status = 'approved';
    saveOrdersQueue();
    renderAdminOrders();

    const buyerWaClean = formatBuyerWaForLink(order.buyerWa);
    const itemsText = order.items.map((it, i) => `${i + 1}. ${it.productName} (${it.variantLabel}) x${it.qty} = ${formatRupiah(it.subtotal)}`).join('\n');

    const resiMessage = 
`✅ *RESI ORDER & KONFIRMASI STOK READY — TOOLIFY.ID*

Halo Kak *${order.buyerName}* 👋, kabar baik! Stok pesanan Kakak *TERSEDIA (READY)* dan siap diproses.

🧾 *No. Resi Order:* ${order.id}
📅 *Waktu:* ${order.createdAt}
📧 *Email Akun Tujuan:* ${order.buyerEmail}

🛒 *Rincian Pesanan:*
${itemsText}

💰 *Total Tagihan:* *${formatRupiah(order.total)}*
💳 *Metode Pilihan:* ${order.paymentMethod}

🏦 *Tujuan Pembayaran Resmi:*
${storePaymentInfo}

Silakan lakukan transfer sesuai nominal di atas dan kirimkan *bukti transfer* di chat ini agar akun segera kami aktifkan (1–5 menit). Terima kasih! 🙏`;

    showToast(`Resi ${order.id} diterbitkan! Membuka WA pembeli...`);
    window.open(`https://wa.me/${buyerWaClean}?text=${encodeURIComponent(resiMessage)}`, '_blank');
}

function rejectOrderAndSendRefund(orderIndex) {
    const order = ordersQueue[orderIndex];
    if (!order) return;

    ordersQueue[orderIndex].status = 'refunded';
    saveOrdersQueue();
    renderAdminOrders();

    const buyerWaClean = formatBuyerWaForLink(order.buyerWa);
    const itemsText = order.items.map((it, i) => `${i + 1}. ${it.productName} (${it.variantLabel})`).join('\n');

    const refundMessage = 
`⚠️ *KONFIRMASI STOK & PROSES REFUND — TOOLIFY.ID*

Halo Kak *${order.buyerName}* 👋, mohon maaf sebesar-besarnya. Setelah kami cek di sistem, stok untuk pesanan berikut sedang *HABIS / KOSONG*:

🧾 *No. Order:* ${order.id}
🛒 *Item:*
${itemsText}
💰 *Nominal:* *${formatRupiah(order.total)}*

Jika Kakak *belum transfer*, mohon *JANGAN* melakukan pembayaran terlebih dahulu ya Kak.
Namun jika Kakak *sudah terlanjur membayar*, kami akan langsung memproses *REFUND 100%* tanpa potongan. Silakan balas chat ini dengan:
• *Nama Bank / E-Wallet:*
• *Nomor Rekening / HP:*
• *Atas Nama:*

Sekali lagi mohon maaf atas ketidaknyamanannya Kak 🙏`;

    showToast(`Notifikasi Stok Habis & Refund ${order.id} dibuka di WA!`);
    window.open(`https://wa.me/${buyerWaClean}?text=${encodeURIComponent(refundMessage)}`, '_blank');
}

function clearCompletedOrders() {
    ordersQueue = ordersQueue.filter(o => o.status === 'pending');
    saveOrdersQueue();
    renderAdminOrders();
    showToast('Riwayat order selesai dibersihkan.');
}

function renderAdminStockList() {
    const container = document.getElementById('admin-stock-list');
    if (!container) return;

    container.innerHTML = productsData.map(product => {
        const ready = isProductReady(product.id);
        return `
            <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    ${renderAppLogo(product, 'w-10 h-10')}
                    <div class="min-w-0">
                        <h4 class="font-bold text-sm text-white truncate">${product.name}</h4>
                        <p class="text-[11px] ${ready ? 'text-emerald-400' : 'text-rose-400'} font-semibold">
                            ${ready ? '● Stok Ready (Bisa Diorder)' : '● Stok Habis (Terkunci)'}
                        </p>
                    </div>
                </div>
                <button 
                    type="button"
                    onclick="toggleProductStock('${product.id}')"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        ready 
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30' 
                        : 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30'
                    }"
                >
                    ${ready ? 'Set Habis' : 'Set Ready'}
                </button>
            </div>
        `;
    }).join('');
}

function toggleProductStock(productId) {
    stockStatusMap[productId] = !isProductReady(productId);
    localStorage.setItem('toolify_stock_map', JSON.stringify(stockStatusMap));
    renderAdminStockList();
    renderProducts();
    const prod = productsData.find(p => p.id === productId);
    showToast(`Stok ${prod.name} diubah menjadi ${stockStatusMap[productId] ? 'READY' : 'HABIS'}.`);
}

function saveAdminSettings() {
    let raw = document.getElementById('admin-wa-input').value.replace(/\D/g, '');
    if (raw.startsWith('0')) {
        raw = '62' + raw.slice(1);
    }
    if (raw.length < 9) {
        showToast('Nomor WhatsApp tidak valid!');
        return;
    }
    const payInfo = document.getElementById('admin-payment-info-input').value.trim();
    const newPin = document.getElementById('admin-new-pin-input').value.trim();

    if (newPin.length < 4) {
        showToast('PIN Admin minimal 4 karakter!');
        return;
    }

    storeAdminWa = raw;
    storePaymentInfo = payInfo || storePaymentInfo;
    storeAdminPin = newPin;

    localStorage.setItem('toolify_admin_wa', storeAdminWa);
    localStorage.setItem('toolify_payment_info', storePaymentInfo);
    localStorage.setItem('toolify_admin_pin', storeAdminPin);

    updateFooterWaDisplay();
    showToast('Pengaturan WA, Info Rekening & PIN Admin berhasil disimpan!');
}

function updateFooterWaDisplay() {
    const el = document.getElementById('footer-wa-display');
    if (el) {
        el.textContent = '+' + storeAdminWa;
    }
}

// FAQ Accordion Toggle
function toggleFaq(btn) {
    const answer = btn.nextElementSibling;
    const icon = btn.querySelector('svg');
    answer.classList.toggle('hidden');
    if (icon) {
        icon.classList.toggle('rotate-180');
    }
}

// Toast Notification Helper
let toastTimeout;
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    toastMsg.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
    }, 2800);
}

// Initialize Page on Load
window.addEventListener('DOMContentLoaded', () => {
    renderHeroMiniIcons();
    renderProducts();
    updateCartUI();
    updateFooterWaDisplay();
    updatePendingBadge();
    if (window.location.hash === '#katalog') {
        navigateTo('katalog');
    }
    lucide.createIcons();
});