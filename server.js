require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Resend Client
const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const NOTIFICATION_RECIPIENT = process.env.NOTIFICATION_RECIPIENT || 'sales@displayworldme.com';

// Initialize Firebase Admin (Cloud Storage)
let bucket = null;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (firebasePrivateKey) {
  // Replace literal '\n' sequences with actual newline characters
  firebasePrivateKey = firebasePrivateKey.replace(/\\n/g, '\n');
}

if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
  try {
    admin.initializeApp({
      credential: admin.cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    bucket = getStorage().bucket();
    console.log("Connected to Firebase Cloud Storage Backend [Active]");
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
  }
} else {
  console.log("Firebase Admin credentials not fully configured. Using Local File Storage Mode (Fallback).");
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static website files
app.use(express.static(__dirname));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');
const CASESTUDIES_FILE = path.join(__dirname, 'casestudies.json');
const INQUIRIES_FILE = path.join(__dirname, 'inquiries.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const SERVICES_FILE = path.join(__dirname, 'services.json');
const INSIGHTS_FILE = path.join(__dirname, 'insights.json');
const SETTINGS_FILE = path.join(__dirname, 'site-settings.json');
const CAREERS_FILE = path.join(__dirname, 'careers.json');

// Default Careers Seed
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
    location: "Al Quoz, Dubai",
    type: "Full-time",
    desc: "Perform scheduled preventive maintenance checks, lead on-site repair operations, and swap out modules for our Annual Maintenance Contract clients.",
    requirements: [
      "Technical Diploma in Electronics, Mechatronics, or equivalent hands-on experience.",
      "Experience with SMD manual soldering, pixel chip diagnostic runs, and module swaps.",
      "Valid UAE driving license to handle site dispatches."
    ]
  }
];

// Default site settings
const DEFAULT_SETTINGS = {
  phone: '+97143468922',
  mobile: '+971567792681',
  email: 'sales@displayworldme.com',
  whatsapp: '971567792681',
  whatsappMessage: "Hello! I'm interested in Display World's solutions."
};

if (!fs.existsSync(SETTINGS_FILE)) {
  writeJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
}

// Seed default categories
const DEFAULT_CATEGORIES = ['Aviation', 'Retail', 'Corporate', 'Outdoor LED'];

// Default Case Studies
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

// Default Products Seed
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

// Default Services Seed
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

// Default Insights Seed
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

// Helper to read JSON files
function readJSON(file, defaultValue) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading file:', file, err);
  }
  return defaultValue;
}

// Helper to write JSON files
function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing file:', file, err);
    return false;
  }
}

// Seed default projects if empty
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
    location: "Al Quoz Operations Center, Dubai",
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
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
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

if (!fs.existsSync(PROJECTS_FILE)) {
  writeJSON(PROJECTS_FILE, DEFAULT_PROJECTS);
}

if (!fs.existsSync(CATEGORIES_FILE)) {
  writeJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
}

if (!fs.existsSync(CAREERS_FILE)) {
  writeJSON(CAREERS_FILE, DEFAULT_CAREERS);
}

/* ═══════════ API ENDPOINTS ═══════════ */

// Projects CRUD
app.get('/api/projects', (req, res) => {
  res.json(readJSON(PROJECTS_FILE, DEFAULT_PROJECTS));
});

app.post('/api/projects', (req, res) => {
  const projects = readJSON(PROJECTS_FILE, DEFAULT_PROJECTS);
  const newProj = req.body;
  
  const index = projects.findIndex(p => p.id === newProj.id);
  if (index > -1) {
    projects[index] = newProj;
  } else {
    projects.push(newProj);
  }
  
  writeJSON(PROJECTS_FILE, projects);
  res.json({ success: true, project: newProj });
});

app.delete('/api/projects/:id', (req, res) => {
  const projects = readJSON(PROJECTS_FILE, DEFAULT_PROJECTS);
  const filtered = projects.filter(p => p.id !== req.params.id);
  writeJSON(PROJECTS_FILE, filtered);
  res.json({ success: true });
});

app.post('/api/projects/reset', (req, res) => {
  writeJSON(PROJECTS_FILE, DEFAULT_PROJECTS);
  res.json({ success: true, projects: DEFAULT_PROJECTS });
});

// Categories CRUD
app.get('/api/categories', (req, res) => {
  res.json(readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES));
});

