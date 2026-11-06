// Projects Data Store and Manager with Hybrid Backend routing (Firebase, Local Express API, or LocalStorage)
const DEFAULT_PROJECTS = [
  {
    id: "1",
    title: "Airport Flight Information Displays",
    category: "Aviation",
    shortDesc: "24/7 mission-critical FIDS systems, baggage claim displays, and airport wayfinding installations.",
    image: "assets/images/project-fids.jpg",
    client: "Dubai Airports Authority",
    year: "2025",
    location: "Terminal 3, Dubai, UAE",
    challenge: "Dubai Airports needed a flight schedule screen matrix with zero possibility of signal blackouts or delay sync lags. The system had to replace aging legacy screens and integrate into the main ATC flight scheduling database feed, maintaining 24/7 operations in high-heat passenger terminal environments.",
    solution: "We deployed a custom 3x3 LCD video wall array using 0.88mm ultra-narrow bezel screens. To guarantee 24/7 runtime, we integrated dual-redundant NovaStar controller lines configured for instant signal loop failover. An active Noctua pressure-fan ventilation grid was constructed within the mount brackets to prevent screen panel yellowing.",
    specs: {
      system: "3x3 LCD Array",
      bezel: "0.88mm Bezel",
      brightness: "700 nits",
      uptime: "100%",
      failover: "Aviation Dual Loop"
    },
    isWide: true
  },
  {
    id: "2",
    title: "Luxury Mall Facades",
    category: "Retail",
    shortDesc: "Ultra-high brightness window displays and curved LED pillars for flagship luxury retail stores.",
    image: "assets/images/project-retail.jpg",
    client: "Emaar Retail Group",
    year: "2025",
    location: "The Dubai Mall, UAE",
    challenge: "The flagship retail store front faced directly into a sunlit glass atrium. Standard panels suffered from massive solar glare reflection, fading colors, and severe thermal load. The client also requested curved screen integration around the load-bearing pillars of the entrance.",
    solution: "We installed custom-engineered 3500-nit high-brightness shopfront displays calibrated to the D65 video standard. For the entrance, we mapped flexible curved LED panels seamlessly around the main structural columns using magnetic mount modules. A secondary brightness sensor was integrated to automatically dim the screens at night.",
    specs: {
      system: "Curved LED Pillars",
      bezel: "Seamless Bezels",
      brightness: "3500 nits",
      uptime: "99.98%",
      failover: "Auto-brightness dimmer"
    },
    isWide: false
  },
  {
    id: "3",
    title: "Enterprise Command Centers",
    category: "Corporate",
    shortDesc: "0.88mm ultra-narrow bezel LCD video walls with dynamic feed management for operation hubs.",
    image: "assets/images/project-noc.jpg",
    client: "Global Logistics Corp",
    year: "2024",
    location: "Dubai Operations Center, Dubai",
    challenge: "The control center coordinates logistics and truck dispatch feeds in real-time. The engineering team needed an expansive, bezel-free canvas that could receive over 20 concurrent network camera feeds without frame drops, scaling distortion, or system crashes.",
    solution: "We engineered a massive ultra-narrow bezel LCD wall with a high-performance multi-channel matrix processor. The processor uses fiber-optic feeds to scale camera streams on the fly. The screens were color-calibrated to keep detail contrast high under artificial office light levels.",
    specs: {
      system: "Control Command Wall",
      bezel: "0.88mm Bezel",
      brightness: "500 nits",
      uptime: "99.99%",
      failover: "Redundant Matrix Processor"
    },
    isWide: false
  },
  {
    id: "4",
    title: "Smart City Digital Landmarks",
    category: "Outdoor LED",
    shortDesc: "Weatherproof IP65-rated outdoor billboard totems and giant building facade mesh LEDs.",
    image: "assets/images/project-billboard.jpg",
    client: "Municipal Tech Authority",
    year: "2026",
    location: "Sheikh Zayed Road, Dubai",
    challenge: "Outdoor displays in Dubai face extreme environment loads, with ambient temperatures reaching 50°C in summer, high UV radiation, and seasonal sandstorms. Standard panels overheat, leading to thermal expansion cracks and pixel failure.",
    solution: "We deployed heavy-duty IP65 waterproof outdoor totems featuring custom-fabricated copper cooling pipes and double-chamber air conditioning. The panels utilize high-durability gold wire LEDs with integrated UV blocking filters to maintain screen color lifespan under severe direct sun exposure.",
    specs: {
      system: "IP65 Mesh & Totems",
      bezel: "Modular Seamless",
      brightness: "6000 nits",
      uptime: "99.95%",
      failover: "Double A/C Cabinets"
    },
    isWide: true
  },
  {
    id: "5",
    title: "Flagship Architectural & Static Signage",
    category: "Static Signage",
    shortDesc: "Bespoke 3D brushed brass and halo-illuminated channel letters, monument entrance pylon, and interior wayfinding.",
    image: "assets/images/project-signage.jpg",
    client: "Al Wasl Plaza & Retail District",
    year: "2025",
    location: "Downtown Dubai, UAE",
    challenge: "The premier development required ultra-high-finish static and architectural signage that withstood extreme summer temperatures, dust storms, and intense UV exposure without acrylic yellowing, paint flaking, or LED burnout. All designs required structural certification for high-wind facades and Dubai Municipality approvals.",
    solution: "We engineered CNC-machined 316 marine-grade stainless steel channel letters with PVD titanium gold plating and silicone-sealed IP68 warm-white (3000K) halo backlighting. For the main entrance, we installed a 6-meter monolithic architectural pylon with interchangeable magnetic panels and laser-etched directory maps.",
    specs: {
      system: "Architectural 3D & Pylon",
      bezel: "Seamless PVD Brass",
      brightness: "Warm-White 3000K Halo",
      uptime: "100% Sealed IP68",
      failover: "Redundant MeanWell PSUs"
    },
    isWide: true
  }
];

const DEFAULT_CATEGORIES = ["Aviation", "Retail", "Corporate", "Outdoor LED", "Static Signage"];

let db = null;
let storage = null;
let backendMode = 'local-storage'; // Fallback
let apiBaseUrl = 'http://localhost:8080'; // Default express backend url

// Hardcoded Firebase Config in Code (Edit this with your production credentials to activate cloud storage)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA7rK6RrUlbWSG9uGcvRSeJDfqbu6NsuAw",
  authDomain: "dw-website-dbba1.firebaseapp.com",
  projectId: "dw-website-dbba1",
  storageBucket: "dw-website-dbba1.firebasestorage.app",
  messagingSenderId: "760211366187",
  appId: "1:760211366187:web:68f9464746cf19c672256e"
};

// Backend detection runs ONCE per page load. Every store method awaits the same promise,
// so we no longer re-initialise Firebase / re-sign-in on every single read or write.
let _backendPromise = null;
function detectBackend() {
  if (!_backendPromise) _backendPromise = _detectBackendOnce();
  return _backendPromise;
}

async function _detectBackendOnce() {
  // 1. Firebase (configured in code)
  if (typeof firebase !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
        try {
          // Plain HTTPS long-polling instead of a streaming channel. Office/hotel networks and some browsers
          // block the stream, which made the site wait 10s+ and then show nothing.
          firebase.firestore().settings({ experimentalForceLongPolling: true, merge: true });
        } catch (setErr) {}
      }
      db = firebase.firestore();
      try {
        if (typeof firebase.storage === 'function') {
          storage = firebase.storage();
          if (typeof storage.setMaxUploadRetryTime === 'function') storage.setMaxUploadRetryTime(20000);
          if (typeof storage.setMaxOperationRetryTime === 'function') storage.setMaxOperationRetryTime(20000);
        }
      } catch (stErr) {
        console.warn("Storage init warning:", stErr);
      }
      // No anonymous sign-in: it used to replace the admin's login on every page load.
      // Writes are protected by Firestore rules that require the admin's Firebase account.
      backendMode = 'firebase';
      console.log("Connected to Firebase Firestore Cloud Backend (Configured in Code)");
      return backendMode;
    } catch (e) {
      console.error("Firebase startup check failed:", e);
    }
  }

  // 2. Local Express API Server
  try {
    const base = window.location.hostname === 'localhost' && window.location.port !== '8080' ? 'http://localhost:8080' : '';
    const res = await fetch(`${base}/api/projects`, { method: 'GET' });
    if (res.ok && (res.headers.get('content-type') || '').includes('json')) {
      backendMode = 'local-api';
      apiBaseUrl = base;
      console.log("Connected to Local Node.js Express API Server at", apiBaseUrl || 'Relative Path');
      return backendMode;
    }
  } catch (err) {
    // Node server is offline or unreachable
  }

  console.log("Fallback to Browser LocalStorage Simulation");
  backendMode = 'local-storage';
  return backendMode;
}

// Perform startup check
detectBackend();

// Real round trip to the cloud database. The SDK otherwise "succeeds" offline, so a missing
// database looked like it was working. Returns { ok, reason }.
async function checkCloudHealth(timeoutMs = 8000) {
  await detectBackend();
  if (backendMode !== 'firebase' || !db) return { ok: true, mode: backendMode };
  try {
    const probe = db.collection('settings').doc('categories').get({ source: 'server' });
    const timeout = new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'unavailable' })), timeoutMs));
    await Promise.race([probe, timeout]);
    return { ok: true, mode: backendMode };
  } catch (err) {
    let reason = 'The cloud database could not be reached, so saves and uploads will not work.';
    if (err && err.code === 'unavailable') reason = 'The cloud database is not reachable. Usually this means the Firestore database has not been created in the Firebase console yet (or the internet is down). Saves and uploads will NOT work until it is.';
    if (err && err.code === 'permission-denied') reason = 'The cloud database is refusing access. Check the Firestore security rules.';
    return { ok: false, reason, code: err && err.code };
  }
}


// Firestore write helper. It used to give up after 1.5s and report success anyway, which meant
// slow or rejected writes were silently lost. Now it waits properly and THROWS on failure so the
// admin sees a real error instead of a fake "saved".
async function safeFirestoreSet(docRef, data, options = {}, timeoutMs = 20000) {
  if (!docRef || typeof docRef.set !== 'function') throw new Error('Database not ready');
  const firestorePromise = (options && Object.keys(options).length > 0)
    ? docRef.set(data, options)
    : docRef.set(data);
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Saving to the cloud database timed out. Either you are offline or the Firestore database has not been created in the Firebase console.')), timeoutMs);
  });
  try {
    await Promise.race([firestorePromise, timeoutPromise]);
  } catch (err) {
    console.warn("Firestore set failed:", err);
    if (err && err.code === 'permission-denied') {
      throw new Error('The cloud database rejected this save. Log out and log back in with the admin email account (Firebase sign-in), then try again.');
    }
    if (err && err.code === 'unavailable') {
      throw new Error('The cloud database is not reachable. Check that the Firestore database exists in the Firebase console and that you are online.');
    }
    if (err && err.code === 'invalid-argument' && /bytes|size/i.test(err.message || '')) {
      throw new Error('This record is too large for the database. Use fewer or smaller images.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  return true;
}

// Escapes text before it goes into innerHTML (stops visitors injecting HTML/scripts via forms)
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// High-efficiency client-side image compressor & optimizer
async function compressAndOptimizeImage(file, maxDimension = 1600, quality = 0.85) {
  if (!file) throw new Error("No file provided");
  if (typeof FileReader === 'undefined') return { dataUrl: '', blob: file, name: file.name };
  if (!file.type || !file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ dataUrl: e.target.result, blob: file, name: file.name });
      reader.onerror = () => resolve({ dataUrl: '', blob: file, name: file.name });
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof Image === 'undefined' || typeof document === 'undefined') {
        return resolve({ dataUrl: event.target.result, blob: file, name: file.name });
      }
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ dataUrl: event.target.result, blob: file, name: file.name });
        }
        // PNG/WebP keep transparency, everything else becomes JPEG (much smaller)
        const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
        const outFormat = keepAlpha ? 'image/webp' : 'image/jpeg';
        if (!keepAlpha) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL(outFormat, quality);
        let finalFormat = outFormat;
        if (!dataUrl.startsWith(`data:${outFormat}`)) { // browser without WebP encoding (old Safari)
          dataUrl = canvas.toDataURL('image/png');
          finalFormat = 'image/png';
        }

        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            resolve({ dataUrl, blob: blob || file, name: file.name });
          }, finalFormat, quality);
        } else {
          resolve({ dataUrl, blob: file, name: file.name });
        }
      };
      img.onerror = () => {
        resolve({ dataUrl: event.target.result, blob: file, name: file.name });
      };
      img.src = event.target.result;
    };
    reader.onerror = () => resolve({ dataUrl: '', blob: file, name: file.name });
    reader.readAsDataURL(file);
  });
}

