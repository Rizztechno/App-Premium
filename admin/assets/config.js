/* Konfigurasi publik. URL & publishable (anon) key Supabase MEMANG boleh publik,
   keamanan data dijaga oleh RLS di supabase/schema.sql.
   JANGAN PERNAH menaruh kunci RAHASIA Supabase (yang berawalan sb-secret / kunci "service") di file ini. */
window.QIZA_CONFIG = {
    SUPABASE_URL: 'https://znogdbpldvjuzsvqoaqj.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_KTycKeM2W0jckzkMSC0XOA_XaB971b2',
    ADMIN_WA: '6282233129573',
    // URL toko publik (dipakai tombol "Lihat Toko" di panel admin). Isi setelah toko ter-deploy, mis. 'https://qiza.id'
    STORE_URL: ''
};
