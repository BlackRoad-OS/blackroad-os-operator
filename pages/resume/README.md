# Resume - resume.blackroad.io

**Live URL:** [resume.blackroad.io](https://resume.blackroad.io) _(after deployment)_

## Overview

Interactive, web-based resume for Alexa Louise Amundson with BlackRoad OS branding, verified metrics, and PDF export functionality.

## Features

- ✅ **Beautiful Design** - Gradient header with BlackRoad brand colors
- ✅ **Verified Metrics** - 1.38M LOC, $26.8M sales, PS-SHA-∞ verification
- ✅ **PDF Export** - Print-optimized stylesheet for clean PDF downloads
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **SEO Optimized** - JSON-LD structured data, meta tags
- ✅ **Fast Loading** - Single HTML file, no dependencies
- ✅ **Interactive** - Hover effects, smooth transitions

## Quick Start

### Local Preview

```bash
# From pages/resume directory
python3 -m http.server 8000

# Visit
open http://localhost:8000
```

### Deploy to Cloudflare Pages

```bash
# Option 1: Automated script
../../scripts/deploy-resume.sh

# Option 2: Manual deployment
wrangler pages deploy . --project-name=resume-blackroad
```

## Deployment Steps

### 1. Deploy to Cloudflare Pages

```bash
cd pages/resume
wrangler pages deploy . --project-name=resume-blackroad
```

**Output:**
```
✨ Success! Uploaded 1 file
✨ Deployment complete! Take a peek over at https://resume-blackroad.pages.dev
```

### 2. Add Custom Domain

**Via Cloudflare Dashboard:**
1. Go to Workers & Pages
2. Click on `resume-blackroad` project
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `resume.blackroad.io`
6. Click **Activate domain**

Cloudflare will automatically:
- Create DNS records
- Provision SSL certificate
- Route traffic to your resume

**DNS propagation:** Usually instant, max 5 minutes

### 3. Verify Deployment

```bash
# Check DNS
dig resume.blackroad.io

# Test live site
curl -I https://resume.blackroad.io
```

## Features Breakdown

### Header Section
- **Name & Title** - Large, prominent display
- **Contact Info** - Email, phone, LinkedIn, GitHub
- **Action Buttons**
  - 📄 Download PDF (uses browser print)
  - 📧 Contact Me (email link)
  - 📊 View KPI Dashboard (links to kpi.blackroad.io)

### Platform Metrics
- **9 metric cards** showing verified KPIs
- Live data from BlackRoad infrastructure
- PS-SHA-∞ verification badge

### Professional Experience
- **4 companies** with detailed bullet points
- Color-coded sections (blue accent)
- Subsections for different responsibilities

### Technical Skills
- **6 skill categories** (Languages, AI/ML, Cloud, etc.)
- Tag-based display for easy scanning
- Purple accent color

### Education & Licenses
- University degree
- Professional certifications (Series 7/66, etc.)

### Awards & Leadership
- Trophy icons for visual appeal
- All major achievements listed

### Footer
- Version info and verification
- Links to BlackRoad properties
- Copyright notice

## PDF Export

### How It Works

The page includes a **print stylesheet** (`@media print`) that:
- Removes background colors
- Converts to black & white
- Removes interactive buttons
- Optimizes for paper printing
- Prevents page breaks in cards

### Generate PDF

**Method 1: Browser Print**
1. Click "📄 Download PDF" button
2. In print dialog:
   - Destination: "Save as PDF"
   - Paper size: Letter or A4
   - Margins: Default
   - Background graphics: On (optional)
3. Save

**Method 2: Browser Menu**
1. Right-click → Print (or Cmd/Ctrl + P)
2. Save as PDF

**Method 3: wkhtmltopdf (CLI)**
```bash
wkhtmltopdf https://resume.blackroad.io resume.pdf
```

## SEO & Metadata

### Meta Tags
- Description, keywords, author
- Open Graph (Facebook, LinkedIn)
- Twitter Card
- Viewport (mobile)

### JSON-LD Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Alexa Louise Amundson",
  "jobTitle": "Founder & Chief Architect",
  "worksFor": {
    "@type": "Organization",
    "name": "BlackRoad OS, Inc."
  }
  // ... full schema included
}
```

**Benefits:**
- Rich snippets in Google search
- Knowledge graph integration
- Better LinkedIn preview

## Customization

### Update Metrics

Edit the metric cards in `index.html`:

```html
<div class="metric-card">
    <h3>Metric Name</h3>
    <div class="metric-value">123</div>
    <div class="metric-label">Description</div>
