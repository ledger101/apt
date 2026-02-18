# Firebase Deployment Setup - Quick Start

This guide will help you configure the Firebase service account secret needed for automated deployment.

## Prerequisites

- Access to Firebase Console for project `maze-ace`
- Admin access to this GitHub repository

## Step-by-Step Setup

### 1. Generate Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **maze-ace**
3. Click on the gear icon (⚙️) next to "Project Overview"
4. Select **Project settings**
5. Navigate to the **Service accounts** tab
6. Click **Generate new private key**
7. Click **Generate key** to download the JSON file
8. Save this file securely (you'll need it in the next step)

### 2. Add Secret to GitHub Repository

1. Go to your GitHub repository: `https://github.com/ledger101/apt`
2. Click on **Settings** tab
3. In the left sidebar, expand **Secrets and variables** → click **Actions**
4. Click **New repository secret**
5. Enter the following:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_MAZE_ACE`
   - **Secret**: Paste the entire contents of the JSON file you downloaded in step 1
6. Click **Add secret**

### 3. Verify Setup

After adding the secret:

1. Go to the **Actions** tab in your repository
2. Click on **Build and Deploy to Firebase Hosting** workflow
3. Click **Run workflow** dropdown
4. Select the branch (usually `main` or `master`)
5. Click **Run workflow**
6. Watch the workflow execute - it should:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Build the application
   - ✅ Deploy to Firebase Hosting

### 4. Access Your Deployed Site

Once deployment is successful, your application will be available at:

- **Primary URL**: `https://aptgeotech.web.app`
- **Alternative URL**: `https://aptgeotech.firebaseapp.com`

## Troubleshooting

### "Secret not found" Error

If you see an error about the secret not being found:
- Verify the secret name is exactly: `FIREBASE_SERVICE_ACCOUNT_MAZE_ACE`
- Ensure you have the correct permissions to add secrets
- Try re-adding the secret

### Deployment Fails with Authentication Error

If deployment fails with authentication errors:
- Verify the service account JSON is complete and not truncated
- Ensure you downloaded the correct service account for the `maze-ace` project
- Check that the service account has the necessary permissions in Firebase

### Build Fails

If the build step fails:
- Check the workflow logs for specific errors
- Verify that the code builds successfully locally with `npm run build`
- Ensure all dependencies are properly listed in `package.json`

## Automatic Deployment

Once configured, the workflow will automatically deploy to Firebase whenever you:
- Push changes to the `main` or `master` branch
- Manually trigger the workflow from the Actions tab

## Additional Resources

- [Complete Deployment Documentation](./DEPLOYMENT.md)
- [Firebase Documentation](https://firebase.google.com/docs/hosting)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