app.post('/api/categories', (req, res) => {
  const categories = readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
  const newCat = req.body.category;
  
  if (newCat && !categories.includes(newCat)) {
    categories.push(newCat);
    writeJSON(CATEGORIES_FILE, categories);
    res.json({ success: true, categories });
  } else {
    res.status(400).json({ error: 'Category already exists or invalid' });
  }
});

app.delete('/api/categories/:name', (req, res) => {
  const categories = readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
  const filtered = categories.filter(c => c.toLowerCase() !== req.params.name.toLowerCase());
  writeJSON(CATEGORIES_FILE, filtered);
  res.json({ success: true, categories: filtered });
});

// Case Studies CRUD
app.get('/api/casestudies', (req, res) => {
  res.json(readJSON(CASESTUDIES_FILE, DEFAULT_CASE_STUDIES));
});

app.post('/api/casestudies', (req, res) => {
  const list = readJSON(CASESTUDIES_FILE, DEFAULT_CASE_STUDIES);
  const newCs = req.body;
  
  const index = list.findIndex(c => c.id === newCs.id);
  if (index > -1) {
    list[index] = newCs;
  } else {
    list.push(newCs);
  }
  
  writeJSON(CASESTUDIES_FILE, list);
  res.json({ success: true, casestudy: newCs });
});

app.delete('/api/casestudies/:id', (req, res) => {
  const list = readJSON(CASESTUDIES_FILE, DEFAULT_CASE_STUDIES);
  const filtered = list.filter(c => c.id !== req.params.id);
  writeJSON(CASESTUDIES_FILE, filtered);
  res.json({ success: true });
});

app.post('/api/casestudies/reset', (req, res) => {
  writeJSON(CASESTUDIES_FILE, DEFAULT_CASE_STUDIES);
  res.json({ success: true, casestudies: DEFAULT_CASE_STUDIES });
});

// Products CRUD
app.get('/api/products', (req, res) => {
  res.json(readJSON(PRODUCTS_FILE, DEFAULT_PRODUCTS));
});

