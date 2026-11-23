/* ==========================================================================
   Qiza.id — Admin Product Display & Order Manager (Supabase Integration)
   ========================================================================== */

// 1. KONFIGURASI SUPABASE
const SUPABASE_URL = 'https://znogdbpldvjuzsvqoaqj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KTycKeM2W0jckzkMSC0XOA_XaB971b2';

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabaseClient = isSupabaseConfigured
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const STORE_PAYMENT_INFO = '• DANA / GoPay / OVO: 0822-3312-9573 (a.n M.R.A)\n• BCA / SeaBank: 1234567890 (a.n Qiza.id)\n• QRIS: Minta barcode QRIS ke admin jika bayar via QRIS';

// State Global Admin
let adminProducts = [];
let adminOrders = [];
let adminActiveCategory = 'all';

// 2. Ikon SVG Bawaan (Sama persis dengan script.js agar preview seragam)
const appIconsSVG = {
    'canva': `<svg viewBox="0 0 100 100" class="w-full h-full"><defs><linearGradient id="canvaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00C4CC"/><stop offset="50%" stop-color="#2B72E8"/><stop offset="100%" stop-color="#7D2AE8"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#canvaGrad)"/><text x="50" y="59" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-weight="bold" font-size="29">Canva</text></svg>`,
    'alight-motion': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#182238"/><path d="M 22 45 A 31 31 0 1 1 80 54" fill="none" stroke="#18F2A5" stroke-width="5.5" stroke-linecap="round"/><path d="M 33 34 A 22 22 0 1 1 67 69" fill="none" stroke="#18F2A5" stroke-width="5" stroke-linecap="round"/><path d="M 46 33 A 14 14 0 1 1 42 60" fill="none" stroke="#18F2A5" stroke-width="4.5" stroke-linecap="round"/></svg>`,
    'capcut': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#FFFFFF"/><g fill="none" stroke="#000000" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 71 39 L 71 32 C 71 28 68 25 64 25 L 26 25 C 22 25 19 28 19 32 L 19 39 L 81 69"/><path d="M 71 61 L 71 68 C 71 72 68 75 64 75 L 26 75 C 22 75 19 72 19 68 L 19 61 L 81 31"/></g></svg>`,
    'meitu': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#F21D4E"/><circle cx="50" cy="50" r="37" fill="none" stroke="#FFFFFF" stroke-width="4.5"/><path d="M 28 61 L 28 46 C 28 41 33 41 37 43 C 42 45 46 39 51 39 C 56 39 55 47 60 47 L 72 41 L 72 46 L 66 49 L 66 61" fill="none" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'vidio': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#FF004D"/><text x="50" y="58" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-style="italic" font-weight="800" font-size="27">Vidio</text></svg>`,
    'disney': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#0B1742"/><text x="45" y="64" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-weight="bold" font-size="23">Disney</text><path d="M 79 52 V 64 M 73 58 H 85" stroke="#38BDF8" stroke-width="3.2" stroke-linecap="round"/></svg>`,
    'loklok': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#C4B5FD"/><text x="50" y="58" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="18">LOKLOK</text></svg>`,
    'viu': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#FBBF00"/><text x="50" y="60" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="30">viu</text></svg>`,
    'wink': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#050505"/><rect x="24" y="34" width="9" height="18" rx="4.5" fill="#FFFFFF"/><rect x="47" y="34" width="24" height="9" rx="4.5" transform="rotate(-18 59 38.5)" fill="#FFFFFF"/><path d="M 27 65 C 40 77 65 73 73 54" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/></svg>`,
    'iqiyi': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#00BE06"/><text x="50" y="59" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="26">iQIYI</text></svg>`,
    'youtube': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#FFFFFF"/><rect x="14" y="26" width="72" height="48" rx="14" fill="#FF0000"/><polygon points="43,39 43,61 63,50" fill="#FFFFFF"/></svg>`,
    'spotify': `<svg viewBox="0 0 100 100" class="w-full h-full"><rect width="100" height="100" rx="22" fill="#121212"/><circle cx="50" cy="50" r="34" fill="#1ED760"/><path d="M 33 41 C 46 37 61 39 70 45" fill="none" stroke="#121212" stroke-width="5.5" stroke-linecap="round"/><path d="M 36 51 C 46 48 58 49 66 54" fill="none" stroke="#121212" stroke-width="4.8" stroke-linecap="round"/><path d="M 39 60 C 47 58 56 59 62 63" fill="none" stroke="#121212" stroke-width="4.2" stroke-linecap="round"/></svg>`,
    'apple-music': `<svg viewBox="0 0 100 100" class="w-full h-full"><defs><linearGradient id="amGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FA57C1"/><stop offset="100%" stop-color="#FA243C"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#amGrad)"/><path d="M 41 64 V 33 L 69 27 V 58" fill="none" stroke="#FFFFFF" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="41" y1="41" x2="69" y2="35" stroke="#FFFFFF" stroke-width="5.5"/><ellipse cx="35" cy="65" rx="8" ry="6" transform="rotate(-15 35 65)" fill="#FFFFFF"/><ellipse cx="63" cy="59" rx="8" ry="6" transform="rotate(-15 63 59)" fill="#FFFFFF"/></svg>`
};

