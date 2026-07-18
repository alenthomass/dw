# Implementation Plan - Products Page Integration

We will build a high-end, interactive **Hardware Products Showcase Page** (`products.html`) to complement the custom projects portfolio, giving Display World a complete enterprise-grade commercial presence.

## Proposed Changes

We will create a new products catalog page and integrate it into the global navigation headers and footers of all existing pages.

---

### [Component: Products Catalog]

#### [NEW] [products.html](file:///Users/alenthomas/Downloads/dw/products.html)
- Create a premium responsive grid displaying Display World's flagship hardware catalog:
  - **Fine-Pitch LED Walls** (Indoor P1.2 / P1.5 / P1.8)
  - **High-Brightness Outdoor LEDs** (IP65, P3 / P4)
  - **Ultra-Slim Window LCDs** (Double-Sided, 3500 nits)
  - **Modular LCD Video Walls** (0.88mm Bezel arrays)
  - **Transparent LED Glass Film** (High transparency adhesive screens)
  - **Interactive Smart Kiosks** (PCAP Touch panels)
- Include category navigation tabs (All, LED Screens, LCD Panels, Transparent, Interactive).
- Add an interactive **Technical Specs Sheet Drawer** that slides open when clicking any product, showing detailed hardware specifications (pixel pitch, brightness nits, refresh rate, contrast, power draw) with a "Simulate Spec Download" and "Request Quote" CTAs.

---

### [Component: Navigation Sync]

#### [MODIFY] [index.html](file:///Users/alenthomas/Downloads/dw/index.html)
#### [MODIFY] [portfolio.html](file:///Users/alenthomas/Downloads/dw/portfolio.html)
#### [MODIFY] [project-detail.html](file:///Users/alenthomas/Downloads/dw/project-detail.html)
#### [MODIFY] [about.html](file:///Users/alenthomas/Downloads/dw/about.html)
#### [MODIFY] [services.html](file:///Users/alenthomas/Downloads/dw/services.html)
#### [MODIFY] [contact.html](file:///Users/alenthomas/Downloads/dw/contact.html)
#### [MODIFY] [admin.html](file:///Users/alenthomas/Downloads/dw/admin.html)
- Inject the new `Products` link in the header nav menu and mobile slide-out drawer on all pages:
  - `Home` -> `About Us` -> `Projects` -> **`Products`** -> `Services` -> `Contact`
- Add `Products` to the "Navigation" columns in all footers.

---

### [Component: Stylesheets]

#### [MODIFY] [index.css](file:///Users/alenthomas/Downloads/dw/index.css)
- Append responsive styles for the product card grids, interactive filter tabs, and the spec sheets drawer.
- Ensure full support for Light Mode (`data-theme="light"` overrides) to prevent bleached text.

---

## Verification Plan

### Manual Verification
1. Open the local server at `http://localhost:8080/products.html`.
2. Test category filtering options.
3. Click on a product to verify the spec sheets slide-out drawer renders correctly.
4. Toggle between Light and Dark mode to confirm text readability.
5. Check navigation links on all other pages to verify the navbar routing.
