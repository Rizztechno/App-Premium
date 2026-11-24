/* ==========================================================================
   Qiza.id — Admin: kelola produk, harga, stok & antrean order (Supabase)
   Keamanan sebenarnya ada di RLS (supabase/schema.sql). Kode ini hanya UI.
   ========================================================================== */

const { esc, safeBadgeClass, safeImageUrl, safeSlug, formatRupiah, normalizeWa, openPendingTab, goToUrl, ALLOWED_BADGE_COLORS } = window.QizaUtils;
const CFG = window.QIZA_CONFIG || {};

const isSupabaseConfigured = Boolean(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);
const supabaseClient = isSupabaseConfigured
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    })
    : null;

// TODO(pemilik toko): pastikan nomor rekening di bawah ini BENAR sebelum dipakai.
// "1234567890" hanyalah contoh dari file asli.
const STORE_PAYMENT_INFO = '• DANA / GoPay / OVO: 0822-3312-9573 (a.n M.R.A)\n• BCA / SeaBank: 1234567890 (a.n Qiza.id)\n• QRIS: Minta barcode QRIS ke admin jika bayar via QRIS';

const IDLE_LOGOUT_MS = 30 * 60 * 1000; // auto-logout 30 menit tanpa aktivitas

let adminProducts = [];
let adminOrders = [];
let adminActiveCategory = 'all';
let idleTimer = null;

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

function renderLogo(product) {
    const img = safeImageUrl(product.image_url);
    if (img) {
        return `<img src="${esc(img)}" alt="${esc(product.name)}" referrerpolicy="no-referrer" class="w-11 h-11 rounded-2xl object-cover shadow-md shrink-0">`;
    }
    const svg = Object.prototype.hasOwnProperty.call(appIconsSVG, product.slug)
        ? appIconsSVG[product.slug]
        : `<div class="w-full h-full bg-brand-600 flex items-center justify-center font-bold text-white text-xs">${esc(String(product.name || 'APP').slice(0, 3).toUpperCase())}</div>`;
    return `<div class="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shadow-md shrink-0">${svg}</div>`;
}

// Pesan error RLS yang ramah. Update/insert yang ditolak RLS TIDAK melempar error
// (hanya 0 baris terdampak), jadi kita cek jumlah baris yang dikembalikan.
const RLS_HINT = 'Ditolak database: akun ini belum terdaftar sebagai admin (jalankan langkah #6 di supabase/schema.sql).';

// ==================== AUTH ====================
async function verifyAdmin() {
    const { data, error } = await supabaseClient.rpc('is_admin');
    return !error && data === true;
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
        await handleAdminLogout(true);
    }, IDLE_LOGOUT_MS);
}
['click', 'keydown', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, () => { if (idleTimer) resetIdleTimer(); }, { passive: true }));

async function initAuth() {
    const connBadge = document.getElementById('db-connection-badge');
    if (!isSupabaseConfigured) {
        connBadge.textContent = '● Konfigurasi Supabase belum terbaca (assets/config.js)';
        connBadge.className = 'text-rose-400 font-medium';
        return;
    }
    connBadge.textContent = '● Terhubung ke Supabase';
    connBadge.className = 'text-emerald-400 font-medium';

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        if (await verifyAdmin()) showDashboard(session.user);
        else await supabaseClient.auth.signOut();
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const errorBox = document.getElementById('login-error');
    const btnLogin = document.getElementById('btn-login');

    if (!isSupabaseConfigured) {
        errorBox.textContent = 'Konfigurasi Supabase belum terbaca. Periksa file assets/config.js.';
        errorBox.classList.remove('hidden');
        return;
    }

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    errorBox.classList.add('hidden');
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span>Memverifikasi...</span>';

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    let ok = false;
    if (!error) {
        ok = await verifyAdmin();
        if (!ok) await supabaseClient.auth.signOut();
    }

    btnLogin.disabled = false;
    btnLogin.innerHTML = '<i data-lucide="lock" class="w-4 h-4"></i><span>Masuk Dashboard</span>';
    lucide.createIcons();

    if (error) {
        errorBox.textContent = 'Login gagal: email atau password salah.'; // pesan generik
        errorBox.classList.remove('hidden');
        return;
    }
    if (!ok) {
        errorBox.textContent = 'Akun ini tidak memiliki akses admin.';
        errorBox.classList.remove('hidden');
        return;
    }

    document.getElementById('login-password').value = '';
    showDashboard(data.user);
    showToast('Berhasil masuk sebagai Admin!');
}

