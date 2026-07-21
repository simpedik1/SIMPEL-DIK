// Naikkan versi ini setiap kali kamu deploy perubahan (index.html, css, dll)
// agar browser tahu ada cache baru dan membuang cache lama.
const CACHE_NAME = 'simpedik-cache-v2';

// File inti yang WAJIB bisa dibuka walau offline / jaringan gagal.
// Sesuaikan daftar ini kalau ada file app-shell lain (css/js terpisah, dll).
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// --- INSTALL: simpan app-shell ke cache ---
self.addEventListener('install', (e) => {
  console.log('Service Worker: install, menyimpan app-shell');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// --- ACTIVATE: bersihkan cache versi lama ---
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// --- FETCH: network-first, fallback ke cache, fallback terakhir ke index.html ---
self.addEventListener('fetch', (e) => {
  // Hanya tangani GET request (biar tidak ganggu POST/PUT ke Supabase, dll)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Simpan salinan terbaru ke cache supaya offline berikutnya tetap up-to-date
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(async () => {
        // Jaringan gagal -> coba ambil dari cache
        const cached = await caches.match(e.request);
        if (cached) return cached;

        // Kalau ini adalah navigasi ke halaman (bukan gambar/aset),
        // tampilkan index.html dari cache sebagai fallback,
        // supaya app tetap terbuka (tidak muncul error/404) walau offline.
        if (e.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }

        // Kalau benar-benar tidak ada apa pun di cache, biarkan error asli lewat.
        return Response.error();
      })
  );
});