// 3. Data 13 Produk Default untuk fitur 1-Click Import ke Supabase
const defaultSeedProducts = [
    {
        slug: 'canva', name: 'Canva Pro', category: 'editing', category_label: 'Desain Grafis',
        badge: 'Terlaris', badge_color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        description: 'Akses jutaan template premium, Magic Studio AI, hapus background instan, & brand kit.',
        sort_order: 1, is_visible: true, is_ready: true,
        variants: [
            { id: 'canva-1m', label: '1 Bulan Invite', price: 8000 },
            { id: 'canva-1y', label: '1 Tahun Invite', price: 25000 },
            { id: 'canva-head', label: 'Head Designer 1 Bln', price: 35000 }
        ]
    },
    {
        slug: 'capcut', name: 'CapCut Pro', category: 'editing', category_label: 'Video Editing',
        badge: 'Best Seller', badge_color: 'bg-white/15 text-white border-white/25',
        description: 'Efek transisi Pro, Auto Caption akurat, AI Body Effects, & export 4K tanpa watermark.',
        sort_order: 2, is_visible: true, is_ready: true,
        variants: [
            { id: 'cc-7d', label: '7 Hari Private', price: 7000 },
            { id: 'cc-1m-share', label: '1 Bulan Sharing', price: 15000 },
            { id: 'cc-1m-priv', label: '1 Bulan Private', price: 32000 }
        ]
    },
    {
        slug: 'alight-motion', name: 'Alight Motion Pro', category: 'editing', category_label: 'Motion Graphics',
        badge: 'Preset XML', badge_color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        description: 'Unlock semua efek keyframe, vektor grafis, font kustom, & import preset XML/5MB bebas.',
        sort_order: 3, is_visible: true, is_ready: true,
        variants: [
            { id: 'am-1m', label: '1 Bulan Private', price: 14000 },
            { id: 'am-1y', label: '1 Tahun Private', price: 28000 }
        ]
    },
    {
        slug: 'wink', name: 'Wink VIP', category: 'editing', category_label: 'AI Video Retouch',
        badge: 'AI HD 4K', badge_color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        description: 'Pertajam kualitas video buram jadi 4K Ultra HD, AI Beauty retouch, & stabilisasi video.',
        sort_order: 4, is_visible: true, is_ready: true,
        variants: [
            { id: 'wink-7d', label: '7 Hari Sharing', price: 9000 },
            { id: 'wink-1m-share', label: '1 Bulan Sharing', price: 18000 },
            { id: 'wink-1m-priv', label: '1 Bulan Private', price: 38000 }
        ]
    },
    {
        slug: 'meitu', name: 'Meitu VIP', category: 'editing', category_label: 'AI Photo & Filter',
        badge: 'AI Art', badge_color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        description: 'Edit foto AI anime, filter estetik eksklusif, retouch wajah natural, & hapus objek otomatis.',
        sort_order: 5, is_visible: true, is_ready: true,
        variants: [
            { id: 'meitu-1m-share', label: '1 Bulan Sharing', price: 16000 },
            { id: 'meitu-1m-priv', label: '1 Bulan Private', price: 35000 }
        ]
    },
    {
        slug: 'viu', name: 'Viu Premium', category: 'streaming', category_label: 'Drakor & Variety',
        badge: 'Hemat', badge_color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        description: 'Nonton drama Korea & variety show terbaru tanpa iklan, download offline, & kualitas Full HD.',
        sort_order: 6, is_visible: true, is_ready: true,
        variants: [
            { id: 'viu-1m', label: '1 Bulan Private', price: 10000 },
            { id: 'viu-3m', label: '3 Bulan Private', price: 22000 },
            { id: 'viu-1y', label: '1 Tahun Anti Limit', price: 35000 }
        ]
    },
    {
        slug: 'vidio', name: 'Vidio Premier', category: 'streaming', category_label: 'Sports & Series',
        badge: 'Liga & Series', badge_color: 'bg-red-500/20 text-red-300 border-red-500/30',
        description: 'Streaming Vidio Original Series, Liga Inggris / UCL, & tayangan TV nasional bebas iklan.',
        sort_order: 7, is_visible: true, is_ready: true,
        variants: [
            { id: 'vidio-plat-1m', label: 'Platinum 1 Bln Share', price: 18000 },
            { id: 'vidio-plat-priv', label: 'Platinum 1 Bln Priv', price: 32000 },
            { id: 'vidio-diamond', label: 'Diamond EPL 1 Bln', price: 55000 }
        ]
    },
    {
        slug: 'iqiyi', name: 'iQIYI VIP', category: 'streaming', category_label: 'Drachin & Anime',
        badge: 'Blu-ray 4K', badge_color: 'bg-green-500/20 text-green-300 border-green-500/30',
        description: 'Nonton drama China, anime populer, & film Asia dengan subtitle Indonesia dan kualitas 1080P/4K.',
        sort_order: 8, is_visible: true, is_ready: true,
        variants: [
            { id: 'iqiyi-1m-share', label: '1 Bulan Sharing', price: 12000 },
            { id: 'iqiyi-1y-share', label: '1 Tahun Sharing', price: 29000 },
            { id: 'iqiyi-1m-priv', label: '1 Bulan Private', price: 34000 }
        ]
    },
    {
        slug: 'disney', name: 'Disney+ Hotstar', category: 'streaming', category_label: 'Marvel, Pixar & Star',
        badge: '4K Dolby', badge_color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        description: 'Koleksi lengkap Marvel, Pixar, Star Wars, National Geographic, & serial eksklusif Disney+.',
        sort_order: 9, is_visible: true, is_ready: true,
        variants: [
            { id: 'disney-1m-share', label: '1 Bulan Sharing', price: 22000 },
            { id: 'disney-1m-priv', label: '1 Bulan Private', price: 59000 }
        ]
    },
    {
        slug: 'youtube', name: 'YouTube Premium', category: 'streaming', category_label: 'No Ads + YT Music',
        badge: 'Favorit', badge_color: 'bg-red-500/20 text-red-300 border-red-500/30',
        description: 'Nonton video bebas iklan, putar di latar belakang, & sudah termasuk YouTube Music Premium.',
        sort_order: 10, is_visible: true, is_ready: true,
        variants: [
            { id: 'yt-1m-fam', label: '1 Bulan Famplan', price: 10000 },
            { id: 'yt-1m-ind', label: '1 Bulan Individual', price: 18000 },
            { id: 'yt-3m-ind', label: '3 Bulan Individual', price: 42000 }
        ]
    },
    {
        slug: 'loklok', name: 'Loklok VIP', category: 'streaming', category_label: 'Film, Drakor & Anime',
        badge: 'Full Sub Indo', badge_color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        description: 'Streaming film box office, drama Korea, & anime ongoing tanpa iklan dengan kualitas 1080P.',
        sort_order: 11, is_visible: true, is_ready: true,
        variants: [
            { id: 'loklok-1m-share', label: '1 Bulan Sharing', price: 15000 },
            { id: 'loklok-1m-priv', label: '1 Bulan Private', price: 32000 }
        ]
    },
    {
        slug: 'spotify', name: 'Spotify Premium', category: 'music', category_label: 'Music Streaming',
        badge: 'Terlaris', badge_color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        description: 'Dengarkan jutaan lagu & podcast bebas iklan, skip sepuasnya, lirik real-time, & mode offline.',
        sort_order: 12, is_visible: true, is_ready: true,
        variants: [
            { id: 'spot-1m-fam', label: '1 Bulan Famplan', price: 14000 },
            { id: 'spot-1m-ind', label: '1 Bulan Individual', price: 24000 },
            { id: 'spot-3m-ind', label: '3 Bulan Individual', price: 58000 }
        ]
    },
    {
        slug: 'apple-music', name: 'Apple Music', category: 'music', category_label: 'Lossless & Spatial Audio',
        badge: 'Hi-Res Audio', badge_color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        description: 'Kualitas suara Lossless Audio & Dolby Atmos Spatial Audio untuk pengguna iOS maupun Android.',
        sort_order: 13, is_visible: true, is_ready: true,
        variants: [
            { id: 'am-1m-fam', label: '1 Bulan Famplan', price: 15000 },
            { id: 'am-1m-ind', label: '1 Bulan Individual', price: 25000 },
            { id: 'am-3m-ind', label: '3 Bulan Individual', price: 55000 }
        ]
    }
];

function formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function renderLogo(product) {
    if (product.image_url) {
        return `<img src="${product.image_url}" alt="${product.name}" class="w-11 h-11 rounded-2xl object-cover shadow-md shrink-0">`;
    }
    const svg = appIconsSVG[product.slug] || `
        <div class="w-full h-full bg-brand-600 flex items-center justify-center font-bold text-white text-xs">
            ${(product.name || 'APP').slice(0, 3).toUpperCase()}
        </div>`;
    return `<div class="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shadow-md shrink-0">${svg}</div>`;
}

// ==================== SUPABASE AUTH FLOW ====================
async function initAuth() {
    const connBadge = document.getElementById('db-connection-badge');
    if (!isSupabaseConfigured) {
        connBadge.textContent = '● Isi SUPABASE_URL & KEY di admin.js';
        connBadge.className = 'text-rose-400 font-medium';
        return;
    }

    connBadge.textContent = '● Terhubung ke Supabase';
    connBadge.className = 'text-emerald-400 font-medium';

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showDashboard(session.user);
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const errorBox = document.getElementById('login-error');
    const btnLogin = document.getElementById('btn-login');

    if (!isSupabaseConfigured) {
        errorBox.textContent = 'Konfigurasi Supabase belum diisi! Buka file assets/admin.js dan masukkan SUPABASE_URL serta SUPABASE_ANON_KEY milikmu.';
        errorBox.classList.remove('hidden');
        return;
    }

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    errorBox.classList.add('hidden');
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span>Memverifikasi...</span>';

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    btnLogin.disabled = false;
    btnLogin.innerHTML = '<i data-lucide="lock" class="w-4 h-4"></i><span>Masuk Dashboard</span>';
    lucide.createIcons();

    if (error) {
        errorBox.textContent = 'Login gagal: ' + error.message;
        errorBox.classList.remove('hidden');
        return;
    }

    showDashboard(data.user);
    showToast('Berhasil masuk sebagai Admin!');
}