// Firestore documents are capped at ~1 MB, so an image saved inside the database must stay well under that
const FIRESTORE_MEDIA_MAX_CHARS = 900000;
let storageUnavailable = false; // set after the first Storage failure so later images skip straight to the fallback

// Shrinks an image until its base64 form fits inside one Firestore document
async function compressToFit(file, maxChars = FIRESTORE_MEDIA_MAX_CHARS) {
  const attempts = [[1600, 0.82], [1400, 0.75], [1200, 0.7], [1000, 0.65], [800, 0.6]];
  let last = null;
  for (const [dim, q] of attempts) {
    last = await compressAndOptimizeImage(file, dim, q);
    if (last.dataUrl && last.dataUrl.length <= maxChars) return last;
  }
  return last;
}

// Uploads one file to Firebase Storage. Fails fast if Storage stops making progress instead of
// racing a fixed 4s timer (which used to abandon perfectly healthy uploads on slower connections).
function uploadToStorage(blob, path, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const ref = storage.ref().child(path);
    const task = ref.put(blob, { contentType, cacheControl: 'public, max-age=31536000' });
    let lastBytes = -1;
    let lastChange = Date.now();
    const STALL_MS = 10000;
    const watchdog = setInterval(() => {
      if (Date.now() - lastChange > STALL_MS) {
        clearInterval(watchdog);
        try { task.cancel(); } catch (e) {}
        reject(new Error('Storage upload stalled'));
      }
    }, 1000);

    task.on('state_changed',
      (snap) => {
        if (snap.bytesTransferred !== lastBytes) {
          lastBytes = snap.bytesTransferred;
          lastChange = Date.now();
        }
        if (typeof onProgress === 'function' && snap.totalBytes > 0) {
          onProgress(snap.bytesTransferred / snap.totalBytes);
        }
      },
      (err) => { clearInterval(watchdog); reject(err); },
      async () => {
        clearInterval(watchdog);
        try { resolve(await task.snapshot.ref.getDownloadURL()); } catch (err) { reject(err); }
      }
    );
  });
}

