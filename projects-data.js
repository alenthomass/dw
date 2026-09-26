// Projects Data Store and Manager with Hybrid Backend routing (Firebase, Local Express API, or LocalStorage)
const DEFAULT_PROJECTS = [
  {
    id: "1",
    title: "Airport Flight Information Displays",
    category: "Aviation",
    shortDesc: "24/7 mission-critical FIDS systems, baggage claim displays, and airport wayfinding installations.",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80",
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
  }
];

const DEFAULT_CATEGORIES = ["Aviation", "Retail", "Corporate", "Outdoor LED"];

let db = null;
let storage = null;
let backendMode = 'local-storage'; // Fallback
let apiBaseUrl = 'http://localhost:8080'; // Default express backend url

// Hardcoded Firebase Config in Code (Edit this with your production credentials to activate cloud storage)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBBac1FFuVvIwigbq4ZPpXlnntTcLcEjL0",
  authDomain: "display-world-website.firebaseapp.com",
  projectId: "display-world-website",
  storageBucket: "display-world-website.firebasestorage.app",
  appId: "1:1091017590421:web:cd2bf90afa1e59780efd9c"
};

async function detectBackend() {
  // 1. Check if Firebase config is defined in code
  if (typeof firebase !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      db = firebase.firestore();
      storage = firebase.storage();
      backendMode = 'firebase';
      console.log("Connected to Firebase Firestore Cloud Backend (Configured in Code)");
      return;
    } catch (e) {
      console.error("Firebase startup check failed:", e);
    }
  }

  // 2. Check if Local Express API Server is online
  try {
    const testUrl = window.location.hostname === 'localhost' && window.location.port !== '8080'
      ? `${apiBaseUrl}/api/projects`
      : '/api/projects';
      
    const res = await fetch(testUrl, { method: 'GET' });
    if (res.ok) {
      backendMode = 'local-api';
      apiBaseUrl = window.location.hostname === 'localhost' && window.location.port !== '8080'
        ? 'http://localhost:8080'
        : '';
      console.log("Connected to Local Node.js Express API Server at", apiBaseUrl || 'Relative Path');
      return;
    }
  } catch (err) {
    // Node server is offline or unreachable
  }

  console.log("Fallback to Browser LocalStorage Simulation");
  backendMode = 'local-storage';
}

// Perform startup check
detectBackend();

