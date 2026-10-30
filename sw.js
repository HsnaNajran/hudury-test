// حضوري — عامل الخدمة. يعمل دون إنترنت بعد أول فتح، ولا يرسل أي بيانات إلى أي خادم.
// لا يمس بيانات المستخدم (IndexedDB/localStorage)؛ يخزن ملفات التطبيق فقط.
const VERSION = 'v6.0.3-ac7cc365', C = 'hudury-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png', './icons/favicon-32.png'];
self.addEventListener('install', (e) => {
  // cache:'reload' يتجاوز ذاكرة المتصفح المؤقتة فيُخزَّن الإصدار الجديد فعلًا
  e.waitUntil(caches.open(C).then((c) => Promise.all(FILES.map((f) => fetch(new Request(f, { cache: 'reload' })).then((r) => r.ok && c.put(f, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x.startsWith('hudury-') && x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || /\/(sw\.js|version\.json)$/.test(url.pathname)) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.webmanifest');
  if (isPage) {
    // الصفحة: من الشبكة أولًا مع إعادة التحقق دائمًا، ثم من المخزن عند انقطاع الإنترنت
    // يُطلب العنوان نصًا (لا نسخة من طلب التصفح) لأن Safari قد يرفض نسخ طلب التصفح فيعلق على النسخة المخزنة
    e.respondWith(fetch(url.href, { cache: 'no-store', credentials: 'same-origin' }).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(C).then((c) => c.put(url.pathname.endsWith('.webmanifest') ? req : './index.html', cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
    return;
  }
  // الأيقونات: من المخزن ثم تحديث في الخلفية
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((m) => { const net = fetch(req, { cache: 'no-cache' }).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(C).then((c) => c.put(req, cp)); } return r; }).catch(() => m); return m || net; }));
});