async function handleAdminLogout(auto = false) {
    clearTimeout(idleTimer); idleTimer = null;
    if (supabaseClient) await supabaseClient.auth.signOut();
    adminProducts = []; adminOrders = [];
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    showToast(auto ? 'Sesi berakhir karena tidak aktif.' : 'Sesi Admin berakhir.');
}

function showDashboard(user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.getElementById('admin-user-email').textContent = user?.email || 'Admin Qiza.id';
    resetIdleTimer();
    fetchProductsFromSupabase();
    fetchOrdersFromSupabase();
}

// ==================== PRODUK ====================
async function fetchProductsFromSupabase() {
    if (!supabaseClient) return;
    const loading = document.getElementById('admin-loading');
    const list = document.getElementById('admin-products-list');
    loading.classList.remove('hidden');
    list.innerHTML = '';

    const { data, error } = await supabaseClient
        .from('products').select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

    loading.classList.add('hidden');
    if (error) { showToast('Gagal memuat produk: ' + error.message); return; }

    adminProducts = data || [];
    updateStats();
    renderAdminProductsTable();
}

function updateStats() {
    document.getElementById('stat-total').textContent = adminProducts.length;
    document.getElementById('stat-visible').textContent = adminProducts.filter(p => p.is_visible).length;
    document.getElementById('stat-ready').textContent = adminProducts.filter(p => p.is_ready).length;
    document.getElementById('stat-out').textContent = adminProducts.filter(p => !p.is_ready || !p.is_visible).length;
}

function setAdminCategory(cat) {
    adminActiveCategory = cat;
    document.querySelectorAll('.admin-cat-btn').forEach(btn => {
        btn.className = btn.dataset.cat === cat
            ? 'admin-cat-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20'
            : 'admin-cat-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60';
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
                ${esc(v.label)}: <strong class="text-emerald-400">${formatRupiah(v.price)}</strong>
            </span>`).join('');
        const pid = Number(product.id);

        return `
            <div class="p-4 rounded-2xl bg-slate-950/90 border ${product.is_visible ? 'border-slate-800' : 'border-rose-500/30 opacity-70'} flex flex-col justify-between gap-4 transition-all">
                <div class="space-y-3">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-3 min-w-0">
                            ${renderLogo(product)}
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">#${Number(product.sort_order) || 0}</span>
                                    <h3 class="font-display font-bold text-base text-white truncate">${esc(product.name)}</h3>
                                </div>
                                <p class="text-[11px] text-brand-400 truncate">${esc(product.category_label)} • <span class="text-slate-500">${esc(product.slug)}</span></p>
                            </div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${safeBadgeClass(product.badge_color)}">${esc(product.badge || 'Promo')}</span>
                    </div>

                    <p class="text-xs text-slate-400 line-clamp-2">${esc(product.description || '-')}</p>

                    <div class="flex flex-wrap gap-1.5">
                        ${variantsBadges || '<span class="text-[11px] text-slate-500">Belum ada varian harga</span>'}
                    </div>
                </div>

                <div class="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <div class="grid grid-cols-2 gap-2">
                        <button data-action="toggle-field" data-id="${pid}" data-field="is_visible" data-value="${!product.is_visible}" class="py-2 px-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                            product.is_visible
                            ? 'bg-brand-600/20 border-brand-500/40 text-brand-300 hover:bg-brand-600/30'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}">
                            <i data-lucide="${product.is_visible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                            <span>${product.is_visible ? 'Tampil di Toko' : 'Disembunyikan'}</span>
                        </button>
                        <button data-action="toggle-field" data-id="${pid}" data-field="is_ready" data-value="${!product.is_ready}" class="py-2 px-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                            product.is_ready
                            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                            : 'bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30'}">
                            <i data-lucide="${product.is_ready ? 'check-circle' : 'x-circle'}" class="w-3.5 h-3.5"></i>
                            <span>${product.is_ready ? 'Stok Ready' : 'Stok Habis'}</span>
                        </button>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-action="edit-product" data-id="${pid}" class="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-brand-400"></i>
                            <span>Edit Paket & Harga</span>
                        </button>
                        <button data-action="delete-product" data-id="${pid}" class="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/25 text-slate-400 hover:text-rose-400 transition-all" title="Hapus Produk">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join('');

    lucide.createIcons();
}