async function handleAdminLogout() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    showToast('Sesi Admin berakhir.');
}

function showDashboard(user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.getElementById('admin-user-email').textContent = user?.email || 'Admin Qiza.id';
    fetchProductsFromSupabase();
    fetchOrdersFromSupabase();
}

// ==================== CRUD SUPABASE PRODUCTS ====================
async function fetchProductsFromSupabase() {
    if (!supabaseClient) return;
    const loading = document.getElementById('admin-loading');
    const list = document.getElementById('admin-products-list');
    loading.classList.remove('hidden');
    list.innerHTML = '';

    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

    loading.classList.add('hidden');

    if (error) {
        showToast('Gagal memuat produk: ' + error.message);
        return;
    }

    adminProducts = data || [];
    updateStats();
    renderAdminProductsTable();
}

function updateStats() {
    const total = adminProducts.length;
    const visible = adminProducts.filter(p => p.is_visible).length;
    const ready = adminProducts.filter(p => p.is_ready).length;
    const out = adminProducts.filter(p => !p.is_ready || !p.is_visible).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-visible').textContent = visible;
    document.getElementById('stat-ready').textContent = ready;
    document.getElementById('stat-out').textContent = out;
}

function setAdminCategory(cat) {
    adminActiveCategory = cat;
    document.querySelectorAll('.admin-cat-btn').forEach(btn => {
        if (btn.dataset.cat === cat) {
            btn.className = 'admin-cat-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20';
        } else {
            btn.className = 'admin-cat-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60';
        }
    });
    renderAdminProductsTable();
}

