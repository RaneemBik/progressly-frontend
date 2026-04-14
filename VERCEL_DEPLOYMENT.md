# Progressly Frontend - Deployment Guide

## Deployment to GitHub Pages or Vercel

This guide covers both static GitHub Pages deployment and Vercel deployment (recommended).

### Option 1: Vercel Deployment (Recommended)

#### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected
- GitHub personal access token

#### Deployment Steps

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import GitHub repository (progressly-frontend)
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Environment Variables**:
     - `VITE_API_URL`: `https://progressly-backend.onrender.com/api`

5. Click "Deploy"

#### Environment Variables for Vercel

Add in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://progressly-backend.onrender.com/api
```

#### Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Option 2: GitHub Pages Deployment

#### Prerequisites
- GitHub repository
- GitHub Actions enabled

#### Setup

1. Update `vite.config.ts` to set base path:

```typescript
export default defineConfig({
  base: '/progressly-frontend/',
  // ... rest of config
})
```

2. Create GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. Enable GitHub Pages in repository settings

### Environment Variables

Frontend uses environment variables via `import.meta.env`:

```typescript
// Access in code:
const API_URL = import.meta.env.VITE_API_URL;
```

### Building Locally

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update with your API URL
# VITE_API_URL=http://localhost:3001

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Connecting to Backend

In production, the frontend will connect to:

```
https://progressly-backend.onrender.com/api
```

Update `VITE_API_URL` environment variable on Vercel/GitHub Pages.

### Development Workflow

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Update `VITE_API_URL=http://localhost:3001`
4. Run `npm install && npm run dev`
5. Open http://localhost:5173

### Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Backend API URL available
- [ ] Frontend `.env` configured with backend URL
- [ ] Build completes without errors
- [ ] API calls work from frontend
- [ ] Authentication flows work
- [ ] Email links work (if applicable)

### Performance Optimization

- Build output optimization is automatic with Vite
- Images should be optimized before committing
- Use lazy loading for large components

### Troubleshooting

- **CORS errors**: Ensure FRONTEND_URL on backend matches frontend domain
- **API 404 errors**: Check VITE_API_URL environment variable
- **Build fails**: Run `npm run build` locally to debug
- **White screen**: Check browser console for errors

### Security Notes

- Never commit `.env` files with real API keys
- Use environment variables for all sensitive data
- Backend should have CORS configured for your frontend domain