</div>
```

### Change Colors

Edit CSS variables:
```css
:root {
    --accent-orange: #FF9D00;
    --accent-pink: #FF0066;
    --accent-purple: #7700FF;
    --accent-blue: #0066FF;
}
```

### Add Experience

Copy an existing `.experience-item` and modify:
```html
<div class="experience-item">
    <div class="experience-header">
        <h3>COMPANY NAME</h3>
        <div class="experience-meta">
            <span>👤 Job Title</span>
            <span>📍 Location</span>
            <span>📅 Dates</span>
        </div>
    </div>
    <!-- Add subsections -->
</div>
```

## Mobile Responsiveness

**Breakpoints:**
- Desktop: 1200px max-width container
- Tablet: Grid adjusts to 2 columns
- Mobile (<768px): Single column layout

**Mobile Optimizations:**
- Larger touch targets (buttons)
- Simplified contact info layout
- Stacked action buttons
- Readable font sizes

## Analytics (Optional)

Add Google Analytics:

```html
<!-- Before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Performance

**Lighthouse Scores (Target):**
- Performance: 100
- Accessibility: 100
- Best Practices: 100
- SEO: 100

**Optimizations:**
- Single HTML file (no external dependencies)
- Inline CSS (no render blocking)
- Inline JSON-LD (SEO data)
- Optimized images (none needed)
- Minified HTML (optional)

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Print to PDF (all browsers)

## Security

**CSP Headers (Cloudflare Pages):**

Create `_headers` file in `pages/resume/`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Monitoring

**Cloudflare Analytics:**
- Page views
- Unique visitors
- Geographic distribution
- Referrer sources

**Uptime Monitoring:**
```bash
# Ping test
curl -I https://resume.blackroad.io

# Full test
curl https://resume.blackroad.io | grep "Alexa Louise Amundson"
```

## Troubleshooting

### Resume doesn't load

**Issue:** 404 Not Found

**Fix:**
```bash
# Redeploy
wrangler pages deploy . --project-name=resume-blackroad
```

### Metrics are outdated

**Issue:** Old data showing

**Fix:** Update the HTML file with latest metrics from KPI dashboard

### PDF looks bad

**Issue:** Print stylesheet not working

**Fix:**
- Ensure browser print settings: "Background graphics" ON
- Try different browser (Chrome recommended for PDF)

### Custom domain not working

**Issue:** DNS not resolving

**Fix:**
1. Check Cloudflare DNS settings
2. Verify CNAME record: `resume.blackroad.io` → `resume-blackroad.pages.dev`
3. Wait 5-10 minutes for propagation

## Files

```
pages/resume/
├── index.html          # Main resume page (single file)
├── README.md           # This file
└── _headers            # Optional security headers
```

## Documentation

- **Deployment Script:** [scripts/deploy-resume.sh](../../scripts/deploy-resume.sh)
- **Main Resume (Markdown):** [ALEXA_AMUNDSON_RESUME_2025.md](../../ALEXA_AMUNDSON_RESUME_2025.md)
- **KPI Dashboard:** [kpi.blackroad.io](https://kpi.blackroad.io)

## Support

- **Issues:** https://github.com/BlackRoad-OS/blackroad-os-operator/issues
- **Email:** blackroad.systems@gmail.com

---

**Version:** 1.0.0
**Last Updated:** December 23, 2025
**Status:** Production Ready
**Live URL:** https://resume.blackroad.io
