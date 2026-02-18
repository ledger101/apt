# Deployment Guide

## Overview
This project is configured to build and deploy to Firebase Hosting on the `aptgeotech` site.

## Prerequisites
- Node.js 20.x or later
- npm
- Firebase CLI (installed as dev dependency)
- Firebase service account credentials (for CI/CD)

## Local Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application
```bash
npm run build:prod
```
This builds the Angular application in production mode with optimizations.

### 3. Deploy to Firebase
```bash
npm run deploy
```
This will build the app and deploy it to the `aptgeotech` Firebase hosting site.

**Note:** You need to be authenticated with Firebase CLI. Run `npx firebase login` if not already logged in.

## CI/CD Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the application when changes are pushed to the `main` branch.

### Required Secrets
Configure the following secrets in your GitHub repository settings:
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON key for authentication

### Workflow Triggers
- **Automatic:** Pushes to the `main` branch
- **Manual:** Via workflow_dispatch in GitHub Actions UI

## Firebase Configuration

The deployment is configured in `firebase.json`:
- **Project:** maze-ace
- **Hosting Site:** aptgeotech
- **Build Output:** dist/aptapp/browser
- **SPA Routing:** Configured with rewrites to support Angular routing

## Build Scripts

Available npm scripts:
- `npm run build` - Standard build
- `npm run build:prod` - Production build with optimizations
- `npm run deploy` - Build and deploy to Firebase
- `npm start` - Local development server

## Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be 20.x or later)
- Clear cache: `rm -rf node_modules dist && npm install`

### Deployment Fails
- Verify Firebase CLI authentication: `npx firebase login`
- Check Firebase project access: `npx firebase projects:list`
- Ensure correct project is configured in `.firebaserc`

### GitHub Actions Fails
- Verify `FIREBASE_SERVICE_ACCOUNT` secret is configured
- Check workflow logs in GitHub Actions tab
- Ensure the service account has necessary permissions

## Manual Deployment Steps

If you need to deploy manually without using npm scripts:

```bash
# Build the application
ng build --configuration production

# Deploy to Firebase (specific site)
firebase deploy --only hosting:aptgeotech
```

## Additional Resources
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Angular Build Documentation](https://angular.dev/tools/cli/build)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
