/*
  Display World — Immersive Visual Interactions
  - Cursor tracking
  - Mobile Menu Toggle
  - Stats counter animations (IntersectionObserver)
  - Hero display slideshow rotation
  - Contact form success state
*/

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  // initCursor(); // disabled — using native browser cursor
  initNavbar();
  initScrollReveal();
  initCounterAnimation();
  initHeroSlideshow();
  initContactForm();
  initFloatingWidgets();
  initDynamicFooter();
});

/* ═══════════════════════════════════════
   THEME TOGGLE
   ═══════════════════════════════════════ */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  
  // Apply saved theme on load
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
}

// Immediate run to avoid theme flicker before DOM finishes parsing
(function() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

/* ═══════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════ */
function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
    requestAnimationFrame(animateRing);
  }
  animateRing();

  const hoverTargets = document.querySelectorAll('a, button, .pf-card, .svc-card, .test-card, input, textarea');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
}

/* ═══════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════ */
function initNavbar() {
  const nav = document.querySelector('.nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('.nav-link') : [];

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ═══════════════════════════════════════
   SCROLL REVEAL (Intersection Observer)
   ═══════════════════════════════════════ */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════
   COUNTER ANIMATION
   ═══════════════════════════════════════ */
function initCounterAnimation() {
  const counters = document.querySelectorAll('.stat-num');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseInt(entry.target.dataset.count);
        const suffix = entry.target.dataset.suffix || '';
        let current = 0;
        const step = target / 50;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          entry.target.textContent = Math.floor(current) + suffix;
        }, 20);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════
   SHOWROOM STAND INTERACTIONS
   ═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   SIGNAGE INTERACTIVE CONSOLE HANDLER
   ═══════════════════════════════════════ */
function initHeroSlideshow() {
  const tabs = document.querySelectorAll('.console-tab');
  const screens = document.querySelectorAll('.monitor-screen');
  const widgetBtns = document.querySelectorAll('.widget-btn');
  const clockWidget = document.getElementById('m-clock');

  if (tabs.length === 0) return;

  // Tab swapping
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = 'ms-' + tab.dataset.content;
      screens.forEach(s => {
        s.classList.toggle('active', s.id === targetId);
      });
    });
  });

  // Widget Toggles
  widgetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const widgetId = 'm-' + btn.dataset.toggle;
      const targetWidget = document.getElementById(widgetId);
      if (targetWidget) {
        targetWidget.classList.toggle('visible');
      }
    });
  });

  // Real-time Clock Widget incrementor
  if (clockWidget) {
    setInterval(() => {
      const now = new Date();
      clockWidget.textContent = now.toLocaleTimeString();
    }, 1000);
  }
}

/* ═══════════════════════════════════════
   CONTACT FORM
   ═══════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form || !success) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn ? btn.querySelector('span') : null;
    
    if (btnText) btnText.textContent = 'Sending…';
    if (btn) btn.disabled = true;

    // Gather form inputs
    const nameEl = form.querySelector('input[placeholder="Your Name"]') || form.querySelector('input[type="text"]');
    const emailEl = form.querySelector('input[type="email"]');
    const subjectEl = form.querySelector('input[placeholder="Subject"]');
    const msgEl = form.querySelector('textarea');

    const name = nameEl ? nameEl.value : '';
    const email = emailEl ? emailEl.value : '';
    const subject = subjectEl ? subjectEl.value : '';
    const message = msgEl ? msgEl.value : '';

    try {
      if (typeof InquiriesStore !== 'undefined') {
        await InquiriesStore.save({
          type: 'Contact Inquiry',
          name,
          email,
          subject,
          message
        });
      } else {
        console.error('InquiriesStore is undefined');
      }
    } catch(err) {
      console.error('Failed to submit inquiry:', err);
    }

    setTimeout(() => {
      form.classList.add('hidden');
      success.classList.add('visible');
    }, 1500);
  });
}

/* ═══════════════════════════════════════
   FLOATING WIDGETS (WHATSAPP & SCROLL TOP)
   ═══════════════════════════════════════ */
function initFloatingWidgets() {
  const scrollTopBtn = document.getElementById('scroll-top');
  if (!scrollTopBtn) return;

  // Show/Hide Scroll-to-Top Button on Scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  // Smooth Scroll back to top on Click
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ═══════════════════════════════════════
   DYNAMIC FOOTER & WIDGET CONFIGURATION
   ═══════════════════════════════════════ */
async function initDynamicFooter() {
  if (typeof SettingsStore === 'undefined') return;
  try {
    const s = await SettingsStore.get();
    if (!s) return;
    const phoneNum = s.phone || '+971508411925';
    const phoneFormatted = '+971 50 841 1925';
    const salesEmail = s.email || 'salessupport@displayworldme.com';
    const supportEmail = s.supportEmail || 'support@displayworldme.com';
    const waNum = s.whatsapp || '971508411925';

    // 1. Update phone links
    document.querySelectorAll('a[href^="tel:"]').forEach(el => {
      const href = el.getAttribute('href') || '';
      const text = el.textContent || '';
      
      if (href.includes('43468922') || text.includes('4 346 8922') || 
          href.includes('567792681') || text.includes('56 779 2681') ||
          href.includes('508411925') || text.includes('50 841 1925')) {
        el.href = `tel:${phoneNum}`;
        if (text.includes('Call')) {
          el.textContent = `Call ${phoneFormatted}`;
        } else if (text.includes('Tel:') || text.includes('Mob:') || text.includes('Phone:')) {
          el.textContent = `Phone: ${phoneFormatted}`;
        } else {
          el.textContent = phoneFormatted;
        }
      }
    });

    // 2. Update email links
    document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
      const href = el.getAttribute('href') || '';
      if (href.includes('salessupport@displayworldme.com') || href.includes('sales@displayworldme.com')) {
        el.href = `mailto:${salesEmail}`;
        el.textContent = salesEmail;
      } else if (href.includes('support@displayworldme.com')) {
        el.href = `mailto:${supportEmail}`;
        el.textContent = supportEmail;
      }
    });

    // 3. Update WhatsApp float link
    const waFloats = document.querySelectorAll('.float-whatsapp');
    waFloats.forEach(waFloat => {
      waFloat.href = `https://wa.me/${waNum}?text=${encodeURIComponent(s.whatsappMessage || '')}`;
    });

    // 4. Update address
    const addr = s.address || 'Office no 203, Falcon House, Dubai Investment Park, Jebel Ali, Dubai, UAE';
    document.querySelectorAll('.footer-contact-item').forEach(el => {
      if (el.innerHTML.includes('Address')) {
        el.innerHTML = `<strong>Address</strong>\n            ${addr}`;
      }
    });
  } catch (err) {
    console.error('Failed to init dynamic footer:', err);
  }
}