// When Storage was never set up in Firebase, every photo used to sit at 25% for ~20s waiting for
// retries. One quick check tells us if the bucket exists; if it doesn't, photos go straight to the database.
let _bucketProbe = null;
function probeStorageBucket() {
  if (!_bucketProbe) {
    _bucketProbe = (async () => {
      try {
        const bucket = FIREBASE_CONFIG.storageBucket;
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const t = setTimeout(() => ctrl && ctrl.abort(), 5000);
        const res = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o?maxResults=1`, ctrl ? { signal: ctrl.signal } : {});
        clearTimeout(t);
        if (res.status === 404) {
          storageUnavailable = true;
          console.info('Firebase Storage bucket not set up. Photos are stored in Firestore instead.');
        }
      } catch (e) {
        // Network hiccup: leave Storage enabled, the stall watchdog still protects the upload
      }
    })();
  }
  return _bucketProbe;
}


// Original file as a data URL plus its pixel size (no re-encoding, no quality loss)
function readOriginal(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = (e) => {
      const dataUrl = e.target.result;
      if (typeof Image === 'undefined') return resolve({ dataUrl, w: 0, h: 0 });
      const im = new Image();
      im.onload = () => resolve({ dataUrl, w: im.naturalWidth, h: im.naturalHeight });
      im.onerror = () => resolve({ dataUrl, w: 0, h: 0 });
      im.src = dataUrl;
    };
    r.onerror = () => resolve({ dataUrl: '', w: 0, h: 0 });
    r.readAsDataURL(file);
  });
}

// High quality copy: the original untouched when it is up to 4K, otherwise resized to 3840px at near-lossless quality
async function highQualityImage(file) {
  const MAX = 3840;
  const orig = await readOriginal(file);
  const isWebFormat = /^image\/(jpeg|png|webp|gif|svg\+xml|avif)$/.test(file.type || '');
  if (isWebFormat && (!orig.w || Math.max(orig.w, orig.h) <= MAX)) {
    return { dataUrl: orig.dataUrl, blob: file, type: file.type };
  }
  const out = await compressAndOptimizeImage(file, MAX, 0.93);
  return { dataUrl: out.dataUrl, blob: out.blob || file, type: (out.blob && out.blob.type) || 'image/jpeg' };
}

// Large images are split over several database records (each record is limited to about 1 MB)
const MEDIA_CHUNK = 900000;
async function saveMediaChunked(id, dataUrl, meta) {
  if (dataUrl.length <= MEDIA_CHUNK) {
    await safeFirestoreSet(db.collection('media').doc(id), { url: dataUrl, ...meta });
    return;
  }
  const parts = [];
  for (let i = 0; i < dataUrl.length; i += MEDIA_CHUNK) parts.push(dataUrl.slice(i, i + MEDIA_CHUNK));
  if (parts.length > 40) throw new Error('This photo is too large (over 30 MB). Please use a smaller file.');
  await Promise.all(parts.map((part, i) => safeFirestoreSet(db.collection('media').doc(`${id}__${i}`), { part, parent: id, i }, {}, 60000)));
  await safeFirestoreSet(db.collection('media').doc(id), { chunks: parts.length, ...meta });
}

// Media references that point at an image stored as a Firestore document look like "media:<docId>"
const MEDIA_REF_PREFIX = 'media:';
const _mediaCache = new Map();

async function resolveMediaRef(ref) {
  if (!ref || typeof ref !== 'string') return '';
  if (!ref.startsWith(MEDIA_REF_PREFIX)) return ref;
  const id = ref.slice(MEDIA_REF_PREFIX.length);
  if (_mediaCache.has(id)) return _mediaCache.get(id);
  const p = (async () => {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        const doc = await db.collection('media').doc(id).get();
        if (doc.exists) {
          const d = doc.data();
          if (d.chunks) {
            const parts = await Promise.all(Array.from({ length: d.chunks }, (_, i) => db.collection('media').doc(`${id}__${i}`).get()));
            return parts.map(p => (p.exists ? p.data().part : '')).join('');
          }
          return d.url || '';
        }
      } catch (err) {
        console.warn('Media lookup failed:', id, err);
      }
    }
    return '';
  })();
  _mediaCache.set(id, p);
  return p;
}

// Universal upload. Returns a URL (Storage / local server), a "media:<id>" reference
// (Firestore fallback, when opts.allowMediaRef is true) or a data URL (legacy single-image fields).
async function uploadImageToFirebase(file, folder = 'uploads', onProgress, opts = {}) {
  if (!file) throw new Error("No file selected.");
  if (file.type && !file.type.startsWith('image/')) throw new Error(`"${file.name}" is not an image file.`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`"${file.name}" is larger than 25 MB.`);
  await detectBackend();
  const report = (pct) => { if (typeof onProgress === 'function') onProgress(Math.max(0, Math.min(100, pct))); };

  report(5);
  // Photos that can be stored as media references (projects, About page, Site Images) keep full quality.
  // Other single-image fields keep the older optimised path.
  const optimized = opts.allowMediaRef ? await highQualityImage(file) : await compressAndOptimizeImage(file, 1920, 0.85);
  report(25);

  const baseName = (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 60) || 'image';
  const blobType = (optimized.blob && optimized.blob.type) || file.type || 'image/jpeg';
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' })[blobType] || 'jpg';
  const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `${folder}/${uid}_${baseName}.${ext}`;

  // 1. Firebase Cloud Storage (best option: real files, any size)
  if (backendMode === 'firebase' && storage && !storageUnavailable) await probeStorageBucket();
  if (backendMode === 'firebase' && storage && !storageUnavailable) {
    try {
      const url = await uploadToStorage(optimized.blob || file, path, blobType, (f) => report(25 + f * 73));
      report(100);
      return url;
    } catch (storageErr) {
      console.warn("Firebase Storage unavailable, falling back to Firestore media:", storageErr);
      storageUnavailable = true;
    }
  }

  // 2a. Firestore, full quality: the image is stored as its own record, split into parts when large
  if (backendMode === 'firebase' && db && opts.allowMediaRef) {
    report(50);
    const mediaId = uid;
    await saveMediaChunked(mediaId, optimized.dataUrl, {
      name: file.name || baseName,
      folder,
      projectId: opts.projectId || null,
      contentType: optimized.type || file.type || 'image/jpeg',
      createdAt: new Date().toISOString()
    });
    _mediaCache.set(mediaId, Promise.resolve(optimized.dataUrl));
    report(100);
    return MEDIA_REF_PREFIX + mediaId;
  }

  // 2. Firestore fallback: image stored as its own document (never inside the project record)
  if (backendMode === 'firebase' && db) {
    report(60);
    const fitted = await compressToFit(file);
    if (!fitted || !fitted.dataUrl || fitted.dataUrl.length > FIRESTORE_MEDIA_MAX_CHARS) {
      throw new Error(`"${file.name}" is too large to store. Try a smaller image.`);
    }
    if (!opts.allowMediaRef) {
      // Single-image fields (products, insights, site images) keep the old behaviour: inline data URL
      report(100);
      return fitted.dataUrl;
    }
    const mediaId = uid;
    await safeFirestoreSet(db.collection('media').doc(mediaId), {
      url: fitted.dataUrl,
      name: file.name || baseName,
      folder,
      projectId: opts.projectId || null,
      contentType: (fitted.blob && fitted.blob.type) || 'image/jpeg',
      createdAt: new Date().toISOString()
    });
    _mediaCache.set(mediaId, Promise.resolve(fitted.dataUrl));
    report(100);
    return MEDIA_REF_PREFIX + mediaId;
  }

  // 3. Local Express API server
  if (backendMode === 'local-api') {
    const res = await fetch(`${apiBaseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${baseName}.${ext}`, data: optimized.dataUrl, folder })
    });
    if (!res.ok) throw new Error(`Upload failed (server responded ${res.status})`);
    const json = await res.json();
    report(100);
    return json.absolute || /^https?:/.test(json.url) ? json.url : `${apiBaseUrl}${json.url}`;
  }

  // 4. Offline browser simulation: small data URL
  const small = await compressAndOptimizeImage(file, 1000, 0.7);
  report(100);
  return small.dataUrl;
}

// Best-effort clean-up of an uploaded image that is no longer used
async function deleteUploadedMedia(ref) {
  if (!ref || typeof ref !== 'string') return;
  await detectBackend();
  try {
    if (ref.startsWith(MEDIA_REF_PREFIX) && db) {
      const mid = ref.slice(MEDIA_REF_PREFIX.length);
      try {
        const d = await db.collection('media').doc(mid).get();
        const n = d.exists ? (d.data().chunks || 0) : 0;
        await Promise.all(Array.from({ length: n }, (_, i) => db.collection('media').doc(`${mid}__${i}`).delete()));
      } catch (e) {}
      await db.collection('media').doc(mid).delete();
      _mediaCache.delete(ref.slice(MEDIA_REF_PREFIX.length));
    } else if (storage && /firebasestorage\.googleapis\.com|\.firebasestorage\.app/.test(ref) && ref.includes('/projects%2F')) {
      await storage.refFromURL(ref).delete();
    } else if (backendMode === 'local-api' && ref.includes('/uploads/projects/')) {
      await fetch(`${apiBaseUrl}/api/upload`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ref })
      });
    }
  } catch (err) {
    console.warn('Could not delete old media (safe to ignore):', err);
  }
}

// Old default images (Unsplash links / SVG placeholders) are swapped for the bundled photos.
// Only touches the built-in demo paths, never something the admin uploaded.
function isStaleDefaultImage(url) {
  return typeof url === 'string' && (url.includes('images.unsplash.com') || (/^assets\/images\/.+\.svg$/.test(url) && !url.endsWith('placeholder.svg')));
}

// Gives every project a consistent shape: images[] (raw refs, cover first) and image (cover)
function normalizeProject(p) {
  if (!p) return p;
  const def = DEFAULT_PROJECTS.find(d => d.id === p.id);
  let images = Array.isArray(p.images) && p.images.length ? p.images.slice() : (p.image ? [p.image] : []);
  images = images.filter(Boolean).map(u => (isStaleDefaultImage(u) && def ? def.image : u));
  images = images.filter((u, i) => images.indexOf(u) === i);
  return {
    ...p,
    specs: p.specs || {},
    images,
    image: images[0] || 'assets/images/placeholder.svg'
  };
}

// Adds display-ready URLs (media refs resolved): gallery[] and coverUrl
async function withResolvedImages(p, coverOnly = false) {
  if (!p) return p;
  const list = coverOnly ? p.images.slice(0, 1) : p.images;
  const resolved = await Promise.all(list.map(resolveMediaRef));
  const gallery = resolved.filter(Boolean);
  return { ...p, gallery, coverUrl: gallery[0] || 'assets/images/placeholder.svg', photoCount: p.images.length };
}


// Small preview image (about 30 KB) saved inside each project, so listings never have to download
// the full-size photos (up to ~900 KB each when they live in the database).
async function makeThumbnail(src, maxW = 640, quality = 0.72) {
  if (!src || typeof document === 'undefined' || typeof Image === 'undefined') return '';
  return new Promise((resolve) => {
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        let out = c.toDataURL('image/webp', quality);
        if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', quality);
        resolve(out.length < 120000 ? out : '');
      } catch (e) { resolve(''); }
    };
    img.onerror = () => resolve('');
    img.src = src;
  });
}

// Remembers the last project list in this browser so pages show it instantly next time,
// then quietly refresh from the database.
const PROJECTS_CACHE_KEY = 'dw_projects_cache_v1';
function readProjectsCache() {
  try { const c = JSON.parse(localStorage.getItem(PROJECTS_CACHE_KEY)); return c && Array.isArray(c.list) ? c.list : null; } catch (e) { return null; }
}
function writeProjectsCache(list) {
  try { localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify({ ts: Date.now(), list })); } catch (e) {}
}

class ProjectsDataStore {
  constructor() {
    this.localKey = 'dw_projects';
    this.catKey = 'dw_categories';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    let localData = null;
    try { localData = localStorage.getItem(this.localKey); } catch (e) {}
    let needsReset = !localData;

    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (!Array.isArray(parsed)) needsReset = true;
      } catch(e) {
        needsReset = true;
      }
    }

    if (needsReset) {
      this._writeLocal(DEFAULT_PROJECTS);
      try { localStorage.setItem(this.catKey, JSON.stringify(DEFAULT_CATEGORIES)); } catch (e) {}
    }
  }

  _readLocal() {
    try {
      const list = JSON.parse(localStorage.getItem(this.localKey));
      return Array.isArray(list) ? list : DEFAULT_PROJECTS.slice();
    } catch (e) {
      return DEFAULT_PROJECTS.slice();
    }
  }

  _writeLocal(list) {
    try {
      localStorage.setItem(this.localKey, JSON.stringify(list));
    } catch (e) {
      throw new Error('Browser storage is full. Remove some images or connect the cloud backend.');
    }
  }

  getMode() {
    return backendMode;
  }

  // Raw records (images are stored references, not resolved)
  async _getAllRaw() {
    await detectBackend();

    if (backendMode === 'firebase' && db) {
      // The client's real projects live here. Never fall back to the old demo projects:
      // an empty database shows nothing, and a failed read throws so the page keeps its placeholders.
      const snap = await db.collection('projects').get();
      const list = [];
      snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
      return list;
    }

    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/projects`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }

    return this._readLocal();
  }

  _sort(list) {
    // Admin-defined order first (sortOrder), then newest year, then title
    return list.sort((a, b) => {
      const ao = typeof a.sortOrder === 'number' ? a.sortOrder : 9999;
      const bo = typeof b.sortOrder === 'number' ? b.sortOrder : 9999;
      if (ao !== bo) return ao - bo;
      const ay = parseInt(a.year, 10) || 0, by = parseInt(b.year, 10) || 0;
      if (ay !== by) return by - ay;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }

  // Projects with cover image resolved (for listings)
  async getAll() {
    const list = this._sort((await this._getAllRaw()).map(normalizeProject));
    const resolved = await Promise.all(list.map(async p => {
      // Saved thumbnail first: no extra download. Full cover is only fetched for older projects.
      if (p.thumb) return { ...p, gallery: [], coverUrl: p.thumb, photoCount: p.images.length };
      return withResolvedImages(p, true);
    }));
    const out = resolved.map(p => ({ ...p, image: p.coverUrl }));
    if (backendMode === 'firebase') writeProjectsCache(out.map(p => ({ id: p.id, title: p.title, category: p.category, shortDesc: p.shortDesc, location: p.location, client: p.client, image: (p.image || '').length < 150000 ? p.image : '', isWide: p.isWide, photoCount: p.photoCount, sortOrder: p.sortOrder, year: p.year })));
    return out;
  }

  // Cached list right away (or null), then calls onFresh with the live list
  getAllFast(onFresh) {
    const cached = readProjectsCache();
    this.getAll().then(list => onFresh && onFresh(list)).catch(() => {});
    return cached;
  }

  // Admin only: give older projects a thumbnail so listings load fast (runs quietly in the background)
  async backfillThumbnails() {
    if (backendMode !== 'firebase' || !db) return 0;
    let n = 0;
    for (const raw of await this._getAllRaw()) {
      const p = normalizeProject(raw);
      if (p.thumb || !p.images.length) continue;
      const src = await resolveMediaRef(p.images[0]);
      if (!src || !src.startsWith('data:')) continue; // web URLs load fast already
      const thumb = await makeThumbnail(src);
      if (!thumb) continue;
      try { await db.collection('projects').doc(String(p.id)).set({ thumb }, { merge: true }); n++; } catch (e) { break; }
    }
    return n;
  }

  // One project with every gallery image resolved. `image` stays the display cover,
  // `images` stays the raw stored references (used by the admin when saving).
  async getById(id) {
    await detectBackend();
    let raw = null;

    if (backendMode === 'firebase' && db) {
      try {
        const doc = await db.collection('projects').doc(id).get();
        if (doc.exists) raw = { ...doc.data(), id: doc.id };
      } catch (err) {
        console.error("Firestore getById error:", err);
      }
    }

    if (!raw) {
      let list = [];
      try { list = await this._getAllRaw(); } catch (e) {}
      raw = list.find(p => String(p.id) === String(id)) || null;
    }
    if (!raw) return null;

    const p = await withResolvedImages(normalizeProject(raw));
    return { ...p, image: p.coverUrl };
  }

  async save(project) {
    await detectBackend();
    const clean = normalizeProject(project);
    delete clean.gallery;
    delete clean.coverUrl;
    delete clean.photoCount;
    delete clean.thumb;
    clean.updatedAt = new Date().toISOString();
    // Thumbnail of the cover photo for fast listings (only needed when the photo lives in the database)
    if (clean.images[0] && (clean.images[0].startsWith(MEDIA_REF_PREFIX) || clean.images[0].startsWith('data:'))) {
      try { const t = await makeThumbnail(await resolveMediaRef(clean.images[0])); if (t) clean.thumb = t; } catch (e) {}
    }

    if (backendMode === 'firebase' && db) {
      // Throws on failure so the admin sees the real error (no silent fallback to this browser only)
      await safeFirestoreSet(db.collection('projects').doc(String(clean.id)), clean);
      return true;
    }

    if (backendMode === 'local-api') {
      const res = await fetch(`${apiBaseUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean)
      });
      if (!res.ok) throw new Error(`Server refused the save (${res.status})`);
      return true;
    }

    const projects = this._readLocal();
    const index = projects.findIndex(p => String(p.id) === String(clean.id));
    if (index > -1) projects[index] = clean; else projects.push(clean);
    this._writeLocal(projects);
    return true;
  }

  async delete(id) {
    await detectBackend();
    let images = [];
    try {
      const existing = (await this._getAllRaw()).find(p => String(p.id) === String(id));
      if (existing) images = normalizeProject(existing).images;
    } catch (e) {}

    if (backendMode === 'firebase' && db) {
      await db.collection('projects').doc(String(id)).delete();
    } else if (backendMode === 'local-api') {
      const res = await fetch(`${apiBaseUrl}/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server refused the delete (${res.status})`);
    } else {
      this._writeLocal(this._readLocal().filter(p => String(p.id) !== String(id)));
    }

    // Remove that project's uploaded photos too (bundled default images are never touched)
    await Promise.all(images.map(deleteUploadedMedia));
    return true;
  }

  async reset() {
    await detectBackend();

    if (backendMode === 'firebase' && db) {
      const snap = await db.collection('projects').get();
      const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      DEFAULT_PROJECTS.forEach(p => batch.set(db.collection('projects').doc(p.id), p));
      batch.set(db.collection('settings').doc('categories'), { list: DEFAULT_CATEGORIES });
      await batch.commit();
      return true;
    }

    if (backendMode === 'local-api') {
      const res = await fetch(`${apiBaseUrl}/api/projects/reset`, { method: 'POST' });
      if (!res.ok) throw new Error(`Server refused the reset (${res.status})`);
      return true;
    }

    this._writeLocal(DEFAULT_PROJECTS);
    localStorage.setItem(this.catKey, JSON.stringify(DEFAULT_CATEGORIES));
    return true;
  }

  // Categories Operations
  async getCategories() {
    await detectBackend();

    if (backendMode === 'firebase' && db) {
      try {
        const doc = await db.collection('settings').doc('categories').get();
        if (doc.exists && Array.isArray(doc.data().list)) return doc.data().list;
      } catch (err) {
        console.error("Firestore categories read error:", err);
      }
      return DEFAULT_CATEGORIES.slice();
    }

    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/categories`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API categories read error:", err);
      }
    }

    try {
      return JSON.parse(localStorage.getItem(this.catKey)) || DEFAULT_CATEGORIES.slice();
    } catch (e) {
      return DEFAULT_CATEGORIES.slice();
    }
  }

  async saveCategory(category) {
    category = String(category || '').trim();
    if (!category) return false;
    const list = await this.getCategories();
    if (list.some(c => c.toLowerCase() === category.toLowerCase())) return false; // no duplicates like "Retail" + "retail"
    list.push(category);

    if (backendMode === 'firebase' && db) {
      await safeFirestoreSet(db.collection('settings').doc('categories'), { list });
      return true;
    }

    if (backendMode === 'local-api') {
      const res = await fetch(`${apiBaseUrl}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      if (!res.ok) throw new Error(`Server refused the save (${res.status})`);
      return true;
    }

    localStorage.setItem(this.catKey, JSON.stringify(list));
    return true;
  }

  async deleteCategory(category) {
    let list = await this.getCategories();
    list = list.filter(c => c !== category);

    if (backendMode === 'firebase' && db) {
      await safeFirestoreSet(db.collection('settings').doc('categories'), { list });
      return true;
    }

    if (backendMode === 'local-api') {
      const res = await fetch(`${apiBaseUrl}/api/categories/${encodeURIComponent(category)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server refused the delete (${res.status})`);
      return true;
    }

    localStorage.setItem(this.catKey, JSON.stringify(list));
    return true;
  }

  // Upload one project photo into that project's own folder: projects/<projectId>/...
  async uploadImage(file, onProgress, projectId) {
    const folder = projectId ? `projects/${String(projectId).replace(/[^a-zA-Z0-9_-]/g, '_')}` : 'projects/unassigned';
    return await uploadImageToFirebase(file, folder, onProgress, { allowMediaRef: true, projectId: projectId || null });
  }

  // Upload many photos at once (3 in parallel). onItem(index, {status, pct, url, error}) reports each file.
  async uploadImages(files, projectId, onItem) {
    const list = Array.from(files || []);
    const results = new Array(list.length);
    let next = 0;
    const worker = async () => {
      while (next < list.length) {
        const i = next++;
        try {
          const url = await this.uploadImage(list[i], (pct) => onItem && onItem(i, { status: 'uploading', pct }), projectId);
          results[i] = { ok: true, url };
          onItem && onItem(i, { status: 'done', pct: 100, url });
        } catch (err) {
          results[i] = { ok: false, error: err.message || String(err) };
          onItem && onItem(i, { status: 'error', error: err.message || String(err) });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, list.length) }, worker));
    return results;
  }
}

const ProjectsStore = new ProjectsDataStore();

// Case Studies Store
const DEFAULT_CASE_STUDIES = [
  {
    id: "1",
    title: "DXB Terminal FIDS Deploy",
    challenge: "Dubai Airports needed a high-reliability visual flight schedule wall array with zero potential black-screen errors to replace an aging system.",
    solution: "We deployed a 3x3 LCD video wall array using 0.88mm bezel screens. To guarantee 24/7 uptime, we implemented dual redundant controller lines (NovaStar Hubs) and integrated our Fault Information Platform (FIP) diagnostics.",
    result: "Over 18 months of continuous runtime completed with 100% schedule consistency and automated local alerts.",
    logs: "[OK] Redundant receiver ping ... 0.4ms\n[OK] Primary controller signal active\n[OK] Temperature sensor ... 34°C (Normal)\n[INFO] Scheduling database loop sync complete"
  }
];

class CaseStudiesDataStore {
  constructor() {
    this.localKey = 'dw_casestudies';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    const localData = localStorage.getItem(this.localKey);
    if (!localData) {
      localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_CASE_STUDIES));
    }
  }

  async getAll() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('casestudies').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
          return list;
        }
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/casestudies`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    return JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_CASE_STUDIES;
  }

  async save(cs) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await safeFirestoreSet(db.collection('casestudies').doc(cs.id), cs);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/casestudies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cs)
        });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API save error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_CASE_STUDIES;
    const index = list.findIndex(item => item.id === cs.id);
    if (index > -1) {
      list[index] = cs;
    } else {
      list.push(cs);
    }
    localStorage.setItem(this.localKey, JSON.stringify(list));
    return true;
  }

  async delete(id) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('casestudies').doc(id).delete();
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/casestudies/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API delete error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_CASE_STUDIES;
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(this.localKey, JSON.stringify(filtered));
    return true;
  }

  async reset() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('casestudies').get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        for (let cs of DEFAULT_CASE_STUDIES) {
          await db.collection('casestudies').doc(cs.id).set(cs);
        }
        return true;
      } catch (err) {
        console.error("Firestore reset error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/casestudies/reset`, { method: 'POST' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API reset error:", err);
      }
    }
    
    localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_CASE_STUDIES));
    return true;
  }
}

