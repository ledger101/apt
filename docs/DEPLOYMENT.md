# Firebase Deployment Guide

This document describes how to build and deploy the APT application to Firebase Hosting.

> **Quick Start**: For first-time setup, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for step-by-step instructions on configuring the Firebase service account.

## Overview

The APT application is an Angular-based web application that is deployed to Firebase Hosting on the site `aptgeotech`.

## Automated Deployment via GitHub Actions

### Setup

The repository includes a GitHub Actions workflow (`.github/workflows/firebase-deploy.yml`) that automatically builds and deploys the application when changes are pushed to the `main` or `master` branch.

#### Prerequisites

To enable automated deployment, you need to configure a Firebase service account secret. See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed setup instructions.

Quick summary:
1. Generate a Firebase service account key from the Firebase Console
2. Add it as a GitHub repository secret named `FIREBASE_SERVICE_ACCOUNT_MAZE_ACE`

### Triggering Deployment

The workflow can be triggered in two ways:

1. **Automatic**: Push changes to the `main` or `master` branch
2. **Manual**: Go to Actions tab in GitHub, select "Build and Deploy to Firebase Hosting" workflow, and click "Run workflow"

### Workflow Steps

The automated workflow performs the following steps:

1. Checks out the code
2. Sets up Node.js (v20)
3. Installs dependencies with `npm ci`
4. Builds the Angular application with `npm run build`
5. Deploys to Firebase Hosting site `aptgeotech`

## Manual Deployment

If you need to deploy manually from your local machine:

### Prerequisites

- Node.js (v20 or later)
- Firebase CLI: `npm install -g firebase-tools`
- Firebase authentication: `firebase login`

### Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting:aptgeotech
   ```

## Configuration

### Firebase Configuration

The Firebase configuration is defined in the following files:

- `.firebaserc`: Defines the Firebase project (`maze-ace`)
- `firebase.json`: Defines hosting configuration
  - Site: `aptgeotech`
  - Public directory: `dist/aptapp/browser`
  - Single-page app routing enabled

### Build Configuration

The Angular build configuration is defined in:

- `angular.json`: Defines build settings and output directory
- `package.json`: Defines build scripts

## Verification

After deployment, you can verify the application at:
- Production URL: `https://aptgeotech.web.app` or `https://aptgeotech.firebaseapp.com`

## Troubleshooting

### Build Failures

If the build fails, check:
- Node.js version compatibility
- Dependency installation issues
- TypeScript errors in the code

### Deployment Failures

If deployment fails, verify:
- Firebase service account secret is correctly configured
- Firebase project exists and is accessible
- Site `aptgeotech` is configured in the Firebase project

### Common Issues

1. **"Unable to fetch remote config"**: This warning can be ignored if not behind a firewall
2. **"Failed to authenticate"**: Run `firebase login` or ensure the service account secret is configured
3. **Build size warnings**: The app has budget limits configured in `angular.json` (max 4MB initial bundle)