async function quickToggleField(id, fieldName, newValue) {
    if (!supabaseClient || !['is_visible', 'is_ready'].includes(fieldName)) return;
    const { data, error } = await supabaseClient
        .from('products').update({ [fieldName]: newValue }).eq('id', id).select('id');

    if (error) { showToast('Gagal memperbarui status: ' + error.message); return; }
    if (!data || data.length === 0) { showToast(RLS_HINT); return; }

    const p = adminProducts.find(x => x.id === id);
    if (p) p[fieldName] = newValue;
    updateStats();
    renderAdminProductsTable();
    showToast('Tersimpan. Toko akan menampilkan perubahan ini.');
}

async function deleteProductFromSupabase(id) {
    const p = adminProducts.find(x => x.id === id);
    if (!p) return;
    if (!confirm(`Hapus produk "${p.name}" secara permanen dari database?`)) return;
    const { data, error } = await supabaseClient.from('products').delete().eq('id', id).select('id');
    if (error) { showToast('Gagal menghapus: ' + error.message); return; }
    if (!data || data.length === 0) { showToast(RLS_HINT); return; }
    adminProducts = adminProducts.filter(x => x.id !== id);
    updateStats();
    renderAdminProductsTable();
    showToast(`${p.name} dihapus dari database.`);
}

// Hanya MENAMBAH produk bawaan yang belum ada. Produk yang sudah ada (dan harganya) tidak ditimpa.
async function seedDefaultProducts() {
    if (!supabaseClient) return;
    if (!confirm('Tambahkan produk bawaan yang belum ada di database? (Produk yang sudah ada tidak akan diubah)')) return;

    const btn = document.getElementById('btn-seed');
    btn.disabled = true;
    btn.innerHTML = '<span>Mengimport...</span>';

    const { data, error } = await supabaseClient
        .from('products')
        .upsert(defaultSeedProducts, { onConflict: 'slug', ignoreDuplicates: true })
        .select('id');

    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="database-zap" class="w-4 h-4"></i><span>Import 13 Produk Awal</span>';
    lucide.createIcons();

    if (error) { showToast('Gagal import: ' + error.message); return; }
    const n = (data || []).length;
    showToast(n > 0 ? `${n} produk baru ditambahkan.` : 'Tidak ada produk baru (semua sudah ada, atau akun bukan admin).');
    fetchProductsFromSupabase();
}

// ==================== MODAL TAMBAH / EDIT ====================
function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    document.getElementById('variants-builder-list').innerHTML = '';

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
        document.getElementById('prod-badge-color').value = safeBadgeClass(prod.badge_color);
        document.getElementById('prod-image-url').value = prod.image_url || '';
        document.getElementById('prod-description').value = prod.description || '';
        document.getElementById('prod-is-visible').checked = prod.is_visible !== false;
        document.getElementById('prod-is-ready').checked = prod.is_ready !== false;

        const variants = Array.isArray(prod.variants) && prod.variants.length > 0
            ? prod.variants : [{ id: '', label: '1 Bulan Private', price: 15000 }];
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