const CaseStudiesStore = new CaseStudiesDataStore();

// Products Store
const DEFAULT_PRODUCTS = [
  {
    id: "prod_1",
    name: "Fine-Pitch Indoor LEDs",
    category: "led",
    categoryLabel: "LED Screens",
    desc: "High-definition screens with pixel pitches down to 0.7mm for executive boardrooms, broadcast studios, and luxury brand showrooms.",
    image: "assets/images/product-microled.jpg",
    specs: {
      "Pixel Pitch Options": "0.7mm / 0.9mm / 1.2mm / 1.5mm",
      "Calibrated Brightness": "800 nits (Adjustable HDR)",
      "Refresh Rate": "3840 Hz (Fine-Grade)",
      "Contrast Ratio": "5000:1 High-Contrast",
      "Average Power Draw": "180 W / sqm",
      "Maintenance Profile": "Front-service magnetic modules"
    }
  },
  {
    id: "prod_2",
    name: "High-Brightness Outdoor LEDs",
    category: "led",
    categoryLabel: "LED Screens",
    desc: "IP65 weather-resistant, gold-wire LED displays designed to maintain full visual contrast under direct desert sun.",
    image: "assets/images/product-billboard.jpg",
    specs: {
      "Pixel Pitch Options": "3.0mm / 4.0mm / 5.0mm",
      "Calibrated Brightness": "6500 nits (Auto-dimming)",
      "Refresh Rate": "3840 Hz",
      "Weatherproof Rating": "IP65 Front & Rear Sealed",
      "Average Power Draw": "280 W / sqm",
      "Cooling Design": "Double-chamber active ventilation"
    }
  },
  {
    id: "prod_3",
    name: "Storefront Double-Sided LCDs",
    category: "lcd",
    categoryLabel: "LCD Panels",
    desc: "Ultra-slim storefront screen displaying 3500 nits outside to fight sunlight glare, and 1000 nits inside for retail shoppers.",
    image: "assets/images/product-lcd.jpg",
    specs: {
      "Display Size Options": "49\" / 55\" / 65\" diagonal",
      "Calibrated Brightness": "Outward: 3500 nits | Inward: 1000 nits",
      "Chassis Profile": "Ultra-slim 49mm chassis",
      "Native Resolution": "4K UHD (3840 x 2160)",
      "Uptime Rating": "24/7 mission-critical duty cycle",
      "Operating Temperature": "Safe up to 50°C internal load"
    }
  },
  {
    id: "prod_4",
    name: "Modular LCD Video Walls",
    category: "lcd",
    categoryLabel: "LCD Panels",
    desc: "Extreme narrow-bezel modular screen panels engineered for operations hubs and security command matrices.",
    image: "assets/images/product-curved.jpg",
    specs: {
      "Bezel Gap Width": "0.88mm Active-to-Active",
      "Display Size": "55\" modular tiles",
      "Calibrated Brightness": "500 - 700 nits options",
      "Daisy-chain Feed": "DisplayPort 1.2 (4K loop)",
      "Backlight Uniformity": "95% direct-lit local dimming",
      "Failover Routing": "Dual inputs with active auto-switch"
    }
  },
  {
    id: "prod_5",
    name: "Transparent LED Glass Film",
    category: "transparent",
    categoryLabel: "Transparent Film",
    desc: "High transparency self-adhesive film that wet-applies directly onto retail shopfront windows to turn glass into screens.",
    image: "assets/images/product-toled.jpg",
    specs: {
      "Glass Transparency": "85% optical transparency",
      "Adhesive Profile": "Self-adhesive 2mm film layer",
      "Calibrated Brightness": "3000 nits",
      "Pixel Pitch Options": "3.9mm / 7.8mm mesh",
      "Cut-to-Fit": "Modular sections trimmed on-site",
      "Flexibility Limit": "Curved glass safe down to 1.1m radius"
    }
  },
  {
    id: "prod_6",
    name: "Interactive Wayfinding Kiosks",
    category: "interactive",
    categoryLabel: "Interactive Totems",
    desc: "PCAP touch interactive directories built with powder-coated steel frames for malls, hospitals, and transit lobbies.",
    image: "assets/images/product-kiosk.jpg",
    specs: {
      "Touch Technology": "Projected Capacitive (10 simultaneous points)",
      "Display Size Options": "43\" / 49\" / 55\"",
      "Enclosure Finish": "Anodized steel, anti-shatter glass",
      "Integrated Engine": "Android 11 / Windows IoT micro-board",
      "Input Latency": "Under 5ms input lag",
      "Accessibility": "ADA-compliant digital directory layout"
    }
  },
  {
    id: "prod_7",
    name: "Architectural 3D & Illuminated Channel Letters",
    category: "static",
    categoryLabel: "Static Signage",
    desc: "Marine-grade stainless steel, acrylic face-lit and halo-backlit dimensional letters for flagship facades and retail storefronts.",
    image: "assets/images/product-static.jpg",
    specs: {
      "Material Grades": "316 Marine Stainless Steel / Architectural Acrylic / Brass",
      "Illumination Profile": "IP68 Warm/Cool White LED Halo & Face-Lit",
      "Finish Options": "Mirror Polish, Brushed, Powder-Coated, PVD Titanium",
      "Power Feed": "Sealed 12V/24V IP67 MeanWell Driver Modules",
      "Weather Resistance": "UV-Stabilized Acrylic & Heat-Resistant Sealants",
      "Structural Rating": "Certified Dubai Municipality Wind-Load Compliant"
    }
  },
  {
    id: "prod_8",
    name: "Wayfinding Monoliths & Corporate Pylons",
    category: "static",
    categoryLabel: "Static Signage",
    desc: "Freestanding monument structures, directory totems, and campus directional signage with modular directory panels.",
    image: "assets/images/project-signage.jpg",
    specs: {
      "Structure Framework": "Heavy-duty hot-dip galvanized steel internal armature",
      "Cladding Material": "Solid Aluminum Sheet / ACM / Architectural Glass",
      "Dimensions": "Custom engineered up to 10m height monoliths",
      "Directory Systems": "Modular interchangeable aluminum slats or magnetic acrylic",
      "Lighting Elements": "Integrated edge-lit light guides or internal LED matrices",
      "Foundation Engineering": "Cast-in-place rebar anchor cage calculation specs"
    }
  }
];

class ProductsDataStore {
  constructor() {
    this.localKey = 'dw_products';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    const localData = localStorage.getItem(this.localKey);
    let needsReset = !localData;
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (!Array.isArray(parsed) || parsed.some(p => typeof p.image === 'string' && (p.image.includes('unsplash') || p.image.endsWith('.svg')))) {
          needsReset = true;
        }
      } catch (e) {
        needsReset = true;
      }
    }
    if (needsReset) {
      localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_PRODUCTS));
    }
  }

  async getAll() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('products').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => {
            const data = { ...doc.data(), id: doc.id };
            if (data.image && typeof data.image === 'string' && (data.image.includes('unsplash') || data.image.endsWith('.svg'))) {
              const def = DEFAULT_PRODUCTS.find(d => d.id === doc.id);
              if (def) data.image = def.image;
            }
            list.push(data);
          });
          return list;
        }
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/products`);
        if (res.ok) {
          const list = await res.json();
          return list.map(item => {
            if (item.image && typeof item.image === 'string' && (item.image.includes('unsplash') || item.image.endsWith('.svg'))) {
              const def = DEFAULT_PRODUCTS.find(d => d.id === item.id);
              if (def) item.image = def.image;
            }
            return item;
          });
        }
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    const localList = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_PRODUCTS;
    return localList.map(item => {
      if (item.image && typeof item.image === 'string' && (item.image.includes('unsplash') || item.image.endsWith('.svg'))) {
        const def = DEFAULT_PRODUCTS.find(d => d.id === item.id);
        if (def) item.image = def.image;
      }
      return item;
    });
  }

  async save(prod) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await safeFirestoreSet(db.collection('products').doc(prod.id), prod);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prod)
        });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API save error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_PRODUCTS;
    const index = list.findIndex(item => item.id === prod.id);
    if (index > -1) {
      list[index] = prod;
    } else {
      list.push(prod);
    }
    localStorage.setItem(this.localKey, JSON.stringify(list));
    return true;
  }

  async delete(id) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('products').doc(id).delete();
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API delete error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_PRODUCTS;
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(this.localKey, JSON.stringify(filtered));
    return true;
  }

  async reset() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('products').get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        for (let p of DEFAULT_PRODUCTS) {
          await db.collection('products').doc(p.id).set(p);
        }
        return true;
      } catch (err) {
        console.error("Firestore reset error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/products/reset`, { method: 'POST' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API reset error:", err);
      }
    }
    
    localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_PRODUCTS));
    return true;
  }
}

const ProductsStore = new ProductsDataStore();

// Services Store
const DEFAULT_SERVICES = [
  {
    id: "svc_1",
    num: "01",
    iconType: "lcd",
    title: "LCD Video Walls",
    desc: "Ultra-narrow 0.88mm bezel screens for control command centers, lobbies, and 24/7 aviation displays with anti-glare coatings.",
    image: "assets/images/product-lcd.jpg"
  },
  {
    id: "svc_2",
    num: "02",
    iconType: "led",
    title: "LED Screens & Mesh",
    desc: "Fine pixel pitch indoor/outdoor LED screens, transparent glass facade meshes, IP65-rated structural weatherproofing.",
    image: "assets/images/product-microled.jpg"
  },
  {
    id: "svc_3",
    num: "03",
    iconType: "kiosk",
    title: "Interactive Kiosks",
    desc: "Multi-touch wayfinding pedestals, self-service information terminals, custom steel enclosures, and rugged branding.",
    image: "assets/images/product-kiosk.jpg"
  },
  {
    id: "svc_4",
    num: "04",
    iconType: "cms",
    title: "CMS Software",
    desc: "Cloud-based content management system for multi-zone playlists, live content scheduling, and remote player health diagnostic feeds.",
    image: "assets/images/insight-tech.jpg"
  },
  {
    id: "svc_5",
    num: "05",
    iconType: "lighting",
    title: "Facade Linear Lighting",
    desc: "DMX-controlled architectural dynamic RGB linear strips to outline structural facade contours and exterior accent colors.",
    image: "assets/images/product-billboard.jpg"
  },
  {
    id: "svc_6",
    num: "06",
    iconType: "consultancy",
    title: "AV Consultancy & FIP",
    desc: "Professional engineering consulting, hardware integration layout plans, and our custom zero-downtime Fault Information Platform (FIP).",
    image: "assets/images/insight-thermal.jpg"
  },
  {
    id: "svc_7",
    num: "07",
    iconType: "signage",
    title: "Static & Architectural Signage",
    desc: "Bespoke 3D illuminated channel letters, monumental pylons, dimensional metal branding, and campus wayfinding fabrication.",
    image: "assets/images/product-static.jpg"
  }
];