function renderAdminProductsTable() {
    const container = document.getElementById('admin-products-list');
    const emptyBox = document.getElementById('admin-empty');
    const q = (document.getElementById('admin-search').value || '').toLowerCase().trim();

    const filtered = adminProducts.filter(p => {
        const matchCat = adminActiveCategory === 'all' || p.category === adminActiveCategory;
        const matchQ = (p.name || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q);
        return matchCat && matchQ;
    });

    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyBox.classList.remove('hidden');
        lucide.createIcons();
        return;
    }

    emptyBox.classList.add('hidden');
    container.innerHTML = filtered.map(product => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const variantsBadges = variants.map(v => `
            <span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                ${v.label}: <strong class="text-emerald-400">${formatRupiah(v.price)}</strong>
            </span>
        `).join('');

        return `
            <div class="p-4 rounded-2xl bg-slate-950/90 border ${product.is_visible ? 'border-slate-800' : 'border-rose-500/30 opacity-70'} flex flex-col justify-between gap-4 transition-all">
                <div class="space-y-3">
                    <!-- Top Row -->
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-3 min-w-0">
                            ${renderLogo(product)}
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">#${product.sort_order}</span>
                                    <h3 class="font-display font-bold text-base text-white truncate">${product.name}</h3>
                                </div>
                                <p class="text-[11px] text-brand-400 truncate">${product.category_label} • <span class="text-slate-500">${product.slug}</span></p>
                            </div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${product.badge_color || 'bg-brand-500/20 text-brand-300 border-brand-500/30'}">
                            ${product.badge || 'Promo'}
                        </span>
                    </div>

                    <p class="text-xs text-slate-400 line-clamp-2">${product.description || '-'}</p>

                    <!-- Variants List -->
                    <div class="flex flex-wrap gap-1.5">
                        ${variantsBadges || '<span class="text-[11px] text-slate-500">Belum ada varian harga</span>'}
                    </div>
                </div>

                <!-- Quick Display & Stock Controls -->
                <div class="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="quickToggleField(${product.id}, 'is_visible', ${!product.is_visible})" class="py-2 px-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                            product.is_visible
                            ? 'bg-brand-600/20 border-brand-500/40 text-brand-300 hover:bg-brand-600/30'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }">
                            <i data-lucide="${product.is_visible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                            <span>${product.is_visible ? 'Tampil di Toko' : 'Disembunyikan'}</span>
                        </button>

                        <button onclick="quickToggleField(${product.id}, 'is_ready', ${!product.is_ready})" class="py-2 px-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                            product.is_ready
                            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                            : 'bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30'
                        }">
                            <i data-lucide="${product.is_ready ? 'check-circle' : 'x-circle'}" class="w-3.5 h-3.5"></i>
                            <span>${product.is_ready ? 'Stok Ready' : 'Stok Habis'}</span>
                        </button>
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="openProductModal(${product.id})" class="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-brand-400"></i>
                            <span>Edit Paket & Harga</span>
                        </button>
                        <button onclick="deleteProductFromSupabase(${product.id}, '${product.name.replace(/'/g, "\\'")}')" class="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/25 text-slate-400 hover:text-rose-400 transition-all" title="Hapus Produk">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

async function quickToggleField(id, fieldName, newValue) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient
        .from('products')
        .update({ [fieldName]: newValue })
        .eq('id', id);

    if (error) {
        showToast('Gagal memperbarui status: ' + error.message);
        return;
    }

    const idx = adminProducts.findIndex(p => p.id === id);
    if (idx !== -1) {
        adminProducts[idx][fieldName] = newValue;
    }
    updateStats();
    renderAdminProductsTable();
    showToast('Display produk diperbarui!');
}

async function deleteProductFromSupabase(id, name) {
    if (!confirm(`Hapus produk "${name}" secara permanen dari database?`)) return;
    const { error } = await supabaseClient.from('products').delete().eq('id', id);
    if (error) {
        showToast('Gagal menghapus: ' + error.message);
        return;
    }
    adminProducts = adminProducts.filter(p => p.id !== id);
    updateStats();
    renderAdminProductsTable();
    showToast(`${name} dihapus dari database.`);
}

async function seedDefaultProducts() {
    if (!supabaseClient) return;
    if (!confirm('Import 13 produk bawaan Qiza.id ke database Supabase sekarang?')) return;

    const btn = document.getElementById('btn-seed');
    btn.disabled = true;
    btn.innerHTML = '<span>Mengimport...</span>';

    const { error } = await supabaseClient
        .from('products')
        .upsert(defaultSeedProducts, { onConflict: 'slug' });

    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="database-zap" class="w-4 h-4"></i><span>Import 13 Produk Awal</span>';
    lucide.createIcons();

    if (error) {
        showToast('Gagal import: ' + error.message);
        return;
    }

    showToast('13 produk berhasil masuk ke Supabase!');
    fetchProductsFromSupabase();
}

// ==================== MODAL ADD / EDIT PRODUCT ====================
function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const variantsList = document.getElementById('variants-builder-list');
    variantsList.innerHTML = '';

    if (productId) {
        const prod = adminProducts.find(p => p.id === productId);
        if (!prod) return;
        title.textContent = `Edit Produk: ${prod.name}`;
        document.getElementById('prod-db-id').value = prod.id;
        document.getElementById('prod-slug').value = prod.slug;
        document.getElementById('prod-name').value = prod.name;
        document.getElementById('prod-category').value = prod.category;
        document.getElementById('prod-category-label').value = prod.category_label;
        document.getElementById('prod-sort-order').value = prod.sort_order || 1;
        document.getElementById('prod-badge').value = prod.badge || '';
        document.getElementById('prod-badge-color').value = prod.badge_color || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
        document.getElementById('prod-image-url').value = prod.image_url || '';
        document.getElementById('prod-description').value = prod.description || '';
        document.getElementById('prod-is-visible').checked = prod.is_visible !== false;
        document.getElementById('prod-is-ready').checked = prod.is_ready !== false;

        const variants = Array.isArray(prod.variants) && prod.variants.length > 0
            ? prod.variants
            : [{ id: '', label: '1 Bulan Private', price: 15000 }];
        variants.forEach(v => addVariantRow(v.label, v.price, v.id));
    } else {
        title.textContent = 'Tambah Produk Baru';
        document.getElementById('product-form').reset();
        document.getElementById('prod-db-id').value = '';
        document.getElementById('prod-sort-order').value = adminProducts.length + 1;
        document.getElementById('prod-is-visible').checked = true;
        document.getElementById('prod-is-ready').checked = true;
        addVariantRow('1 Bulan Sharing', 15000);
        addVariantRow('1 Bulan Private', 30000);
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function addVariantRow(label = '', price = '', varId = '') {
    const container = document.getElementById('variants-builder-list');
    const row = document.createElement('div');
    row.className = 'variant-row grid grid-cols-12 gap-2 items-center';
    row.innerHTML = `
        <input type="hidden" class="var-id" value="${varId}">
        <div class="col-span-6">
            <input type="text" required placeholder="Nama Paket (mis: 1 Bulan Invite)" value="${label}" class="var-label w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500">
        </div>
        <div class="col-span-4">
            <input type="number" required min="0" step="500" placeholder="Harga (Rp)" value="${price}" class="var-price w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500">
        </div>
        <div class="col-span-2 flex justify-end">
            <button type="button" onclick="this.closest('.variant-row').remove()" class="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/25 text-slate-400 hover:text-rose-400 transition-colors" title="Hapus Varian">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    container.appendChild(row);
    lucide.createIcons();
}

