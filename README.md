# AI Productivity Hub 🚀

A modern, highly-interactive productivity hub with a Firebase backend and Gemini AI integration.

## 🌐 Live App Link

Once deployed, **[Click here to open the app (Desktop & Mobile)](https://gurpreetsinghsaini94221.github.io/YOUR_REPOSITORY_NAME/)**

*(Note: Replace `YOUR_REPOSITORY_NAME` in the URL above with the actual name of your GitHub repository)*

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
   - Go to your repository **Settings**.
   - Select **Pages** from the left sidebar.
   - Under **Build and deployment** > **Source**, change from "Deploy from a branch" to **GitHub Actions**.
   - *If your workflow failed previously, re-run it in the **Actions** tab.*
5. Once the workflow finishes successfully, your site will be live at the link above!

## Features

- **Smart Task Prioritization**: Uses Gemini to sequence your tasks based on priority and energy.
- **AI Routine Coach**: Generates motivational nudges and proverbs relative to your mood.
- **Firebase Sync**: Real-time sync across devices.
- **Drag and Drop**: Manage tasks and goals visually.
- **Pomodoro Focus**: Integrated focus timer.