class ServicesDataStore {
  constructor() {
    this.localKey = 'dw_services';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    const localData = localStorage.getItem(this.localKey);
    let needsReset = !localData;
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (!Array.isArray(parsed) || parsed.some(s => typeof s.image === 'string' && (s.image.includes('unsplash') || s.image.endsWith('.svg')))) {
          needsReset = true;
        }
      } catch (e) {
        needsReset = true;
      }
    }
    if (needsReset) {
      localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_SERVICES));
    }
  }

  async getAll() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('services').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => {
            const data = { ...doc.data(), id: doc.id };
            if (data.image && typeof data.image === 'string' && (data.image.includes('unsplash') || data.image.endsWith('.svg'))) {
              const def = DEFAULT_SERVICES.find(d => d.id === doc.id);
              if (def) data.image = def.image;
            }
            list.push(data);
          });
          return list;
        }
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/services`);
        if (res.ok) {
          const list = await res.json();
          return list.map(item => {
            if (item.image && typeof item.image === 'string' && (item.image.includes('unsplash') || item.image.endsWith('.svg'))) {
              const def = DEFAULT_SERVICES.find(d => d.id === item.id);
              if (def) item.image = def.image;
            }
            return item;
          });
        }
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    const localList = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_SERVICES;
    return localList.map(item => {
      if (item.image && typeof item.image === 'string' && (item.image.includes('unsplash') || item.image.endsWith('.svg'))) {
        const def = DEFAULT_SERVICES.find(d => d.id === item.id);
        if (def) item.image = def.image;
      }
      return item;
    });
  }

  async save(svc) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await safeFirestoreSet(db.collection('services').doc(svc.id), svc);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(svc)
        });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API save error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_SERVICES;
    const index = list.findIndex(item => item.id === svc.id);
    if (index > -1) {
      list[index] = svc;
    } else {
      list.push(svc);
    }
    localStorage.setItem(this.localKey, JSON.stringify(list));
    return true;
  }

  async delete(id) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('services').doc(id).delete();
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/services/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API delete error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_SERVICES;
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(this.localKey, JSON.stringify(filtered));
    return true;
  }

  async reset() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('services').get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        for (let s of DEFAULT_SERVICES) {
          await db.collection('services').doc(s.id).set(s);
        }
        return true;
      } catch (err) {
        console.error("Firestore reset error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/services/reset`, { method: 'POST' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API reset error:", err);
      }
    }
    
    localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_SERVICES));
    return true;
  }
}

const ServicesStore = new ServicesDataStore();

// Insights/Blog Store
const DEFAULT_INSIGHTS = [
  {
    id: "post_1",
    title: "Mitigating Outdoor LED Thermal Loads in Middle East Heat",
    meta: "Engineering Guide",
    desc: "A technical guide detailing how dual-chamber active cooling enclosures, ambient dimming photocells, and gold-wire encapsulation prevent pixel failures on outdoor billboards during peak Gulf summer temperatures.",
    image: "assets/images/insight-thermal.jpg",
    content: `<h2>The Thermal Challenge in GCC Region</h2>
<p>Direct exposure to the desert sun can raise the internal chassis temperature of an outdoor LED display above 85°C. Without active mitigation, this thermal load leads to rapid pixel degradation, color shifting, and eventual power supply shutdown.</p>

<img src="assets/images/insight-thermal.jpg" alt="LED Screen Panel Grid" style="width:100%; border-radius:12px; margin: 1.5rem 0; border: 1px solid var(--border);">

<h3>Key Mitigation Strategies Deployed</h3>
<ul>
  <li><strong>Dual-Chamber Enclosures:</strong> Isolating the heat-producing power supplies and receiving cards from the LED cabinet prevents cumulative heat build-up.</li>
  <li><strong>Photocell Intelligent Dimming:</strong> Automatically scaling brightness from 6500 nits down to 1200 nits at night reduces power consumption and ambient heat dissipation by up to 50%.</li>
  <li><strong>Gold-Wire LED Encapsulation:</strong> Copper wire connections degrade quickly under thermal stress. Gold-wire bonding provides double the heat resistance rating.</li>
</ul>`,
    timestamp: "2026-07-01T10:00:00.000Z"
  },
  {
    id: "post_2",
    title: "The Rise of COB MicroLED in Corporate Dubai Lobbies",
    meta: "Technology Trend",
    desc: "Why corporate headquarters in DIFC are transitioning from traditional LCD video walls to Chip-on-Board MicroLED to secure bezel-free boardroom screens with extreme visual contrasts.",
    image: "assets/images/innov-cob.jpg",
    content: `<h2>Transitioning to Bezel-free Display Canvas</h2>
<p>Traditional LCD panels, while highly cost-effective, introduce visible grid bezels (ranging from 0.88mm to 3.5mm) that break up spreadsheets, data visualizers, and brand graphics. Chip-on-Board (COB) MicroLED technology eliminates bezels completely while providing superior contrast ratings.</p>

<img src="assets/images/innov-cob.jpg" alt="Corporate Lobby" style="width:100%; border-radius:12px; margin: 1.5rem 0; border: 1px solid var(--border);">

<h3>Why COB Technology Wins</h3>
<p>Standard SMD LED diodes are soldered to the surface of a board, exposing them to physical damage and moisture. COB technology packs the LED chips directly onto the substrate and seals them with an epoxy resin shield, resulting in:</p>
<ul>
  <li><strong>Impact Resistance:</strong> Anti-collision, anti-moisture, and anti-static durability.</li>
  <li><strong>Wider Viewing Angles:</strong> Uncompromised color accuracy up to 170 degrees.</li>
  <li><strong>Super Contrast:</strong> Pixel level light containment achieving deep black tones.</li>
</ul>`,
    timestamp: "2026-07-08T11:30:00.000Z"
  },
  {
    id: "post_3",
    title: "Why Professional Calibration Beats Factory Presets",
    meta: "Expert Advice",
    desc: "An inside look at color-calibration metrics. Learn how matching chromaticity gamuts across cabinet boards prevents visual screen bleaching under high-brightness direct desert sunlight.",
    image: "assets/images/insight-tech.jpg",
    content: `<h2>The Factory Preset Fallacy</h2>
<p>When displays are manufactured, each batch of LED modules has minor chromaticity shifts in the red, green, and blue diodes. While presets look fine inside a showroom, displaying them outdoors under the harsh UAE sun reveals blotchy color patches and bleached highlights.</p>

<img src="assets/images/insight-tech.jpg" alt="Data Analytics Calibration Chart" style="width:100%; border-radius:12px; margin: 1.5rem 0; border: 1px solid var(--border);">

<h3>Our Optical Calibration Process</h3>
<p>We deploy high-accuracy colorimeters (like Minolta CA-410) to map the coordinate values of each cabinet tile on-site:</p>
<ol>
  <li>Measure the Peak Red, Green, and Blue coordinates.</li>
  <li>Load target target gamuts (sRGB, DCI-P3, or Rec. 2020).</li>
  <li>Upload custom coefficient matrix registers directly to the NovaStar board to equalize panel chromatic uniformity.</li>
</ol>`,
    timestamp: "2026-07-12T09:15:00.000Z"
  }
];

class InsightsDataStore {
  constructor() {
    this.localKey = 'dw_insights';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    const localData = localStorage.getItem(this.localKey);
    let needsReset = !localData;
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (!Array.isArray(parsed) || parsed.some(p => typeof p.image === 'string' && (p.image.includes('unsplash') || p.image.endsWith('.svg')))) {
          needsReset = true;
        }
      } catch (e) {
        needsReset = true;
      }
    }
    if (needsReset) {
      localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_INSIGHTS));
    }
  }

  async getAll() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('insights').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => {
            const data = { ...doc.data(), id: doc.id };
            if (data.image && typeof data.image === 'string' && (data.image.includes('unsplash') || data.image.endsWith('.svg'))) {
              const def = DEFAULT_INSIGHTS.find(d => d.id === doc.id);
              if (def) data.image = def.image;
            }
            list.push(data);
          });
          return list;
        }
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/insights`);
        if (res.ok) {
          const list = await res.json();
          return list.map(item => {
            if (item.image && typeof item.image === 'string' && (item.image.includes('unsplash') || item.image.endsWith('.svg'))) {
              const def = DEFAULT_INSIGHTS.find(d => d.id === item.id);
              if (def) item.image = def.image;
            }
            return item;
          });
        }
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    const localList = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_INSIGHTS;
    return localList.map(item => {
      if (item.image && typeof item.image === 'string' && (item.image.includes('unsplash') || item.image.endsWith('.svg'))) {
        const def = DEFAULT_INSIGHTS.find(d => d.id === item.id);
        if (def) item.image = def.image;
      }
      return item;
    });
  }

  async getById(id) {
    const list = await this.getAll();
    return list.find(item => item.id === id);
  }

  async save(post) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await safeFirestoreSet(db.collection('insights').doc(post.id), post);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
        });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API save error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_INSIGHTS;
    const index = list.findIndex(item => item.id === post.id);
    if (index > -1) {
      list[index] = post;
    } else {
      list.push(post);
    }
    localStorage.setItem(this.localKey, JSON.stringify(list));
    return true;
  }

  async delete(id) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('insights').doc(id).delete();
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/insights/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API delete error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_INSIGHTS;
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(this.localKey, JSON.stringify(filtered));
    return true;
  }

  async reset() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('insights').get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        for (let post of DEFAULT_INSIGHTS) {
          await db.collection('insights').doc(post.id).set(post);
        }
        return true;
      } catch (err) {
        console.error("Firestore reset error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/insights/reset`, { method: 'POST' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API reset error:", err);
      }
    }
    
    localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_INSIGHTS));
    return true;
  }
}

const InsightsStore = new InsightsDataStore();

// Default Careers data for frontend
const DEFAULT_CAREERS = [
  {
    id: "job_1",
    title: "Visual Systems Integration Engineer",
    location: "Dubai, UAE",
    type: "Full-time",
    desc: "Design, calibrate, and install modular high-end LED screen video walls and control center displays for aviation and commercial sectors.",
    requirements: [
      "BSc in Electrical Engineering, Robotics, or equivalent field experience.",
      "3+ years working directly with NovaStar screen controllers, sending loops, and fiber receivers.",
      "Familiarity with structural AutoCAD design parameters and thermal ventilation load planning."
    ]
  },
  {
    id: "job_2",
    title: "CMS Network Coordinator",
    location: "Dubai, UAE",
    type: "Full-time",
    desc: "Manage content playback engines, configure display controllers, and coordinate signal redundancy matrices over corporate local network architectures.",
    requirements: [
      "2+ years experience configuring enterprise digital signage CMS systems (Scala, BrightSign, or matching platforms).",
      "Solid understanding of IP networking, firewalls, and remote terminal connections.",
      "Strong diagnostic capabilities to solve live network signal issues under tight schedules."
    ]
  },
  {
    id: "job_3",
    title: "AMC Operations Technician",
    location: "Dubai Investment Park, Dubai",
    type: "Full-time",
    desc: "Perform scheduled preventive maintenance checks, lead on-site repair operations, and swap out modules for our Annual Maintenance Contract clients.",
    requirements: [
      "Technical Diploma in Electronics, Mechatronics, or equivalent hands-on experience.",
      "Experience with SMD manual soldering, pixel chip diagnostic runs, and module swaps.",
      "Valid UAE driving license to handle site dispatches."
    ]
  }
];

class CareersDataStore {
  constructor() {
    this.localKey = 'dw_careers';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    const localData = localStorage.getItem(this.localKey);
    if (!localData) {
      localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_CAREERS));
    }
  }

  async getAll() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('careers').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
          return list;
        }
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/careers`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    return JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_CAREERS;
  }

  async save(job) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await safeFirestoreSet(db.collection('careers').doc(job.id), job);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/careers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job)
        });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API save error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_CAREERS;
    const index = list.findIndex(item => item.id === job.id);
    if (index > -1) {
      list[index] = job;
    } else {
      list.push(job);
    }
    localStorage.setItem(this.localKey, JSON.stringify(list));
    return true;
  }

  async delete(id) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('careers').doc(id).delete();
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/careers/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API delete error:", err);
      }
    }
    
    const list = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_CAREERS;
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(this.localKey, JSON.stringify(filtered));
    return true;
  }

  async reset() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('careers').get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        for (let job of DEFAULT_CAREERS) {
          await db.collection('careers').doc(job.id).set(job);
        }
        return true;
      } catch (err) {
        console.error("Firestore reset error:", err);
        throw err;
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/careers/reset`, { method: 'POST' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API reset error:", err);
      }
    }
    
    localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_CAREERS));
    return true;
  }
}

const CareersStore = new CareersDataStore();

class InquiriesDataStore {
  constructor() {
    this.localKey = 'dw_inquiries';
  }