async function saveProductToSupabase(e) {
    e.preventDefault();
    if (!supabaseClient) return;

    const dbId = document.getElementById('prod-db-id').value;
    const slug = document.getElementById('prod-slug').value.trim().toLowerCase().replace(/\s+/g, '-');

    const variantRows = document.querySelectorAll('#variants-builder-list .variant-row');
    const variants = [];
    variantRows.forEach((row, index) => {
        const label = row.querySelector('.var-label').value.trim();
        const price = parseInt(row.querySelector('.var-price').value, 10) || 0;
        const existingId = row.querySelector('.var-id').value;
        if (label) {
            variants.push({
                id: existingId || `${slug}-var-${index + 1}`,
                label,
                price
            });
        }
    });

    if (variants.length === 0) {
        showToast('Minimal harus ada 1 varian harga!');
        return;
    }

    const payload = {
        slug,
        name: document.getElementById('prod-name').value.trim(),
        category: document.getElementById('prod-category').value,
        category_label: document.getElementById('prod-category-label').value.trim(),
        sort_order: parseInt(document.getElementById('prod-sort-order').value, 10) || 1,
        badge: document.getElementById('prod-badge').value.trim(),
        badge_color: document.getElementById('prod-badge-color').value,
        image_url: document.getElementById('prod-image-url').value.trim() || null,
        description: document.getElementById('prod-description').value.trim(),
        is_visible: document.getElementById('prod-is-visible').checked,
        is_ready: document.getElementById('prod-is-ready').checked,
        variants
    };

    const btnSave = document.getElementById('btn-save-product');
    btnSave.disabled = true;

    let error;
    if (dbId) {
        ({ error } = await supabaseClient.from('products').update(payload).eq('id', dbId));
    } else {
        ({ error } = await supabaseClient.from('products').insert([payload]));
    }

    btnSave.disabled = false;

    if (error) {
        showToast('Gagal menyimpan ke Supabase: ' + error.message);
        return;
    }

    closeProductModal();
    showToast(dbId ? 'Perubahan produk disimpan!' : 'Produk baru ditambahkan ke katalog!');
    fetchProductsFromSupabase();
}