// Dibangun dengan DOM API (bukan innerHTML) supaya nilai varian tidak bisa menyuntikkan HTML.
function addVariantRow(label = '', price = '', varId = '') {
    const container = document.getElementById('variants-builder-list');
    const row = document.createElement('div');
    row.className = 'variant-row grid grid-cols-12 gap-2 items-center';

    const hid = document.createElement('input');
    hid.type = 'hidden'; hid.className = 'var-id'; hid.value = varId || '';

    const c1 = document.createElement('div'); c1.className = 'col-span-6';
    const inLabel = document.createElement('input');
    inLabel.type = 'text'; inLabel.required = true; inLabel.maxLength = 60;
    inLabel.placeholder = 'Nama Paket (mis: 1 Bulan Invite)'; inLabel.value = label;
    inLabel.className = 'var-label w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500';
    c1.appendChild(inLabel);

    const c2 = document.createElement('div'); c2.className = 'col-span-4';
    const inPrice = document.createElement('input');
    inPrice.type = 'number'; inPrice.required = true; inPrice.min = '0'; inPrice.max = '10000000'; inPrice.step = '1'; inPrice.inputMode = 'numeric';
    inPrice.placeholder = 'Harga (Rp)'; inPrice.value = price;
    inPrice.className = 'var-price w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500';
    c2.appendChild(inPrice);

    const c3 = document.createElement('div'); c3.className = 'col-span-2 flex justify-end';
    const del = document.createElement('button');
    del.type = 'button'; del.title = 'Hapus Varian';
    del.className = 'p-2 rounded-xl bg-slate-800 hover:bg-rose-600/25 text-slate-400 hover:text-rose-400 transition-colors';
    del.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
    del.addEventListener('click', () => row.remove());
    c3.appendChild(del);

    row.append(hid, c1, c2, c3);
    container.appendChild(row);
    lucide.createIcons();
}

async function saveProductToSupabase(e) {
    e.preventDefault();
    if (!supabaseClient) return;

    const dbId = document.getElementById('prod-db-id').value;
    const slug = safeSlug(document.getElementById('prod-slug').value.trim().toLowerCase().replace(/\s+/g, '-'));
    if (!slug) { showToast('Slug hanya boleh huruf kecil, angka, dan strip (maks 40).'); return; }

    const rawImg = document.getElementById('prod-image-url').value.trim();
    const imageUrl = rawImg ? safeImageUrl(rawImg) : null;
    if (rawImg && !imageUrl) { showToast('URL logo harus diawali https://'); return; }

    const badgeColor = document.getElementById('prod-badge-color').value;
    if (!ALLOWED_BADGE_COLORS.includes(badgeColor)) { showToast('Warna badge tidak valid.'); return; }

    const variants = [];
    const seen = new Set();
    let bad = false;
    document.querySelectorAll('#variants-builder-list .variant-row').forEach((row, index) => {
        const label = row.querySelector('.var-label').value.trim();
        const price = parseInt(row.querySelector('.var-price').value, 10);
        let id = row.querySelector('.var-id').value;
        if (!label) return;
        if (!Number.isFinite(price) || price < 0 || price > 10000000) { bad = true; return; }
        if (!id || seen.has(id)) id = `${slug}-${Date.now().toString(36)}${index}`; // id unik & stabil
        seen.add(id);
        variants.push({ id, label, price });
    });

    if (bad) { showToast('Harga varian harus angka 0 – 10.000.000.'); return; }
    if (variants.length === 0) { showToast('Minimal harus ada 1 varian harga!'); return; }

    const payload = {
        slug,
        name: document.getElementById('prod-name').value.trim(),
        category: document.getElementById('prod-category').value,
        category_label: document.getElementById('prod-category-label').value.trim(),
        sort_order: parseInt(document.getElementById('prod-sort-order').value, 10) || 1,
        badge: document.getElementById('prod-badge').value.trim(),
        badge_color: badgeColor,
        image_url: imageUrl,
        description: document.getElementById('prod-description').value.trim(),
        is_visible: document.getElementById('prod-is-visible').checked,
        is_ready: document.getElementById('prod-is-ready').checked,
        variants
    };

    const btnSave = document.getElementById('btn-save-product');
    btnSave.disabled = true;

    const query = dbId
        ? supabaseClient.from('products').update(payload).eq('id', dbId).select('id')
        : supabaseClient.from('products').insert([payload]).select('id');
    const { data, error } = await query;

    btnSave.disabled = false;

    if (error) {
        const dup = (error.message || '').includes('products_slug_key') || error.code === '23505';
        const badVar = (error.message || '').includes('invalid_variants');
        showToast(dup ? 'Slug sudah dipakai produk lain.' : badVar ? 'Varian tidak valid (harga bulat 0–10.000.000).' : 'Gagal menyimpan ke Supabase: ' + error.message);
        return;
    }
    if (!data || data.length === 0) { showToast(RLS_HINT); return; }

    closeProductModal();
    showToast(dbId ? 'Perubahan tersimpan. Toko ikut diperbarui.' : 'Produk baru ditambahkan ke katalog!');
    fetchProductsFromSupabase();
}