  async getAll() {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('inquiries').get();
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        return list;
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/inquiries`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    return JSON.parse(localStorage.getItem(this.localKey)) || [];
  }

  async save(inq) {
    await detectBackend();
    if (!inq.id) inq.id = 'inq_' + Date.now();
    if (!inq.timestamp) inq.timestamp = new Date().toISOString();

    if (backendMode === 'firebase' && db) {
      try {
        await safeFirestoreSet(db.collection('inquiries').doc(inq.id), inq);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
        throw err;
      }
    }

    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inq)
        });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API save error:", err);
      }
    }

    const list = JSON.parse(localStorage.getItem(this.localKey)) || [];
    list.push(inq);
    localStorage.setItem(this.localKey, JSON.stringify(list));
    return true;
  }

  async delete(id) {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('inquiries').doc(id).delete();
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
        throw err;
      }
    }
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/inquiries/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API delete error:", err);
      }
    }
    const list = JSON.parse(localStorage.getItem(this.localKey)) || [];
    const filtered = list.filter(i => i.id !== id);
    localStorage.setItem(this.localKey, JSON.stringify(filtered));
    return true;
  }
}

const InquiriesStore = new InquiriesDataStore();

class SettingsDataStore {
  constructor() {
    this.localKey = 'dw_settings';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    const localData = localStorage.getItem(this.localKey);
    let settings = null;
    if (localData) {
      try { settings = JSON.parse(localData); } catch(e){}
    }
    if (!settings || settings.whatsapp === '971567792681' || settings.phone === '+97143468922' || settings.mobile === '+971567792681' || settings.email === 'sales@displayworldme.com') {
      const newDefaults = {
        phone: '+971508411925',
        mobile: '+971508411925',
        email: 'salessupport@displayworldme.com',
        supportEmail: 'support@displayworldme.com',
        whatsapp: '971508411925',
        whatsappMessage: "Hello! I'm interested in Display World's solutions.",
        address: "Office no 203, Falcon House, Dubai Investment Park, Jebel Ali, Dubai, UAE",
        instagram: "https://www.instagram.com/displayworld.ae/",
        facebook: "https://www.facebook.com/profile.php?id=61561607341527"
      };
      localStorage.setItem(this.localKey, JSON.stringify(newDefaults));
    }
  }

  async get() {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        const doc = await db.collection('settings').doc('site').get();
        if (doc.exists) {
          const data = doc.data();
          let needsUpdate = false;
          if (data.whatsapp === '971567792681' || !data.whatsapp) {
            data.whatsapp = '971508411925';
            needsUpdate = true;
          }
          if (data.phone === '+97143468922' || !data.phone) {
            data.phone = '+971508411925';
            needsUpdate = true;
          }
          if (data.mobile === '+971567792681' || !data.mobile) {
            data.mobile = '+971508411925';
            needsUpdate = true;
          }
          if (data.email === 'sales@displayworldme.com' || !data.email) {
            data.email = 'salessupport@displayworldme.com';
            needsUpdate = true;
          }
          if (!data.supportEmail) {
            data.supportEmail = 'support@displayworldme.com';
            needsUpdate = true;
          }
          if (!data.address || data.address.includes('Al Quoz')) {
            data.address = 'Office no 203, Falcon House, Dubai Investment Park, Jebel Ali, Dubai, UAE';
            needsUpdate = true;
          }
          if (!data.instagram) {
            data.instagram = 'https://www.instagram.com/displayworld.ae/';
            needsUpdate = true;
          }
          if (!data.facebook || data.facebook.includes('displayworld.ae')) {
            data.facebook = 'https://www.facebook.com/profile.php?id=61561607341527';
            needsUpdate = true;
          }
          if (needsUpdate) {
            db.collection('settings').doc('site').set(data).catch(() => {});
          }
          return data;
        }
      } catch (err) {
        console.error("Firestore settings read error:", err);
      }
    }
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/site-settings`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API settings read error:", err);
      }
    }
    const local = JSON.parse(localStorage.getItem(this.localKey)) || {};
    if (local.whatsapp === '971567792681' || !local.whatsapp) local.whatsapp = '971508411925';
    if (local.phone === '+97143468922' || !local.phone) local.phone = '+971508411925';
    if (local.mobile === '+971567792681' || !local.mobile) local.mobile = '+971508411925';
    if (local.email === 'sales@displayworldme.com' || !local.email) local.email = 'salessupport@displayworldme.com';
    if (!local.supportEmail) local.supportEmail = 'support@displayworldme.com';
    if (!local.address || local.address.includes('Al Quoz')) local.address = 'Office no 203, Falcon House, Dubai Investment Park, Jebel Ali, Dubai, UAE';
    if (!local.instagram) local.instagram = 'https://www.instagram.com/displayworld.ae/';
    if (!local.facebook || local.facebook.includes('displayworld.ae')) local.facebook = 'https://www.facebook.com/profile.php?id=61561607341527';
    return local;
  }

  async save(s) {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        await safeFirestoreSet(db.collection('settings').doc('site'), s);
        return true;
      } catch (err) {
        console.error("Firestore settings save error:", err);
        throw err;
      }
    }
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/site-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s)
        });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API settings save error:", err);
      }
    }
    localStorage.setItem(this.localKey, JSON.stringify(s));
    return true;
  }
}

const SettingsStore = new SettingsDataStore();

/* =========================================================================
   SITE IMAGES DATA STORE
   Centralized management of all static site images, logos, banners & backdrops
   ========================================================================= */
class SiteImagesDataStore {
  constructor() {
    this.localKey = 'dw_site_images';
  }

  getDefaults() {
    return {
      home_about_main: {
        key: "home_about_main",
        category: "home",
        page: "index.html",
        title: "Home: About Showcase Photo",
        description: "Main primary photo in the About Display World section on the homepage.",
        url: "https://images.unsplash.com/photo-1582120031356-35f21bf61055?auto=format&fit=crop&q=90&w=1400"
      },
      home_about_float: {
        key: "home_about_float",
        category: "home",
        page: "index.html",
        title: "Home: Tech Calibration Badge",
        description: "Floating secondary image showing calibration metrics on the homepage.",
        url: "https://images.unsplash.com/photo-1583795484071-3c453e3a7c71?auto=format&fit=crop&q=90&w=900"
      },
      about_story_main: {
        key: "about_story_main",
        category: "about",
        page: "about.html",
        title: "About: Company Story Photo",
        description: "Primary high-resolution installation photo on the full About Us page.",
        url: "https://images.unsplash.com/photo-1650728768250-29d1061bf84b?auto=format&fit=crop&q=90&w=1400"
      },
      about_story_float: {
        key: "about_story_float",
        category: "about",
        page: "about.html",
        title: "About: Calibration Badge",
        description: "Floating secondary accent image in the story section on the About Us page.",
        url: "https://images.unsplash.com/photo-1686918269961-507270a5a238?auto=format&fit=crop&q=90&w=900"
      },
      explore_bg_lobby: {
        key: "explore_bg_lobby",
        category: "explore",
        page: "explore.html",
        title: "Simulator: Corporate Lobby Backdrop",
        description: "3D virtual simulator environment backdrop for the Corporate Lobby preset.",
        url: "assets/images/scene-lobby.jpg"
      },
      explore_bg_retail: {
        key: "explore_bg_retail",
        category: "explore",
        page: "explore.html",
        title: "Simulator: Retail Storefront Backdrop",
        description: "3D virtual simulator environment backdrop for the Retail Storefront preset.",
        url: "assets/images/scene-retail.jpg"
      },
      explore_bg_control: {
        key: "explore_bg_control",
        category: "explore",
        page: "explore.html",
        title: "Simulator: Command Center Backdrop",
        description: "3D virtual simulator environment backdrop for the Command Center preset.",
        url: "assets/images/scene-control.jpg"
      },
      innov_oled: {
        key: "innov_oled",
        category: "innovation",
        page: "innovation.html",
        title: "Innovation: Transparent OLED Display",
        description: "Card visual showcasing Transparent OLED Glass Media technology.",
        url: "assets/images/innov-oled.jpg"
      },
      innov_cob: {
        key: "innov_cob",
        category: "innovation",
        page: "innovation.html",
        title: "Innovation: MicroLED COB P0.9",
        description: "Card visual showcasing Chip-on-Board sub-millimeter MicroLED panels.",
        url: "assets/images/innov-cob.jpg"
      },
      innov_holo: {
        key: "innov_holo",
        category: "innovation",
        page: "innovation.html",
        title: "Innovation: Holographic LED Fan",
        description: "Card visual showcasing 3D airborne Holographic LED Fan arrays.",
        url: "assets/images/innov-holo.jpg"
      },
      innov_kinetic: {
        key: "innov_kinetic",
        category: "innovation",
        page: "innovation.html",
        title: "Innovation: Dynamic Kinetic Walls",
        description: "Card visual showcasing motor-actuated Kinetic LED screen modules.",
        url: "assets/images/innov-kinetic.jpg"
      },
      sol_retail: {
        key: "sol_retail",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Retail & Malls",
        description: "Feature display image in the Retail & Malls interactive industry panel.",
        url: "assets/images/sol-retail.jpg"
      },
      sol_hospitality: {
        key: "sol_hospitality",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Hospitality & Hotels",
        description: "Feature display image in the Hospitality & Hotels interactive industry panel.",
        url: "assets/images/sol-hospitality.jpg"
      },
      sol_healthcare: {
        key: "sol_healthcare",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Healthcare & Clinics",
        description: "Feature display image in the Healthcare & Clinics interactive industry panel.",
        url: "assets/images/sol-healthcare.jpg"
      },
      sol_education: {
        key: "sol_education",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Education & Campus",
        description: "Feature display image in the Education & Campus interactive industry panel.",
        url: "assets/images/sol-education.jpg"
      },
      sol_corporate: {
        key: "sol_corporate",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Corporate Offices",
        description: "Feature display image in the Corporate Offices interactive industry panel.",
        url: "assets/images/sol-corporate.jpg"
      }
    };
  }

  async getAll() {
    await detectBackend();
    const defaults = this.getDefaults();
    const defaultUrls = {};
    Object.keys(defaults).forEach(k => {
      defaultUrls[k] = defaults[k].url;
    });

    let storedUrls = {};
    if (backendMode === 'firebase' && db) {
      try {
        const doc = await db.collection('settings').doc('images').get();
        if (doc.exists) {
          storedUrls = doc.data() || {};
        }
      } catch (err) {
        console.error("Firestore site images read error:", err);
      }
    }

    if (Object.keys(storedUrls).length === 0) {
      try {
        const local = localStorage.getItem(this.localKey);
        if (local) {
          storedUrls = JSON.parse(local) || {};
        }
      } catch (e) {
        console.error("Local site images read error:", e);
      }
    }

    // Automatic purge for any stale external/Unsplash URLs or old SVG placeholders:
    Object.keys(storedUrls).forEach(k => {
      if (storedUrls[k] && typeof storedUrls[k] === 'string') {
        if ((storedUrls[k].includes('unsplash') && !(defaults[k] && defaults[k].url.includes('unsplash'))) || (defaults[k] && defaults[k].url.endsWith('.jpg') && storedUrls[k].endsWith('.svg'))) {
          delete storedUrls[k];
        }
      }
    });

    // Automatic migration/healing for logos from broken/unreachable third-party server:
    // Logos, favicon and the home hero are fixed in code (not editable from the admin); ignore old saved values
    ['logo_header','logo_footer','site_favicon','logo_stacked','home_hero'].forEach(k => delete storedUrls[k]);

    // "Save all" used to store the old default paths; treat those as defaults so new defaults apply
    const RETIRED_DEFAULTS = [
      // earlier Unsplash defaults (lobby wall, pixel close-up, control desk, blue panel)
      'https://images.unsplash.com/photo-1575719028439-65ce8662c1cc?auto=format&fit=crop&q=75&w=1200',
      'https://images.unsplash.com/photo-1643642969389-6db6b7a0fa56?auto=format&fit=crop&q=75&w=700',
      'https://images.unsplash.com/photo-1791782060626-ce983b06d9ce?auto=format&fit=crop&q=75&w=1200',
      'https://images.unsplash.com/photo-1545164415-0fae860defbd?auto=format&fit=crop&q=75&w=700',
      'https://images.unsplash.com/photo-1757564591721-4105db68cd6e?auto=format&fit=crop&q=75&w=1200',
      'assets/images/home-about-main.jpg','assets/images/home-about-float.jpg','assets/images/about-story-main.jpg','assets/images/about-story-float.jpg','assets/images/home-about-main.svg','assets/images/home-about-float.svg','assets/images/about-story-main.svg','assets/images/about-story-float.svg'];
    Object.keys(storedUrls).forEach(k => { if (RETIRED_DEFAULTS.includes(storedUrls[k])) delete storedUrls[k]; });

    // Uploaded images kept as separate media documents are resolved to real URLs here
    const merged = Object.assign({}, defaultUrls, storedUrls);
    await Promise.all(Object.keys(merged).map(async k => {
      if (typeof merged[k] === 'string' && merged[k].startsWith(MEDIA_REF_PREFIX)) {
        merged[k] = (await resolveMediaRef(merged[k])) || defaultUrls[k] || '';
      }
    }));
    return merged;
  }

