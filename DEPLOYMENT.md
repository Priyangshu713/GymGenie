# 🚀 Vercel Deployment Guide for GymGenie

This guide will help you deploy GymGenie to Vercel with optimal performance and configuration.

## 📋 Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [GitHub Repository](https://github.com/Priyangshu713/GymGenie) (already set up)
- [Gemini AI API Key](https://makersuite.google.com/app/apikey)

## 🎯 Quick Deploy

### Option 1: Deploy Button (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPriyangshu713%2FGymGenie&env=VITE_GEMINI_API_KEY&envDescription=Gemini%20AI%20API%20Key%20for%20workout%20analysis&envLink=https%3A%2F%2Fmakersuite.google.com%2Fapp%2Fapikey&project-name=gymgenie&repository-name=GymGenie)

### Option 2: Manual Deployment

1. **Connect Repository**
   ```bash
   # Go to Vercel Dashboard
   # Click "New Project"
   # Import from GitHub: Priyangshu713/GymGenie
   ```

2. **Configure Build Settings**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

3. **Environment Variables**
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

## ⚙️ Configuration Files

### `vercel.json`
- **Routes:** SPA routing configuration
- **Headers:** Security headers and caching
- **Build:** Production optimization settings

### `.vercelignore`
- Excludes unnecessary files from deployment
- Reduces bundle size and deployment time

### `vite.config.production.js`
- Production-optimized Vite configuration
- PWA settings and caching strategies
- Code splitting and minification

## 🔐 Environment Variables Setup

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_GEMINI_API_KEY` | Gemini AI API key for workout analysis | `AIzaSyC...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | `GymGenie` |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `30000` |
| `VITE_ENABLE_PWA` | Enable PWA features | `true` |

### Setting Environment Variables

1. **Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_GEMINI_API_KEY` with your API key
   - Set for Production, Preview, and Development

2. **Vercel CLI:**
   ```bash
   vercel env add VITE_GEMINI_API_KEY
   # Enter your API key when prompted
   ```

## 🏗️ Build Optimization

### Automatic Optimizations

- **Code Splitting:** Vendor, charts, AI, and utils chunks
- **Minification:** Terser with console/debugger removal
- **Caching:** Static assets with long-term caching
- **PWA:** Service worker with offline support

### Performance Features

- **Lazy Loading:** Route-based code splitting
- **Image Optimization:** Automatic WebP conversion
- **Font Optimization:** Google Fonts caching
- **API Caching:** Gemini AI response caching (5 minutes)

## 🔧 Custom Domains

### Adding Custom Domain

1. **Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records as shown

2. **DNS Configuration:**
   ```
   Type: CNAME
   Name: www (or @)
   Value: cname.vercel-dns.com
   ```

### SSL Certificate
- Automatically provisioned by Vercel
- Includes www and apex domain
- Auto-renewal enabled

## 📊 Analytics & Monitoring

### Vercel Analytics
```bash
# Enable in Vercel Dashboard
# Project Settings → Analytics → Enable
```

### Performance Monitoring
- **Core Web Vitals:** Automatic tracking
- **Real User Monitoring:** Built-in metrics
- **Error Tracking:** Automatic error reporting

## 🚀 Deployment Process

### Automatic Deployments

1. **Production:** Push to `main` branch
2. **Preview:** Push to any branch or PR
3. **Development:** Local development with `vercel dev`

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🔍 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel Dashboard
# Common fixes:
npm run build  # Test locally first
```

#### Environment Variables Not Working
```bash
# Ensure variables start with VITE_
# Redeploy after adding variables
```

#### PWA Not Installing
```bash
# Check manifest.json is accessible
# Verify HTTPS is enabled
# Clear browser cache
```

### Performance Issues

#### Slow Loading
- Check bundle size in build output
- Verify code splitting is working
- Enable compression in Vercel

#### API Timeouts
- Increase `VITE_API_TIMEOUT`
- Check Gemini AI quota limits
- Verify API key permissions

## 📈 Post-Deployment Checklist

### ✅ Functionality Tests
- [ ] App loads correctly
- [ ] Navigation works
- [ ] AI features functional
- [ ] PWA installable
- [ ] Mobile responsive

### ✅ Performance Tests
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1

### ✅ Security Tests
- [ ] HTTPS enabled
- [ ] Security headers present
- [ ] No console errors
- [ ] API keys not exposed

## 🎉 Success!

Your GymGenie app should now be live on Vercel with:

- ⚡ **Fast Loading:** Optimized builds and caching
- 🔒 **Secure:** HTTPS and security headers
- 📱 **PWA Ready:** Installable on mobile devices
- 🤖 **AI Powered:** Gemini AI integration working
- 🌍 **Global CDN:** Fast worldwide access

## 📞 Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **GitHub Issues:** [Report Issues](https://github.com/Priyangshu713/GymGenie/issues)
- **Vercel Support:** [vercel.com/support](https://vercel.com/support)

---

**🎯 Your GymGenie app is now production-ready on Vercel!**