// ==================== ORDER & RESI ====================
function switchMainAdminTab(tab) {
    const secOrders = document.getElementById('section-admin-orders');
    const secProducts = document.getElementById('section-admin-products');
    const btnOrders = document.getElementById('tab-btn-orders');
    const btnProducts = document.getElementById('tab-btn-products');
    const on = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-600 text-white shadow-lg shadow-brand-600/20 flex items-center gap-2';
    const off = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 flex items-center gap-2';

    if (tab === 'orders') {
        secOrders.classList.remove('hidden'); secProducts.classList.add('hidden');
        btnOrders.className = on; btnProducts.className = off;
    } else {
        secProducts.classList.remove('hidden'); secOrders.classList.add('hidden');
        btnProducts.className = on; btnOrders.className = off;
    }
}

async function fetchOrdersFromSupabase() {
    if (!supabaseClient) return;
    // Order 'pending' selalu dimuat penuh (tidak bisa "tenggelam" oleh banjir order palsu),
    // ditambah 100 order terbaru yang sudah diproses.
    const [pend, done] = await Promise.all([
        supabaseClient.from('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(500),
        supabaseClient.from('orders').select('*').neq('status', 'pending').order('created_at', { ascending: false }).limit(100)
    ]);
    const error = pend.error || done.error;
    if (error) { showToast('Gagal memuat order: ' + error.message); return; }
    adminOrders = [...(pend.data || []), ...(done.data || [])];
    renderAdminOrdersList();
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

        const itemsHtml = (Array.isArray(order.items) ? order.items : []).map(it => `
            <li class="flex justify-between text-xs text-slate-300">
                <span>• ${esc(it.productName)} (${esc(it.variantLabel)}) x${Number(it.qty) || 0}</span>
                <span class="font-semibold">${formatRupiah(it.subtotal)}</span>
            </li>`).join('');
        const oid = Number(order.id);

        return `
            <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div>
                        <span class="font-display font-bold text-sm text-white">${esc(order.order_code)}</span>
                        <p class="text-xs text-slate-300 mt-0.5">Pembeli: <strong>${esc(order.buyer_name)}</strong> (${esc(order.buyer_wa)}) • Email: <span class="text-brand-300">${esc(order.buyer_email || '-')}</span></p>
                        ${order.note && order.note !== '-' ? `<p class="text-[11px] text-slate-400 mt-0.5">Catatan: ${esc(order.note)}</p>` : ''}
                    </div>
                    ${badge}
                </div>
                <ul class="space-y-1 bg-slate-900/70 p-3 rounded-xl border border-slate-800/60">
                    ${itemsHtml}
                    <li class="pt-1.5 mt-1.5 border-t border-slate-800 flex justify-between text-xs font-bold text-white">
                        <span>Total (${esc(order.payment_method)})</span>
                        <span class="text-emerald-400">${formatRupiah(order.total)}</span>
                    </li>
                </ul>
                <div class="flex flex-wrap items-center justify-end gap-2">
                    <button data-action="order-approved" data-id="${oid}" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                        ✅ Terima Stok Ready & Kirim Resi WA
                    </button>
                    <button data-action="order-refunded" data-id="${oid}" class="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold">
                        ↩️ Stok Kosong / Ajukan Refund WA
                    </button>
                </div>
            </div>`;
    }).join('');
}