class ProjectsDataStore {
  constructor() {
    this.localKey = 'dw_projects';
    this.catKey = 'dw_categories';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    const localData = localStorage.getItem(this.localKey);
    let needsReset = !localData;
    
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (!Array.isArray(parsed) || parsed.some(p => !p.specs || !p.client || (p.id === "4" && !p.image.includes("photo-1477959858617")))) {
          needsReset = true;
        }
      } catch(e) {
        needsReset = true;
      }
    }

    if (needsReset) {
      localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_PROJECTS));
      localStorage.setItem(this.catKey, JSON.stringify(DEFAULT_CATEGORIES));
    }
  }

  getMode() {
    return backendMode;
  }

  // Projects CRUD
  async getAll() {
    await detectBackend(); // Ensure connection check is completed
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('projects').get();
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
        const res = await fetch(`${apiBaseUrl}/api/projects`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    return JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_PROJECTS;
  }

  async getById(id) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const doc = await db.collection('projects').doc(id).get();
        if (doc.exists) return { ...doc.data(), id: doc.id };
      } catch (err) {
        console.error("Firestore getById error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/projects`);
        if (res.ok) {
          const list = await res.json();
          return list.find(p => p.id === id);
        }
      } catch (err) {
        console.error("Local API getById error:", err);
      }
    }
    
    const projects = await this.getAll();
    return projects.find(p => p.id === id);
  }

  async save(project) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('projects').doc(project.id).set(project);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project)
        });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API save error:", err);
      }
    }
    
    const projects = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_PROJECTS;
    const index = projects.findIndex(p => p.id === project.id);
    if (index > -1) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(this.localKey, JSON.stringify(projects));
    return true;
  }

  async delete(id) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('projects').doc(id).delete();
        return true;
      } catch (err) {
        console.error("Firestore delete error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/projects/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API delete error:", err);
      }
    }
    
    const projects = JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_PROJECTS;
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(this.localKey, JSON.stringify(filtered));
    return true;
  }

  async reset() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const snap = await db.collection('projects').get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        for (let p of DEFAULT_PROJECTS) {
          await db.collection('projects').doc(p.id).set(p);
        }
        await db.collection('settings').doc('categories').set({ list: DEFAULT_CATEGORIES });
        return true;
      } catch (err) {
        console.error("Firestore reset error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/projects/reset`, { method: 'POST' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API reset error:", err);
      }
    }
    
    localStorage.setItem(this.localKey, JSON.stringify(DEFAULT_PROJECTS));
    localStorage.setItem(this.catKey, JSON.stringify(DEFAULT_CATEGORIES));
    return true;
  }

  // Categories Operations
  async getCategories() {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        const doc = await db.collection('settings').doc('categories').get();
        if (doc.exists && doc.data().list) return doc.data().list;
      } catch (err) {
        console.error("Firestore categories read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/categories`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API categories read error:", err);
      }
    }
    
    return JSON.parse(localStorage.getItem(this.catKey)) || DEFAULT_CATEGORIES;
  }

  async saveCategory(category) {
    const list = await this.getCategories();
    if (category && !list.includes(category)) {
      list.push(category);
      
      if (backendMode === 'firebase' && db) {
        try {
          await db.collection('settings').doc('categories').set({ list });
          return true;
        } catch (err) {
          console.error("Firestore category save error:", err);
        }
      }
      
      if (backendMode === 'local-api') {
        try {
          const res = await fetch(`${apiBaseUrl}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category })
          });
          if (res.ok) return true;
        } catch (err) {
          console.error("Local API category save error:", err);
        }
      }
      
      localStorage.setItem(this.catKey, JSON.stringify(list));
    }
    return true;
  }

  async deleteCategory(category) {
    let list = await this.getCategories();
    list = list.filter(c => c !== category);
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('settings').doc('categories').set({ list });
        return true;
      } catch (err) {
        console.error("Firestore category delete error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/categories/${category}`, { method: 'DELETE' });
        if (res.ok) return true;
      } catch (err) {
        console.error("Local API category delete error:", err);
      }
    }
    
    localStorage.setItem(this.catKey, JSON.stringify(list));
    return true;
  }

  // Upload File
  async uploadImage(file) {
    await detectBackend();
    
    if (backendMode === 'firebase' && storage) {
      try {
        const ref = storage.ref().child(`projects/${Date.now()}_${file.name}`);
        const snap = await ref.put(file);
        const url = await snap.ref.getDownloadURL();
        return url;
      } catch (err) {
        console.error("Firebase Storage upload error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        
        const res = await fetch(`${apiBaseUrl}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, data: base64Data })
        });
        if (res.ok) {
          const json = await res.json();
          return `${apiBaseUrl}${json.url}`; // Returns full url http://localhost:8080/uploads/img_xxx.png
        }
      } catch (err) {
        console.error("Local API upload error:", err);
      }
    }
    
    // Base64 LocalStorage fallback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
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
        await db.collection('casestudies').doc(cs.id).set(cs);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
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
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    specs: {
      "Touch Technology": "Projected Capacitive (10 simultaneous points)",
      "Display Size Options": "43\" / 49\" / 55\"",
      "Enclosure Finish": "Anodized steel, anti-shatter glass",
      "Integrated Engine": "Android 11 / Windows IoT micro-board",
      "Input Latency": "Under 5ms input lag",
      "Accessibility": "ADA-compliant digital directory layout"
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
    if (!localData) {
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
          snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
          return list;
        }
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/products`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    return JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_PRODUCTS;
  }

  async save(prod) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('products').doc(prod.id).set(prod);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
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
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "svc_2",
    num: "02",
    iconType: "led",
    title: "LED Screens & Mesh",
    desc: "Fine pixel pitch indoor/outdoor LED screens, transparent glass facade meshes, IP65-rated structural weatherproofing.",
    image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "svc_3",
    num: "03",
    iconType: "kiosk",
    title: "Interactive Kiosks",
    desc: "Multi-touch wayfinding pedestals, self-service information terminals, custom steel enclosures, and rugged branding.",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "svc_4",
    num: "04",
    iconType: "cms",
    title: "CMS Software",
    desc: "Cloud-based content management system for multi-zone playlists, live content scheduling, and remote player health diagnostic feeds.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "svc_5",
    num: "05",
    iconType: "lighting",
    title: "Facade Linear Lighting",
    desc: "DMX-controlled architectural dynamic RGB linear strips to outline structural facade contours and exterior accent colors.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "svc_6",
    num: "06",
    iconType: "consultancy",
    title: "AV Consultancy & FIP",
    desc: "Professional engineering consulting, hardware integration layout plans, and our custom zero-downtime Fault Information Platform (FIP).",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80"
  }
];

class ServicesDataStore {
  constructor() {
    this.localKey = 'dw_services';
    this.initLocalDefaults();
  }

  initLocalDefaults() {
    const localData = localStorage.getItem(this.localKey);
    if (!localData) {
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
          snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
          return list;
        }
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/services`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    return JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_SERVICES;
  }

  async save(svc) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('services').doc(svc.id).set(svc);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
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
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80",
    content: `<h2>The Thermal Challenge in GCC Region</h2>
<p>Direct exposure to the desert sun can raise the internal chassis temperature of an outdoor LED display above 85°C. Without active mitigation, this thermal load leads to rapid pixel degradation, color shifting, and eventual power supply shutdown.</p>

<img src="https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80" alt="LED Screen Panel Grid" style="width:100%; border-radius:12px; margin: 1.5rem 0; border: 1px solid var(--border);">

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
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    content: `<h2>Transitioning to Bezel-free Display Canvas</h2>
<p>Traditional LCD panels, while highly cost-effective, introduce visible grid bezels (ranging from 0.88mm to 3.5mm) that break up spreadsheets, data visualizers, and brand graphics. Chip-on-Board (COB) MicroLED technology eliminates bezels completely while providing superior contrast ratings.</p>

<img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80" alt="Corporate Lobby" style="width:100%; border-radius:12px; margin: 1.5rem 0; border: 1px solid var(--border);">

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
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    content: `<h2>The Factory Preset Fallacy</h2>
<p>When displays are manufactured, each batch of LED modules has minor chromaticity shifts in the red, green, and blue diodes. While presets look fine inside a showroom, displaying them outdoors under the harsh UAE sun reveals blotchy color patches and bleached highlights.</p>

<img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" alt="Data Analytics Calibration Chart" style="width:100%; border-radius:12px; margin: 1.5rem 0; border: 1px solid var(--border);">

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
    if (!localData) {
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
          snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
          return list;
        }
      } catch (err) {
        console.error("Firestore read error:", err);
      }
    }
    
    if (backendMode === 'local-api') {
      try {
        const res = await fetch(`${apiBaseUrl}/api/insights`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Local API read error:", err);
      }
    }
    
    return JSON.parse(localStorage.getItem(this.localKey)) || DEFAULT_INSIGHTS;
  }

  async getById(id) {
    const list = await this.getAll();
    return list.find(item => item.id === id);
  }

  async save(post) {
    await detectBackend();
    
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('insights').doc(post.id).set(post);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
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
        await db.collection('careers').doc(job.id).set(job);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
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
        await db.collection('inquiries').doc(inq.id).set(inq);
        return true;
      } catch (err) {
        console.error("Firestore save error:", err);
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
        address: "Office no 203, Falcon House, Dubai Investment Park, Jebel Ali, Dubai, UAE"
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
    return local;
  }

  async save(s) {
    await detectBackend();
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('settings').doc('site').set(s);
        return true;
      } catch (err) {
        console.error("Firestore settings save error:", err);
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
      logo_header: {
        key: "logo_header",
        category: "branding",
        page: "All Pages (Header)",
        title: "Navbar Brand Logo",
        description: "Horizontal logo displayed in the top navigation bar across all pages.",
        url: "assets/dw-logo-white.svg"
      },
      logo_footer: {
        key: "logo_footer",
        category: "branding",
        page: "All Pages (Footer)",
        title: "Footer Brand Logo",
        description: "Logo displayed in the footer branding section across all pages.",
        url: "assets/dw-logo.svg"
      },
      site_favicon: {
        key: "site_favicon",
        category: "branding",
        page: "Browser Tab",
        title: "Website Favicon",
        description: "Small icon displayed in browser tabs, bookmark bars, and mobile shortcuts.",
        url: "assets/dw-favicon.svg"
      },
      logo_stacked: {
        key: "logo_stacked",
        category: "branding",
        page: "Social & Media / Centered",
        title: "Centered Stacked Logo",
        description: "Centered vertical logo lockup with DW monogram above DISPLAY WORLD typography.",
        url: "assets/dw-logo-stacked.svg"
      },
      home_about_main: {
        key: "home_about_main",
        category: "home",
        page: "index.html",
        title: "Home: About Showcase Photo",
        description: "Main primary photo in the About Display World section on the homepage.",
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
      },
      home_about_float: {
        key: "home_about_float",
        category: "home",
        page: "index.html",
        title: "Home: Tech Calibration Badge",
        description: "Floating secondary image showing calibration metrics on the homepage.",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80"
      },
      about_story_main: {
        key: "about_story_main",
        category: "about",
        page: "about.html",
        title: "About: Company Story Photo",
        description: "Primary high-resolution installation photo on the full About Us page.",
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
      },
      about_story_float: {
        key: "about_story_float",
        category: "about",
        page: "about.html",
        title: "About: Calibration Badge",
        description: "Floating secondary accent image in the story section on the About Us page.",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80"
      },
      explore_bg_lobby: {
        key: "explore_bg_lobby",
        category: "explore",
        page: "explore.html",
        title: "Simulator: Corporate Lobby Backdrop",
        description: "3D virtual simulator environment backdrop for the Corporate Lobby preset.",
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      },
      explore_bg_retail: {
        key: "explore_bg_retail",
        category: "explore",
        page: "explore.html",
        title: "Simulator: Retail Storefront Backdrop",
        description: "3D virtual simulator environment backdrop for the Retail Storefront preset.",
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
      },
      explore_bg_control: {
        key: "explore_bg_control",
        category: "explore",
        page: "explore.html",
        title: "Simulator: Command Center Backdrop",
        description: "3D virtual simulator environment backdrop for the Command Center preset.",
        url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
      },
      innov_oled: {
        key: "innov_oled",
        category: "innovation",
        page: "innovation.html",
        title: "Innovation: Transparent OLED Display",
        description: "Card visual showcasing Transparent OLED Glass Media technology.",
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80"
      },
      innov_cob: {
        key: "innov_cob",
        category: "innovation",
        page: "innovation.html",
        title: "Innovation: MicroLED COB P0.9",
        description: "Card visual showcasing Chip-on-Board sub-millimeter MicroLED panels.",
        url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
      },
      innov_holo: {
        key: "innov_holo",
        category: "innovation",
        page: "innovation.html",
        title: "Innovation: Holographic LED Fan",
        description: "Card visual showcasing 3D airborne Holographic LED Fan arrays.",
        url: "https://images.unsplash.com/photo-1548345680-f5475ea5df84?auto=format&fit=crop&w=800&q=80"
      },
      innov_kinetic: {
        key: "innov_kinetic",
        category: "innovation",
        page: "innovation.html",
        title: "Innovation: Dynamic Kinetic Walls",
        description: "Card visual showcasing motor-actuated Kinetic LED screen modules.",
        url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=800&q=80"
      },
      sol_retail: {
        key: "sol_retail",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Retail & Malls",
        description: "Feature display image in the Retail & Malls interactive industry panel.",
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
      },
      sol_hospitality: {
        key: "sol_hospitality",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Hospitality & Hotels",
        description: "Feature display image in the Hospitality & Hotels interactive industry panel.",
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
      },
      sol_healthcare: {
        key: "sol_healthcare",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Healthcare & Clinics",
        description: "Feature display image in the Healthcare & Clinics interactive industry panel.",
        url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
      },
      sol_education: {
        key: "sol_education",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Education & Campus",
        description: "Feature display image in the Education & Campus interactive industry panel.",
        url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80"
      },
      sol_corporate: {
        key: "sol_corporate",
        category: "solutions",
        page: "solutions.html",
        title: "Solutions: Corporate Offices",
        description: "Feature display image in the Corporate Offices interactive industry panel.",
        url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80"
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

    // Automatic migration/healing for logos from broken/unreachable third-party server:
    if (!storedUrls.logo_header || storedUrls.logo_header.includes('displayworldme.com')) {
      storedUrls.logo_header = defaultUrls.logo_header;
    }
    if (!storedUrls.logo_footer || storedUrls.logo_footer.includes('displayworldme.com')) {
      storedUrls.logo_footer = defaultUrls.logo_footer;
    }
    if (!storedUrls.site_favicon || storedUrls.site_favicon.includes('displayworldme.com')) {
      storedUrls.site_favicon = defaultUrls.site_favicon;
    }

    return Object.assign({}, defaultUrls, storedUrls);
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
    if (backendMode === 'firebase' && db) {
      try {
        await db.collection('settings').doc('images').set(imagesMap);
      } catch (err) {
        console.error("Firestore site images save error:", err);
      }
    }
    localStorage.setItem(this.localKey, JSON.stringify(imagesMap));
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

  async uploadImage(file) {
    await detectBackend();
    if (backendMode === 'firebase' && storage) {
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const ref = storage.ref().child(`site-images/${Date.now()}_${cleanName}`);
        const snap = await ref.put(file);
        return await snap.ref.getDownloadURL();
      } catch (err) {
        console.error("Firebase Storage site-images upload error:", err);
      }
    }

    if (backendMode === 'local-api') {
      try {
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        const res = await fetch(`${apiBaseUrl}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, data: base64Data })
        });
        if (res.ok) {
          const json = await res.json();
          return `${apiBaseUrl}${json.url}`;
        }
      } catch (err) {
        console.error("Local API upload error:", err);
      }
    }

    // Base64 Data URL fallback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
}

const SiteImagesStore = new SiteImagesDataStore();
if (typeof window !== 'undefined') {
  window.SettingsStore = SettingsStore;
  window.SiteImagesStore = SiteImagesStore;
}
