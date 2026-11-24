/* Helper keamanan & format, dipakai toko dan admin. */
(function (global) {
    'use strict';

    // Escape untuk konteks teks HTML DAN atribut HTML.
    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;');
    }

    // Hanya warna badge dari daftar putih yang boleh jadi class CSS.
    const ALLOWED_BADGE_COLORS = [
        'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'bg-rose-500/20 text-rose-300 border-rose-500/30',
        'bg-red-500/20 text-red-300 border-red-500/30',
        'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'bg-pink-500/20 text-pink-300 border-pink-500/30',
        'bg-white/15 text-white border-white/25',
        'bg-green-500/20 text-green-300 border-green-500/30',
        'bg-teal-500/20 text-teal-300 border-teal-500/30'
    ];
    function safeBadgeClass(c) {
        return ALLOWED_BADGE_COLORS.indexOf(c) !== -1 ? c : ALLOWED_BADGE_COLORS[0];
    }

    // Hanya https:// ; selain itu (javascript:, data:, http:) ditolak.
    function safeImageUrl(u) {
        if (typeof u !== 'string') return null;
        const s = u.trim();
        if (s.length > 500 || !/^https:\/\/[^\s"'<>`]+$/i.test(s)) return null;
        return s;
    }

    // Slug hanya a-z 0-9 dan strip.
    function safeSlug(s) {
        return /^[a-z0-9-]{1,40}$/.test(String(s)) ? String(s) : null;
    }

    function formatRupiah(num) {
        const n = Number(num);
        return 'Rp ' + (Number.isFinite(n) ? n : 0).toLocaleString('id-ID');
    }

    // 08xxx / +62xxx -> 62xxx (hanya digit)
    function normalizeWa(raw) {
        let d = String(raw || '').replace(/\D/g, '');
        if (d.startsWith('0')) d = '62' + d.slice(1);
        return d;
    }
    function isValidWa(raw) {
        const d = normalizeWa(raw);
        return d.length >= 9 && d.length <= 15;
    }

    // Buka WhatsApp setelah proses async tanpa kena popup-blocker:
    // tab dibuka sinkron saat klik, lalu diarahkan setelah URL siap.
    function openPendingTab() {
        let w = null;
        try { w = window.open('', '_blank'); if (w) w.opener = null; } catch (e) { w = null; }
        return w;
    }
    function goToUrl(tab, url) {
        if (!/^https:\/\/wa\.me\/\d{8,15}\?text=/.test(url)) return;
        if (tab && !tab.closed) { tab.location.href = url; }
        else { window.location.href = url; }
    }

    // Delegasi event untuk atribut data-click / data-input / data-submit di HTML.
    // Hanya fungsi yang DIDAFTARKAN eksplisit yang bisa dipanggil (bukan eval / bukan inline handler),
    // sehingga CSP bisa memblokir semua inline script.
    function bindActions(registry) {
        const own = Object.prototype.hasOwnProperty;
        const find = (ev, attr) => {
            const el = ev.target && ev.target.closest ? ev.target.closest('[' + attr + ']') : null;
            if (!el) return null;
            const name = el.getAttribute(attr);
            return own.call(registry, name) && typeof registry[name] === 'function' ? { el, fn: registry[name] } : null;
        };
        document.addEventListener('click', (ev) => {
            const hit = find(ev, 'data-click');
            if (!hit) return;
            if (hit.el.tagName === 'A') ev.preventDefault();
            let args = [];
            try {
                const raw = hit.el.getAttribute('data-args');
                const parsed = raw ? JSON.parse(raw) : [];
                if (Array.isArray(parsed)) args = parsed;
            } catch (e) { args = []; }
            hit.fn.apply(hit.el, args);
        });
        document.addEventListener('input', (ev) => {
            const hit = find(ev, 'data-input');
            if (hit) hit.fn.call(hit.el, ev);
        });
        document.addEventListener('submit', (ev) => {
            const hit = find(ev, 'data-submit');
            if (hit) hit.fn.call(hit.el, ev);
        });
    }

    global.QizaUtils = { bindActions, esc, safeBadgeClass, safeImageUrl, safeSlug, formatRupiah,
        normalizeWa, isValidWa, openPendingTab, goToUrl, ALLOWED_BADGE_COLORS };
})(typeof window !== 'undefined' ? window : globalThis);