  // All site images used to live inline in ONE settings document, so a handful of uploads pushed it
  // past Firestore's 1 MB limit and the save failed. Inline images are now moved into their own
  // media documents (id derived from key + content, so re-saving never creates duplicates).
  async _externaliseInlineImages(imagesMap) {
    if (!(backendMode === 'firebase' && db)) return imagesMap;
    const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i += 7) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + str.length.toString(36); };
    const out = {};
    for (const [k, v] of Object.entries(imagesMap)) {
      if (typeof v === 'string' && v.startsWith('data:') && v.length > 2000) {
        const id = `site_${k.replace(/[^a-zA-Z0-9_-]/g, '_')}_${hash(v)}`;
        await saveMediaChunked(id, v, { folder: 'site-images', key: k, createdAt: new Date().toISOString() });
        _mediaCache.set(id, Promise.resolve(v));
        out[k] = MEDIA_REF_PREFIX + id;
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  async getItems() {
    const urls = await this.getAll();
    const defaults = this.getDefaults();
    const items = [];

    Object.keys(defaults).forEach(key => {
      const def = defaults[key];
      items.push({
        key: def.key,
        category: def.category,
        page: def.page,
        title: def.title,
        description: def.description,
        defaultUrl: def.url,
        url: urls[key] || def.url,
        isCustom: Boolean(urls[key] && urls[key] !== def.url)
      });
    });

    // Check for any extra custom keys
    Object.keys(urls).forEach(k => {
      if (!defaults[k]) {
        items.push({
          key: k,
          category: "custom",
          page: "Custom Element",
          title: k,
          description: `Custom image override for [data-img-key="${k}"]`,
          defaultUrl: "",
          url: urls[k],
          isCustom: true
        });
      }
    });

    return items;
  }

  async get(key) {
    const all = await this.getAll();
    return all[key] || (this.getDefaults()[key] ? this.getDefaults()[key].url : '');
  }

  async save(imagesMap) {
    await detectBackend();
    // Store only images the admin actually changed. Saving every default froze them in the
    // database, so later default updates (new photos shipped in code) never showed.
    const defaults = this.getDefaults();
    imagesMap = Object.fromEntries(Object.entries(imagesMap || {}).filter(([k, v]) => v && !(defaults[k] && defaults[k].url === v)));
    if (backendMode === 'firebase' && db) {
      try {
        const stored = await this._externaliseInlineImages(imagesMap);
        await safeFirestoreSet(db.collection('settings').doc('images'), stored);
      } catch (err) {
        console.warn("Firestore site images save warning:", err);
        throw err;
      }
    }
    try {
      localStorage.setItem(this.localKey, JSON.stringify(imagesMap));
    } catch (e) {
      console.warn("LocalStorage quota warning:", e);
    }
    return true;
  }

  async reset(key) {
    const all = await this.getAll();
    const defaults = this.getDefaults();
    if (defaults[key]) {
      all[key] = defaults[key].url;
    } else {
      delete all[key];
    }
    return await this.save(all);
  }

  async resetAll() {
    const defaults = this.getDefaults();
    const cleanMap = {};
    Object.keys(defaults).forEach(k => {
      cleanMap[k] = defaults[k].url;
    });
    return await this.save(cleanMap);
  }

  async uploadImage(file, onProgress) {
    // Full quality, stored as its own media record
    return await uploadImageToFirebase(file, 'site-images', onProgress, { allowMediaRef: true });
  }
}

const SiteImagesStore = new SiteImagesDataStore();

/* =========================================================================
   AUTH DATA STORE
   Centralized cryptographic authentication & credentials manager
   ========================================================================= */
class AuthDataStore {
  constructor() {
    this.localKey = 'dw_auth_creds';
    this.sessionKey = 'dw_admin_session';
    this.persistentKey = 'dw_admin_persistent_session';
    this.attemptsKey = 'dw_auth_failed_attempts';
    this.lockoutKey = 'dw_auth_lockout_until';
    this.defaultCreds = {
      username: 'admin',
      salt: 'dw_salt_9f2a7b',
      passwordHash: '14b4f13b8234149117d598c774d5501be316d68be653e6dba1393c0c7e503934',
      updatedAt: '2026-09-28T00:00:00Z'
    };
  }

  async hash(salt, password) {
    const combined = salt + password;
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (typeof require !== 'undefined') {
      try {
        const nodeCrypto = require('crypto');
        return nodeCrypto.createHash('sha256').update(combined).digest('hex');
      } catch (e) {}
    }
    // Fallback simple hash
    let h = 0;
    for (let i = 0; i < combined.length; i++) {
      h = ((h << 5) - h) + combined.charCodeAt(i);
      h |= 0;
    }
    return 'simple_' + Math.abs(h).toString(16);
  }

  generateSalt() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(8);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(36).substring(2, 10);
  }

  async getCredentials() {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        const doc = await db.collection('settings').doc('auth').get();
        if (doc.exists) {
          const data = doc.data();
          if (data && data.username && data.passwordHash && data.salt) {
            localStorage.setItem(this.localKey, JSON.stringify(data));
            return data;
          }
        } else {
          // Seed defaults into cloud store
          await db.collection('settings').doc('auth').set(this.defaultCreds).catch(() => {});
        }
      } catch (err) {
        console.error("Firestore auth read error:", err);
      }
    }
    try {
      const local = JSON.parse(localStorage.getItem(this.localKey));
      if (local && local.username && local.passwordHash && local.salt) {
        return local;
      }
    } catch (e) {}
    return this.defaultCreds;
  }

  checkLockout() {
    try {
      const lockoutUntil = parseInt(localStorage.getItem(this.lockoutKey) || '0', 10);
      const now = Date.now();
      if (lockoutUntil > now) {
        const remainingSec = Math.ceil((lockoutUntil - now) / 1000);
        return { locked: true, remainingSec };
      }
    } catch (e) {}
    return { locked: false, remainingSec: 0 };
  }

  recordFailedAttempt() {
    try {
      const attempts = parseInt(localStorage.getItem(this.attemptsKey) || '0', 10) + 1;
      localStorage.setItem(this.attemptsKey, attempts.toString());
      if (attempts >= 5) {
        const lockoutUntil = Date.now() + 30000; // 30s lockout
        localStorage.setItem(this.lockoutKey, lockoutUntil.toString());
        localStorage.setItem(this.attemptsKey, '0');
        return { locked: true, remainingSec: 30 };
      }
      return { locked: false, remainingAttempts: 5 - attempts };
    } catch (e) {
      return { locked: false, remainingAttempts: 4 };
    }
  }

  resetFailedAttempts() {
    try {
      localStorage.removeItem(this.attemptsKey);
      localStorage.removeItem(this.lockoutKey);
    } catch (e) {}
  }

  firebaseAuthAvailable() {
    return backendMode === 'firebase' && typeof firebase !== 'undefined' && typeof firebase.auth === 'function';
  }

  // Signed in with the real Firebase admin account (what the database rules check)
  hasCloudSession() {
    try {
      const u = this.firebaseAuthAvailable() && firebase.auth().currentUser;
      return !!(u && !u.isAnonymous);
    } catch (e) { return false; }
  }

  async verifyLogin(username, password) {
    const lockout = this.checkLockout();
    if (lockout.locked) {
      return { success: false, error: `Too many failed attempts. Cooldown: ${lockout.remainingSec}s.` };
    }

    await detectBackend();
    // Cloud mode: the "username" is the admin email registered in Firebase Authentication.
    if (this.firebaseAuthAvailable() && String(username || '').includes('@')) {
      try {
        await firebase.auth().signInWithEmailAndPassword(String(username).trim(), password);
        this.resetFailedAttempts();
        return { success: true, cloud: true };
      } catch (err) {
        const code = err && err.code;
        if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
          return { success: false, error: 'Email/Password sign-in is not enabled in Firebase Authentication yet.' };
        }
        if (code === 'auth/network-request-failed') {
          return { success: false, error: 'No connection to Firebase. Check your internet and try again.' };
        }
        const rec = this.recordFailedAttempt();
        if (rec.locked) return { success: false, error: 'Account locked for 30s due to repeated failed attempts.' };
        return { success: false, error: `Invalid email or password. (${rec.remainingAttempts} attempts remaining)` };
      }
    }

    const creds = await this.getCredentials();
    const cleanUser = (username || '').trim().toLowerCase();
    const targetUser = (creds.username || '').trim().toLowerCase();

    if (cleanUser !== targetUser) {
      const rec = this.recordFailedAttempt();
      if (rec.locked) {
        return { success: false, error: `Account locked for 30s due to repeated failed attempts.` };
      }
      return { success: false, error: `Invalid username or password. (${rec.remainingAttempts} attempts remaining)` };
    }

    const inputHash = await this.hash(creds.salt, password);
    if (inputHash !== creds.passwordHash) {
      const rec = this.recordFailedAttempt();
      if (rec.locked) {
        return { success: false, error: `Account locked for 30s due to repeated failed attempts.` };
      }
      return { success: false, error: `Invalid username or password. (${rec.remainingAttempts} attempts remaining)` };
    }

    this.resetFailedAttempts();
    return { success: true };
  }

  createSession(rememberMe) {
    const sessionData = {
      token: 'dw_' + Math.random().toString(36).substring(2) + Date.now(),
      created: Date.now(),
      expires: rememberMe ? (Date.now() + 7 * 24 * 3600 * 1000) : null
    };
    try {
      if (rememberMe) {
        localStorage.setItem(this.persistentKey, JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      }
    } catch (e) {}
  }

  isAuthenticated() {
    // Check sessionStorage
    try {
      const s = sessionStorage.getItem(this.sessionKey);
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && parsed.token) return true;
      }
    } catch (e) {}

    // Check localStorage (rememberMe)
    try {
      const p = localStorage.getItem(this.persistentKey);
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed && parsed.token && (!parsed.expires || parsed.expires > Date.now())) {
          return true;
        } else if (parsed && parsed.expires && parsed.expires <= Date.now()) {
          localStorage.removeItem(this.persistentKey);
        }
      }
    } catch (e) {}

    // Legacy fallback
    try {
      if (sessionStorage.getItem('dw_admin_session') === 'active') {
        return true;
      }
    } catch (e) {}

    return false;
  }

  clearSession() {
    try {
      if (this.firebaseAuthAvailable()) firebase.auth().signOut().catch(() => {});
    } catch (e) {}
    try {
      sessionStorage.removeItem(this.sessionKey);
      sessionStorage.removeItem('dw_admin_session');
      localStorage.removeItem(this.persistentKey);
    } catch (e) {}
  }

  async changeCredentials(currentPassword, newUsername, newPassword) {
    await detectBackend();
    // Cloud admin account: change the real Firebase password
    if (this.hasCloudSession()) {
      if (!newPassword || newPassword.length < 8) return { success: false, error: 'New password must be at least 8 characters long.' };
      const user = firebase.auth().currentUser;
      try {
        const cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(cred);
        await user.updatePassword(newPassword);
        return { success: true, username: user.email };
      } catch (err) {
        if (err && (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')) return { success: false, error: 'Current password does not match.' };
        return { success: false, error: (err && err.message) || 'Could not change the password.' };
      }
    }
    const creds = await this.getCredentials();
    const curHash = await this.hash(creds.salt, currentPassword);
    if (curHash !== creds.passwordHash) {
      return { success: false, error: 'Current password does not match.' };
    }

    if (!newUsername || newUsername.trim().length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const newSalt = this.generateSalt();
    const newHash = await this.hash(newSalt, newPassword);
    const updated = {
      username: newUsername.trim(),
      salt: newSalt,
      passwordHash: newHash,
      updatedAt: new Date().toISOString()
    };

    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        await safeFirestoreSet(db.collection('settings').doc('auth'), updated);
      } catch (err) {
        console.error("Firestore auth save error:", err);
        throw err;
      }
    }
    try {
      localStorage.setItem(this.localKey, JSON.stringify(updated));
    } catch (e) {}
    return { success: true, username: updated.username };
  }
}

const AuthStore = new AuthDataStore();


/* =========================================================================
   TESTIMONIALS STORE (edited from the admin portal, shown on Home + Projects)
   ========================================================================= */
