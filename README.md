# AI Productivity Hub 🚀

A modern, highly-interactive productivity hub with a Firebase backend and Gemini AI integration.

## 🌐 Live App Link

Once deployed, **[Click here to open the app (Desktop & Mobile)](https://Gopi98.github.io/Personal-Goal-Management/)**


## Configuration & Deployment

This project is built using React, Vite, Tailwind CSS, Firebase, and Gemini AI.

### Deployment via GitHub Pages (Free & Automatic)

This repository includes a GitHub Actions workflow that automatically builds and deploys your site to GitHub Pages whenever you push to the `main` branch.

**Steps to deploy from GitHub:**

1. **Export the app** from AI Studio: Go to Settings (gear icon) > **Export to GitHub**.
2. Go to your newly created GitHub repository.
3. Add your Gemini API Key so it works in production:
   - Go to your repository **Settings**.
   - Navigate to **Secrets and variables** > **Actions** (under the "Security" section on the left sidebar).
   - Click the **New repository secret** button.
   - For **Name**, enter: `VITE_GEMINI_API_KEY`
   - For **Secret**, paste your actual Gemini API Key.
   - Click **Add secret**.
4. Enable GitHub Pages to use GitHub Actions:
   - **CRITICAL: Ensure your repository is Public.** GitHub Pages is only free for public repositories. Go to **Settings** > **General** > Scroll down to the **Danger Zone** > Click **Change visibility** > Change to **Public**.
   - Go to your repository **Settings**.
   - Select **Pages** from the left sidebar.
   - Under **Build and deployment** > **Source**, change from "Deploy from a branch" to **GitHub Actions**.
   - *If your workflow failed previously, re-run it in the **Actions** tab.*
5. Once the workflow finishes successfully, your site will be live at the link above!

### Whitelisting Domain for Firebase Authentication

If you try to sign in on your deployed app and it doesn't work, you need to whitelist your GitHub Pages domain in your Firebase project. This is a security feature of Firebase.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. In the left sidebar, click on **Authentication**.
4. Go to the **Settings** tab.
5. Click on **Authorized domains** in the left menu.
6. Click the **Add domain** button.
7. Enter exactly: `Gopi98.github.io` *(Do not include https:// or the repository path)*
8. Click **Add**.

Once added, refresh your GitHub Pages app, and the Google Sign-in will work!

## Features

- **Smart Task Prioritization**: Uses Gemini to sequence your tasks based on priority and energy.
- **AI Routine Coach**: Generates motivational nudges and proverbs relative to your mood.
- **Firebase Sync**: Real-time sync across devices.
- **Drag and Drop**: Manage tasks and goals visually.
- **Pomodoro Focus**: Integrated focus timer.
