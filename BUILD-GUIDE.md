# Build Guide - SAM'S PS Gaming Center (Web App)

## Quick Build Commands

\`\`\`bash
# Standard build
npm run build

# Production build with cleanup
npm run build:prod

# Full web build with detailed output
npm run build:web
\`\`\`

## Build Output

The build creates a `dist/` folder containing:
- `index.html` - Main application entry point
- `assets/` - Optimized CSS and JS bundles
- Static assets (icons, manifest, etc.)

## Deployment

1. **Build the application:**
   \`\`\`bash
   npm run build:web
   \`\`\`

2. **Deploy the `dist/` folder** to your web server or hosting platform

3. **Test locally:**
   \`\`\`bash
   npm run preview
   # or
   npm run serve
   \`\`\`

## Build Features

- ✅ TypeScript compilation
- ✅ Vite bundling and optimization
- ✅ CSS minification
- ✅ Asset optimization
- ✅ Code splitting
- ✅ Production environment variables

## File Sizes

- Total bundle size: ~620 KB
- Gzipped: ~170 KB
- Main chunks:
  - Vendor (React/React-DOM): ~140 KB
  - UI Components: ~40 KB
  - Application code: ~364 KB

The build warnings about dynamic imports are normal and don't affect functionality.