const DEFAULT_TESTIMONIALS = [
  { id: "t1", order: 1, published: true, rating: 5, name: "Ahmed Al Khalifa", role: "IT Director, Gulf Aviation Authority",
    quote: "Display World transformed our entire terminal experience. The FIDS installation has been running 24/7 for over two years with zero downtime. Their R&D background shows in every detail, from colour calibration to failover redundancy." },
  { id: "t2", order: 2, published: true, rating: 5, name: "Sarah Farouk", role: "Head of Visual Merchandising, Retail Group",
    quote: "We needed a reliable partner for our store digital signage rollout across the UAE. Display World delivered on time, and their CMS platform makes content management simple for our team." },
  { id: "t3", order: 3, published: true, rating: 5, name: "Mohammed Al Rashid", role: "Property Director",
    quote: "The LED facade mesh on our headquarters has become a skyline landmark. Display World handled everything from weather-proofing to calibration. They are a true engineering partner." }
];

class TestimonialsDataStore {
  constructor() { this.localKey = 'dw_testimonials'; }

  _readLocal() {
    try { const l = JSON.parse(localStorage.getItem(this.localKey)); return Array.isArray(l) ? l : DEFAULT_TESTIMONIALS.slice(); }
    catch (e) { return DEFAULT_TESTIMONIALS.slice(); }
  }

  _sort(list) {
    return list.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999) || String(a.name).localeCompare(String(b.name)));
  }

  // Everything, including hidden ones (admin)
  async getAll() {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('testimonials').get();
        if (!snap.empty) { const l = []; snap.forEach(d => l.push({ ...d.data(), id: d.id })); return this._sort(l); }
      } catch (err) { console.error('Firestore testimonials read error:', err); }
      return this._sort(DEFAULT_TESTIMONIALS.slice());
    }
    if (backendMode === 'local-api') {
      try { const r = await fetch(`${apiBaseUrl}/api/testimonials`); if (r.ok) return this._sort(await r.json()); } catch (e) {}
    }
    return this._sort(this._readLocal());
  }

  // Only the ones marked "Show on website"
  async getPublished() {
    return (await this.getAll()).filter(t => t.published !== false && t.quote && t.name);
  }

  async save(t) {
    await detectBackend();
    const clean = { ...t, id: t.id || 't_' + Date.now(), rating: Math.max(1, Math.min(5, Number(t.rating) || 5)), order: Number(t.order) || 99, published: t.published !== false, updatedAt: new Date().toISOString() };
    if (backendMode === 'firebase' && db) { await safeFirestoreSet(db.collection('testimonials').doc(clean.id), clean); return true; }
    if (backendMode === 'local-api') {
      const r = await fetch(`${apiBaseUrl}/api/testimonials`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clean) });
      if (!r.ok) throw new Error(`Server refused the save (${r.status})`);
      return true;
    }
    const list = this._readLocal(); const i = list.findIndex(x => x.id === clean.id);
    if (i > -1) list[i] = clean; else list.push(clean);
    localStorage.setItem(this.localKey, JSON.stringify(list));
    return true;
  }

  async delete(id) {
    await detectBackend();
    if (backendMode === 'firebase' && db) { await db.collection('testimonials').doc(id).delete(); return true; }
    if (backendMode === 'local-api') {
      const r = await fetch(`${apiBaseUrl}/api/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(`Server refused the delete (${r.status})`);
      return true;
    }
    localStorage.setItem(this.localKey, JSON.stringify(this._readLocal().filter(x => x.id !== id)));
    return true;
  }
}
const TestimonialsStore = new TestimonialsDataStore();

// Renders testimonial cards into any element with [data-testimonials]; hides the section when empty
async function renderTestimonials() {
  const grids = document.querySelectorAll('[data-testimonials]');
  if (!grids.length) return;
  let list = [];
  try { list = await TestimonialsStore.getPublished(); } catch (e) { return; }
  grids.forEach(grid => {
    const section = grid.closest('section');
    if (!list.length) { if (section) section.hidden = true; return; }
    if (section) section.hidden = false;
    grid.innerHTML = list.map(t => {
      const initials = String(t.name).trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
      const stars = '★'.repeat(t.rating || 5) + '☆'.repeat(5 - (t.rating || 5));
      return `<div class="test-card reveal visible">
          <div class="test-stars" aria-label="${t.rating || 5} out of 5">${stars}</div>
          <p class="test-quote">"${escapeHtml(t.quote)}"</p>
          <div class="test-author">
            <div class="test-avatar">${escapeHtml(initials)}</div>
            <div><h4>${escapeHtml(t.name)}</h4>${t.role ? `<span>${escapeHtml(t.role)}</span>` : ''}</div>
          </div>
        </div>`;
    }).join('');
  });
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderTestimonials);
  else renderTestimonials();
}



/* =========================================================================
   ABOUT PAGE CONTENT (one record, fully edited from the admin "About Page" tab)
   Empty sections are hidden on the site, so nothing invented ever shows.
   ========================================================================= */
const DEFAULT_ABOUT = {
  hero: {
    title: 'Display engineers and installers in Dubai',
    intro: 'We design, install and maintain LED walls, video walls, kiosks and signage for retail, hospitality, offices and entertainment venues across the UAE and Qatar.',
    images: []                 // up to 3 photos; empty = uses the About photos from Site Images
  },
  partners: [],                // [{ name, logo }]
  stats: [
    { value: '20+', label: 'Years in display engineering' },
    { value: '500+', label: 'Systems installed' },
    { value: '15+', label: 'Industries served' }
  ],
  story: {
    heading: 'How we started',
    text: 'Our founders spent years designing screens for display manufacturers before starting Display World. Screens in malls and venues run all day in serious heat, so every system we install is calibrated, colour matched and mounted for continuous use.\n\nOur office is in Dubai Investment Park, and our engineers handle on-site support across the UAE.',
    founderName: '', founderRole: '', founderPhoto: '', founded: '', licence: ''
  },
  team: [],                    // [{ name, role, photo }]
  process: [
    { title: 'Site survey', text: 'We visit the space, check viewing distances, light, power and mounting, and listen to what you need the screens to do.' },
    { title: 'Design and quote', text: 'You get a drawing, the recommended screen and pixel pitch, a fixed quote and a timeline.' },
    { title: 'Installation', text: 'Our own team builds the mounts, installs the screens and runs the cabling, usually outside your opening hours.' },
    { title: 'Calibration and handover', text: 'We match colour and brightness across every panel, set up your content software and train your team.' },
    { title: 'Maintenance', text: 'Annual maintenance contracts with scheduled visits and fast call-outs keep the screens running.' }
  ],
  featuredIds: [],             // empty = the 3 most recent projects
  office: {
    address: 'Office no 203, Falcon House, Dubai Investment Park, Jebel Ali, Dubai, UAE',
    hours: 'Monday to Friday 08:30 to 18:00\nSaturday 09:00 to 14:00',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Falcon+House+Dubai+Investment+Park',
    photo: ''
  },
  showCareers: true
};

const AboutStore = {
  _merge(d) {
    const o = JSON.parse(JSON.stringify(DEFAULT_ABOUT));
    if (!d) return o;
    for (const k of Object.keys(o)) {
      if (d[k] === undefined) continue;
      o[k] = (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) ? { ...o[k], ...d[k] } : d[k];
    }
    return o;
  },
  async get() {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try { const d = await db.collection('settings').doc('about').get(); return this._merge(d.exists ? d.data() : null); } catch (e) { return this._merge(null); }
    }
    try { return this._merge(JSON.parse(localStorage.getItem('dw_about'))); } catch (e) { return this._merge(null); }
  },
  async save(data) {
    await detectBackend();
    const clean = { ...this._merge(data), updatedAt: new Date().toISOString() };
    if (backendMode === 'firebase' && db) { await safeFirestoreSet(db.collection('settings').doc('about'), clean); return true; }
    localStorage.setItem('dw_about', JSON.stringify(clean));
    return true;
  },
  async uploadPhoto(file, onProgress) {
    return uploadImageToFirebase(file, 'about', onProgress, { allowMediaRef: true });
  }
};

/* =========================================================================
   CLIENTS STRIP (names scrolling under the home hero), edited in the admin
   ========================================================================= */
const DEFAULT_CLIENTS = ['Dubai Airports','Hamad International','Mall of the Emirates','Abu Dhabi Media','Qatar Rail','Emaar Properties','DEWA','Aldar Properties','Marriott Hotels','Dubai Holding'];
const ClientsStore = {
  async get() {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        const d = await db.collection('settings').doc('clients').get();
        if (d.exists && Array.isArray(d.data().list)) return { list: d.data().list, show: d.data().show !== false };
      } catch (e) {}
    } else {
      try { const c = JSON.parse(localStorage.getItem('dw_clients')); if (c && Array.isArray(c.list)) return c; } catch (e) {}
    }
    return { list: DEFAULT_CLIENTS.slice(), show: true };
  },
  async save(list, show = true) {
    await detectBackend();
    const clean = { list: list.map(x => String(x).trim()).filter(Boolean).slice(0, 40), show: !!show, updatedAt: new Date().toISOString() };
    if (backendMode === 'firebase' && db) { await safeFirestoreSet(db.collection('settings').doc('clients'), clean); return true; }
    localStorage.setItem('dw_clients', JSON.stringify(clean));
    return true;
  }
};

// Renders the strip. "Mall of | the Emirates" sets which part is pink; otherwise everything after the first word is pink.
async function renderClientsStrip() {
  const strip = document.querySelector('.clients-strip');
  if (!strip) return;
  let data;
  try { data = await ClientsStore.get(); } catch (e) { return; }
  if (!data.show || !data.list.length) { strip.hidden = true; return; }
  strip.hidden = false;
  const li = data.list.map(name => {
    let a, b;
    if (name.includes('|')) { [a, b] = name.split('|').map(x => x.trim()); }
    else { const w = name.trim().split(/\s+/); a = w[0]; b = w.slice(1).join(' '); }
    return `<li>${escapeHtml(a)}${b ? ' <span>' + escapeHtml(b) + '</span>' : ''}</li>`;
  }).join('');
  strip.querySelectorAll('.clients-list').forEach(ul => { ul.innerHTML = li; });
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderClientsStrip);
  else renderClientsStrip();
}

// A brand-new cloud database is empty, and the site shows built-in demo content until the first
// save. Without this, saving the first project made every other demo project vanish.
// Copies the current content in once, only into collections that are completely empty.
async function seedCloudIfEmpty() {
  await detectBackend();
  if (backendMode !== 'firebase' || !db) return { seeded: [] };
  // One time only. If the client later deletes everything, the demo content must not come back.
  const flag = await db.collection('settings').doc('seeded').get({ source: 'server' });
  const catDoc = await db.collection('settings').doc('categories').get({ source: 'server' });
  if (flag.exists || catDoc.exists) {
    if (!flag.exists) { try { await db.collection('settings').doc('seeded').set({ at: new Date().toISOString() }); } catch (e) {} }
    return { seeded: [] };
  }
  const sets = {
    projects: DEFAULT_PROJECTS,
    casestudies: DEFAULT_CASE_STUDIES,
    products: DEFAULT_PRODUCTS,
    services: DEFAULT_SERVICES,
    insights: DEFAULT_INSIGHTS,
    careers: DEFAULT_CAREERS,
    testimonials: DEFAULT_TESTIMONIALS
  };
  const seeded = [];
  for (const [col, list] of Object.entries(sets)) {
    const snap = await db.collection(col).limit(1).get({ source: 'server' });
    if (!snap.empty) continue;
    const batch = db.batch();
    list.forEach(item => batch.set(db.collection(col).doc(String(item.id)), item));
    await batch.commit();
    seeded.push(col);
  }
  const cat = await db.collection('settings').doc('categories').get({ source: 'server' });
  if (!cat.exists) {
    await db.collection('settings').doc('categories').set({ list: DEFAULT_CATEGORIES });
    seeded.push('categories');
  }
  try { await db.collection('settings').doc('seeded').set({ at: new Date().toISOString() }); } catch (e) {}
  return { seeded };
}

if (typeof window !== 'undefined') {
  window.SettingsStore = SettingsStore;
  window.SiteImagesStore = SiteImagesStore;
  window.AuthStore = AuthStore;
  window.uploadImageToFirebase = uploadImageToFirebase;
  window.compressAndOptimizeImage = compressAndOptimizeImage;
  window.checkCloudHealth = checkCloudHealth;
  window.seedCloudIfEmpty = seedCloudIfEmpty;
  window.TestimonialsStore = TestimonialsStore;
  window.ClientsStore = ClientsStore;
  window.AboutStore = AboutStore;
  window.resolveMediaRef = resolveMediaRef;
}
