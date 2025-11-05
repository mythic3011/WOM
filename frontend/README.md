# Frontend Application

## Overview

Modern single-page application (SPA) built with Vite, Vanilla JavaScript, jQuery, and Tailwind CSS for booking orchestral music performance tickets.

## Tech Stack

- **Build Tool**: Vite 7.x
- **JavaScript**: ES6+ Vanilla JS
- **UI Library**: jQuery 3.7.x
- **CSS Framework**: Tailwind CSS 3.4.x
- **Router**: Page.js
- **Icons**: Font Awesome 6.7.x
- **Date Library**: Day.js
- **PDF Generation**: jsPDF
- **Alerts**: SweetAlert2

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

See `/docs/PROJECT_STRUCTURE.md` for detailed structure documentation.

## Key Features

- ✅ Interactive seat selection with zone management
- ✅ Real-time seat availability
- ✅ Multiple payment methods (Card, Alipay, WeChat, PayPal)
- ✅ Ticket and invoice generation (PDF)
- ✅ User profile management
- ✅ Admin dashboard for managing performances, venues, users
- ✅ Responsive design (mobile-first)
- ✅ SEO optimized
- ✅ Dark mode support (coming soon)

## Configuration

### Environment Variables

Create `.env` file in frontend root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Western Orchestral Music Performance
```

### Vite Config

See `vite.config.js` for build and dev server configuration.

### Tailwind Config

See `tailwind.config.js` for design system configuration.

## Development Guidelines

### Code Style

- Use ES6+ features (arrow functions, destructuring, etc.)
- Use `const` and `let`, avoid `var`
- Use async/await for asynchronous operations
- Follow naming conventions (see PROJECT_STRUCTURE.md)
- **NO code comments** - write self-documenting code
- **NO linear gradients** - use solid colors with borders/shadows
- **NO symbols or emojis** in code or console output

### Component Pattern

```javascript
export default {
  title: "Page Title",
  
  async render(params) {
    return `<div>HTML content</div>`;
  },
  
  async afterRender(params) {
    this.attachEventListeners();
  },
  
  attachEventListeners() {
    $(document).on("click", ".btn", () => {
      // Handle click
    });
  }
};
```

### Import Paths

Always use absolute paths with `/src/` prefix:

```javascript
import { ROUTES } from "/src/config/routes.js";
import { storage } from "/src/services/storageService.js";
import { FormComponents } from "/src/components/FormComponents.js";
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with HMR

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Utilities
npm run postinstall     # Copy Font Awesome webfonts
```

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Troubleshooting

### Font Awesome icons not showing

```bash
npm run postinstall
```

### Vite dev server won't start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build fails

```bash
# Check for linting errors
npm run lint

# Clear Vite cache
rm -rf node_modules/.vite
```

## Performance Optimization

- Code splitting by route
- Lazy loading of pages
- Font preloading
- Image optimization
- Minification and tree-shaking

## SEO Features

- Dynamic meta tags
- Open Graph tags
- Twitter Card tags
- Structured data (JSON-LD)
- Canonical URLs
- Sitemap generation (coming soon)

## Deployment

### Docker

```bash
docker build -t wom-frontend .
docker run -p 5173:5173 wom-frontend
```

### Static Hosting

After `npm run build`, deploy the `dist/` directory to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Nginx

## Contributing

1. Create a feature branch
2. Make changes following code style guidelines
3. Test thoroughly
4. Update documentation
5. Submit pull request

## License

Proprietary - EIE4432 Project

## Support

For issues or questions, contact the development team.