// ==================== KELOLA ANTREAN ORDER & RESI ====================
function switchMainAdminTab(tab) {
    const secOrders = document.getElementById('section-admin-orders');
    const secProducts = document.getElementById('section-admin-products');
    const btnOrders = document.getElementById('tab-btn-orders');
    const btnProducts = document.getElementById('tab-btn-products');

    if (tab === 'orders') {
        secOrders.classList.remove('hidden');
        secProducts.classList.add('hidden');
        btnOrders.className = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-600 text-white shadow-lg shadow-brand-600/20 flex items-center gap-2';
        btnProducts.className = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60';
    } else {
        secProducts.classList.remove('hidden');
        secOrders.classList.add('hidden');
        btnProducts.className = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-600 text-white shadow-lg shadow-brand-600/20';
        btnOrders.className = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 flex items-center gap-2';
    }
}

async function fetchOrdersFromSupabase() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        showToast('Gagal memuat order: ' + error.message);
        return;
    }
    adminOrders = data || [];
    renderAdminOrdersList();
}

function formatBuyerWa(raw) {
    let clean = (raw || '').replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
}

function renderAdminOrdersList() {
    const container = document.getElementById('admin-orders-container');
    const pendingBadge = document.getElementById('admin-pending-badge');
    if (!container) return;

    const pendingCount = adminOrders.filter(o => o.status === 'pending').length;
    if (pendingBadge) {
        pendingBadge.textContent = pendingCount;
        pendingBadge.classList.toggle('hidden', pendingCount === 0);
    }

    if (adminOrders.length === 0) {
        container.innerHTML = `<div class="p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center text-xs text-slate-400">Belum ada pesanan masuk dari katalog.</div>`;
        return;
    }

    container.innerHTML = adminOrders.map(order => {
        const badge = order.status === 'pending'
            ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">⏳ Menunggu Cek Stok</span>`
            : order.status === 'approved'
            ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✅ Stok Ready • Resi Terbit</span>`
            : `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">↩️ Stok Kosong / Refund</span>`;

        const itemsHtml = (order.items || []).map(it => `
            <li class="flex justify-between text-xs text-slate-300">
                <span>• ${it.productName} (${it.variantLabel}) x${it.qty}</span>
                <span class="font-semibold">${formatRupiah(it.subtotal)}</span>
            </li>
        `).join('');

        return `
            <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div>
                        <span class="font-display font-bold text-sm text-white">${order.order_code}</span>
                        <p class="text-xs text-slate-300 mt-0.5">Pembeli: <strong>${order.buyer_name}</strong> (${order.buyer_wa}) • Email: <span class="text-brand-300">${order.buyer_email || '-'}</span></p>
                    </div>
                    ${badge}
                </div>
                <ul class="space-y-1 bg-slate-900/70 p-3 rounded-xl border border-slate-800/60">
                    ${itemsHtml}
                    <li class="pt-1.5 mt-1.5 border-t border-slate-800 flex justify-between text-xs font-bold text-white">
                        <span>Total (${order.payment_method})</span>
                        <span class="text-emerald-400">${formatRupiah(order.total)}</span>
                    </li>
                </ul>
                <div class="flex flex-wrap items-center justify-end gap-2">
                    <button onclick="processOrderAction(${order.id}, 'approved')" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                        ✅ Terima Stok Ready & Kirim Resi WA
                    </button>
                    <button onclick="processOrderAction(${order.id}, 'refunded')" class="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold">
                        ↩️ Stok Kosong / Ajukan Refund WA
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function processOrderAction(orderId, newStatus) {
    const order = adminOrders.find(o => o.id === orderId);
    if (!order) return;

    const { error } = await supabaseClient.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
        showToast('Gagal update status: ' + error.message);
        return;
    }

    order.status = newStatus;
    renderAdminOrdersList();

    const waLink = formatBuyerWa(order.buyer_wa);
    const itemsText = (order.items || []).map((it, i) => `${i + 1}. ${it.productName} (${it.variantLabel}) x${it.qty} = ${formatRupiah(it.subtotal)}`).join('\n');

    const msg = newStatus === 'approved'
        ? `✅ *RESI ORDER & KONFIRMASI STOK READY — QIZA.ID*\n\nHalo Kak *${order.buyer_name}* 👋, stok pesanan Kakak *TERSEDIA (READY)*!\n\n🧾 *No. Resi:* ${order.order_code}\n📧 *Email Tujuan:* ${order.buyer_email || '-'}\n\n🛒 *Rincian:*\n${itemsText}\n\n💰 *Total Tagihan:* *${formatRupiah(order.total)}*\n💳 *Metode:* ${order.payment_method}\n\n🏦 *Tujuan Pembayaran Resmi:*\n${STORE_PAYMENT_INFO}\n\nSilakan transfer sesuai nominal dan kirim bukti transfer di chat ini ya Kak. Terima kasih! 🙏`
        : `⚠️ *KONFIRMASI STOK & PROSES REFUND — QIZA.ID*\n\nHalo Kak *${order.buyer_name}* 👋, mohon maaf stok untuk pesanan *${order.order_code}* sedang *HABIS / KOSONG*.\n\nJika belum transfer, mohon *JANGAN* transfer dulu ya Kak. Jika sudah terlanjur bayar, balas chat ini dengan data rekening/e-wallet untuk *REFUND 100%* tanpa potongan. Terima kasih 🙏`;

    window.open(`https://wa.me/${waLink}?text=${encodeURIComponent(msg)}`, '_blank');
}

let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
    }, 3000);
}

window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initAuth();
});