async function processOrderAction(orderId, newStatus) {
    if (!['approved', 'refunded'].includes(newStatus)) return;
    const order = adminOrders.find(o => o.id === orderId);
    if (!order) return;

    const tab = openPendingTab(); // buka sinkron agar tidak diblok popup-blocker
    const { data, error } = await supabaseClient
        .from('orders').update({ status: newStatus }).eq('id', orderId).select('id');

    if (error || !data || data.length === 0) {
        if (tab && !tab.closed) tab.close();
        showToast(error ? 'Gagal update status: ' + error.message : RLS_HINT);
        return;
    }

    order.status = newStatus;
    renderAdminOrdersList();

    const waNum = normalizeWa(order.buyer_wa);
    const itemsText = (Array.isArray(order.items) ? order.items : [])
        .map((it, i) => `${i + 1}. ${it.productName} (${it.variantLabel}) x${it.qty} = ${formatRupiah(it.subtotal)}`).join('\n');

    const msg = newStatus === 'approved'
        ? `✅ *RESI ORDER & KONFIRMASI STOK READY — QIZA.ID*\n\nHalo Kak *${order.buyer_name}* 👋, stok pesanan Kakak *TERSEDIA (READY)*!\n\n🧾 *No. Resi:* ${order.order_code}\n📧 *Email Tujuan:* ${order.buyer_email || '-'}\n\n🛒 *Rincian:*\n${itemsText}\n\n💰 *Total Tagihan:* *${formatRupiah(order.total)}*\n💳 *Metode:* ${order.payment_method}\n\n🏦 *Tujuan Pembayaran Resmi:*\n${STORE_PAYMENT_INFO}\n\nSilakan transfer sesuai nominal dan kirim bukti transfer di chat ini ya Kak. Terima kasih! 🙏`
        : `⚠️ *KONFIRMASI STOK & PROSES REFUND — QIZA.ID*\n\nHalo Kak *${order.buyer_name}* 👋, mohon maaf stok untuk pesanan *${order.order_code}* sedang *HABIS / KOSONG*.\n\nJika belum transfer, mohon *JANGAN* transfer dulu ya Kak. Jika sudah terlanjur bayar, balas chat ini dengan data rekening/e-wallet untuk *REFUND 100%* tanpa potongan. Terima kasih 🙏`;

    goToUrl(tab, `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`);
}

// ==================== UI ====================
let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('opacity-0', 'translate-y-4'), 3500);
}

document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const id = parseInt(el.dataset.id, 10);
    switch (el.dataset.action) {
        case 'toggle-field': quickToggleField(id, el.dataset.field, el.dataset.value === 'true'); break;
        case 'edit-product': openProductModal(id); break;
        case 'delete-product': deleteProductFromSupabase(id); break;
        case 'order-approved': processOrderAction(id, 'approved'); break;
        case 'order-refunded': processOrderAction(id, 'refunded'); break;
    }
});

// Daftar aksi yang boleh dipanggil dari atribut data-click / data-input / data-submit di HTML.
window.QizaUtils.bindActions({
    handleAdminLogin, handleAdminLogout, openProductModal, closeProductModal, addVariantRow,
    saveProductToSupabase, seedDefaultProducts, fetchProductsFromSupabase, fetchOrdersFromSupabase,
    setAdminCategory, switchMainAdminTab, renderAdminProductsTable
});

// Tautan ke toko (origin berbeda): diisi dari config.js; disembunyikan bila belum diatur.
function wireStoreLinks() {
    let base = '';
    try { const u = new URL(CFG.STORE_URL || ''); if (u.protocol === 'https:' || u.hostname === 'localhost') base = u.origin; } catch (e) { /* kosong */ }
    document.querySelectorAll('[data-store-link]').forEach(a => {
        if (!base) { a.classList.add('hidden'); return; }
        a.href = base + (a.getAttribute('data-store-link') || '');
    });
}

// Order baru muncul otomatis tanpa perlu menekan refresh (hanya saat tab terlihat & sudah login).
setInterval(() => {
    const dash = document.getElementById('dashboard-screen');
    if (document.visibilityState === 'visible' && dash && !dash.classList.contains('hidden')) fetchOrdersFromSupabase();
}, 30000);

window.addEventListener('DOMContentLoaded', () => {
    wireStoreLinks();
    lucide.createIcons();
    initAuth();
});