app.post('/api/products', (req, res) => {
  const list = readJSON(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  const newProd = req.body;
  const index = list.findIndex(p => p.id === newProd.id);
  if (index > -1) {
    list[index] = newProd;
  } else {
    list.push(newProd);
  }
  writeJSON(PRODUCTS_FILE, list);
  res.json({ success: true, product: newProd });
});

app.delete('/api/products/:id', (req, res) => {
  const list = readJSON(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  const filtered = list.filter(p => p.id !== req.params.id);
  writeJSON(PRODUCTS_FILE, filtered);
  res.json({ success: true, products: filtered });
});

app.post('/api/products/reset', (req, res) => {
  writeJSON(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  res.json({ success: true, products: DEFAULT_PRODUCTS });
});

// Services CRUD
app.get('/api/services', (req, res) => {
  res.json(readJSON(SERVICES_FILE, DEFAULT_SERVICES));
});

app.post('/api/services', (req, res) => {
  const list = readJSON(SERVICES_FILE, DEFAULT_SERVICES);
  const newSvc = req.body;
  const index = list.findIndex(s => s.id === newSvc.id);
  if (index > -1) {
    list[index] = newSvc;
  } else {
    list.push(newSvc);
  }
  writeJSON(SERVICES_FILE, list);
  res.json({ success: true, service: newSvc });
});

app.delete('/api/services/:id', (req, res) => {
  const list = readJSON(SERVICES_FILE, DEFAULT_SERVICES);
  const filtered = list.filter(s => s.id !== req.params.id);
  writeJSON(SERVICES_FILE, filtered);
  res.json({ success: true, services: filtered });
});

// Insights CRUD
app.get('/api/insights', (req, res) => {
  res.json(readJSON(INSIGHTS_FILE, DEFAULT_INSIGHTS));
});

app.post('/api/insights', (req, res) => {
  const list = readJSON(INSIGHTS_FILE, DEFAULT_INSIGHTS);
  const newPost = req.body;
  const index = list.findIndex(p => p.id === newPost.id);
  if (index > -1) {
    list[index] = newPost;
  } else {
    list.push(newPost);
  }
  writeJSON(INSIGHTS_FILE, list);
  res.json({ success: true, insight: newPost });
});

app.delete('/api/insights/:id', (req, res) => {
  const list = readJSON(INSIGHTS_FILE, DEFAULT_INSIGHTS);
  const filtered = list.filter(p => p.id !== req.params.id);
  writeJSON(INSIGHTS_FILE, filtered);
  res.json({ success: true, insights: filtered });
});

app.post('/api/insights/reset', (req, res) => {
  writeJSON(INSIGHTS_FILE, DEFAULT_INSIGHTS);
  res.json({ success: true, insights: DEFAULT_INSIGHTS });
});

// Inquiries CRUD
app.get('/api/inquiries', (req, res) => {
  res.json(readJSON(INQUIRIES_FILE, []));
});

app.post('/api/inquiries', (req, res) => {
  const list = readJSON(INQUIRIES_FILE, []);
  const newInq = {
    id: `inq_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...req.body
  };
  list.push(newInq);
  writeJSON(INQUIRIES_FILE, list);
  
  // Asynchronously dispatch email notification
  sendInquiryEmail(newInq).catch(err => console.error('SMTP Background error:', err));
  
  res.json({ success: true, inquiry: newInq });
});

app.delete('/api/inquiries/:id', (req, res) => {
  const list = readJSON(INQUIRIES_FILE, []);
  const filtered = list.filter(i => i.id !== req.params.id);
  writeJSON(INQUIRIES_FILE, filtered);
  res.json({ success: true, inquiries: filtered });
});

// Careers CRUD
app.get('/api/careers', (req, res) => {
  res.json(readJSON(CAREERS_FILE, DEFAULT_CAREERS));
});

app.post('/api/careers', (req, res) => {
  const list = readJSON(CAREERS_FILE, DEFAULT_CAREERS);
  const item = req.body;
  const index = list.findIndex(c => c.id === item.id);
  if (index > -1) {
    list[index] = item;
  } else {
    list.push(item);
  }
  writeJSON(CAREERS_FILE, list);
  res.json({ success: true, career: item });
});

app.delete('/api/careers/:id', (req, res) => {
  const list = readJSON(CAREERS_FILE, DEFAULT_CAREERS);
  const filtered = list.filter(c => c.id !== req.params.id);
  writeJSON(CAREERS_FILE, filtered);
  res.json({ success: true, careers: filtered });
});

app.post('/api/careers/reset', (req, res) => {
  writeJSON(CAREERS_FILE, DEFAULT_CAREERS);
  res.json({ success: true, careers: DEFAULT_CAREERS });
});

// Base64 File Upload Endpoint
app.post('/api/upload', async (req, res) => {
  const { name, data } = req.body;
  if (!name || !data) {
    return res.status(400).json({ error: 'Invalid name or base64 data' });
  }
  
  try {
    // Strip data url prefix if present
    const base64Content = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    const ext = path.extname(name) || '.png';
    const cleanExt = ext.replace('.', '') || 'png';

    if (bucket) {
      const filename = `uploads/img_${Date.now()}${ext}`;
      const fileRef = bucket.file(filename);
      
      await fileRef.save(buffer, {
        metadata: {
          contentType: `image/${cleanExt}`,
          cacheControl: 'public, max-age=31536000'
        }
      });
      
      // Make the file publicly accessible
      await fileRef.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      console.log(`[Firebase Upload] Successfully saved image to Cloud Storage: ${publicUrl}`);
      return res.json({ success: true, url: publicUrl });
    }
    
    // Local Fallback Mode
    const filename = `img_${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);
    res.json({ success: true, url: `/uploads/${filename}` });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Site Settings API
app.get('/api/site-settings', (req, res) => {
  res.json(readJSON(SETTINGS_FILE, DEFAULT_SETTINGS));
});

app.post('/api/site-settings', (req, res) => {
  const settings = req.body;
  writeJSON(SETTINGS_FILE, settings);

  // Update WhatsApp link and footer contact info across all HTML pages
  const htmlFiles = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.html') && f !== 'admin.html');

  for (const file of htmlFiles) {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Update WhatsApp float link
    content = content.replace(
      /href="https:\/\/wa\.me\/[^"]*"/g,
      `href="https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(settings.whatsappMessage || '')}"`
    );

    // Update tel: links for phone
    content = content.replace(
      /href="tel:\+97143468922"/g,
      `href="tel:${settings.phone}"`
    );
    content = content.replace(
      /href="tel:\+971567792681"/g,
      `href="tel:${settings.mobile}"`
    );

    fs.writeFileSync(filePath, content, 'utf8');
  }

  res.json({ success: true, message: 'Site settings saved and pages updated.' });
});

// Fallback to home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Display World backend server listening on http://localhost:${PORT}`);
});

// Dedicated Email Router Endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html } = req.body;
  if (!subject || !html) {
    return res.status(400).json({ error: 'Missing subject or html content parameters' });
  }

  if (!resend) {
    console.log(`[Resend Router Sandbox] Simulated dispatch:`);
    console.log(`To: ${to || NOTIFICATION_RECIPIENT}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html.substring(0, 100)}...`);
    return res.json({ success: true, simulated: true, message: 'Resend API key missing. Dispatch simulated.' });
  }

  try {
    const response = await resend.emails.send({
      from: 'Display World Portal <onboarding@resend.dev>',
      to: to || NOTIFICATION_RECIPIENT,
      subject: subject,
      html: html
    });

    if (response.error) {
      console.error('[Resend Router Error]', response.error);
      return res.status(500).json({ error: response.error.message });
    }

    res.json({ success: true, id: response.data.id });
  } catch (err) {
    console.error('Email router dispatch error:', err);
    res.status(500).json({ error: 'Failed to dispatch email' });
  }
});

// Helper: send email notification using Resend
async function sendInquiryEmail(inquiry) {
  let emailBody = '';
  if (inquiry.type === 'AMC SLA Inquiry') {
    emailBody = `
      <h3>New AMC SLA Support Quote Request</h3>
      <p><strong>Name:</strong> ${inquiry.name}</p>
      <p><strong>Company:</strong> ${inquiry.company || 'N/A'}</p>
      <p><strong>Email:</strong> ${inquiry.email}</p>
      <p><strong>Plan Selected:</strong> ${inquiry.plan ? inquiry.plan.toUpperCase() : 'N/A'}</p>
      <p><strong>System Details:</strong></p>
      <pre style="background:#f4f4f5; padding:1rem; border-radius:6px; border:1px solid #e4e4e7;">${inquiry.details || ''}</pre>
      <hr>
      <p style="font-size:0.8rem; color:#777;">Received via Display World Portal at ${new Date(inquiry.timestamp).toLocaleString()}</p>
    `;
  } else {
    emailBody = `
      <h3>New Contact Message Inquiry</h3>
      <p><strong>Name:</strong> ${inquiry.name}</p>
      <p><strong>Email:</strong> ${inquiry.email}</p>
      <p><strong>Subject:</strong> ${inquiry.subject || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <pre style="background:#f4f4f5; padding:1rem; border-radius:6px; border:1px solid #e4e4e7;">${inquiry.message || ''}</pre>
      <hr>
      <p style="font-size:0.8rem; color:#777;">Received via Display World Portal at ${new Date(inquiry.timestamp).toLocaleString()}</p>
    `;
  }

  if (!resend) {
    console.log(`\n================= RESEND SIMULATED INQUIRY =================`);
    printInquiryConsole(inquiry);
    console.log(`============================================================\n`);
    return;
  }

  try {
    const response = await resend.emails.send({
      from: 'Display World Portal <onboarding@resend.dev>',
      to: NOTIFICATION_RECIPIENT,
      subject: `[Display World Portal] ${inquiry.type} - ${inquiry.name}`,
      html: emailBody
    });

    if (response.error) {
      console.error(`[Resend Error] Failed to send email for inquiry: ${inquiry.id}`, response.error);
      return;
    }

    console.log(`[Email Sent] Successfully dispatched Resend notification for inquiry: ${inquiry.id}`);
  } catch (err) {
    console.error(`[Email Dispatch Exception] Failed to send Resend email:`, err);
  }
}

function printInquiryConsole(inquiry) {
  console.log(`[Email Notice] Resend API Key not configured. Logging Inquiry details:`);
  console.log(`Type: ${inquiry.type}`);
  console.log(`Sender: ${inquiry.name} (${inquiry.email})`);
  if (inquiry.company) console.log(`Company: ${inquiry.company}`);
  if (inquiry.plan) console.log(`Plan: ${inquiry.plan}`);
  if (inquiry.subject) console.log(`Subject: ${inquiry.subject}`);
  console.log(`Content: ${inquiry.message || inquiry.details}`);
  console.log(`Time: ${inquiry.timestamp}`);
}
