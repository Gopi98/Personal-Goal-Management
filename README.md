# AI Productivity Hub 🚀

A modern, highly-interactive productivity hub with a Firebase backend and Gemini AI integration.

## Configuration & Deployment

This project is built using React, Vite, Tailwind CSS, Firebase, and Gemini AI.

### Setting up Environment Variables

When deploying this project to Netlify, Vercel, or GitHub Pages, you **must** configure the following environment variables in your hosting provider's dashboard:

- \`VITE_GEMINI_API_KEY\`: Your Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

**(Firebase config is automatically included via \`firebase-applet-config.json\`)**

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
5. Trigger your first deployment:
   - Go to the **Actions** tab at the top of your GitHub repository.
   - Click on the **"Deploy to GitHub Pages"** workflow.
   - Click the **"Run workflow"** button on the right side.
6. Once the workflow finishes successfully, your site will be live! GitHub will provide the link to your deployed app on the right sidebar of the repo home page (under "Environments" -> "github-pages").

## Running Locally

1. Clone the repository.
2. Run \`npm install\` to install dependencies.
3. Create a \`.env\` file in the root directory and add:
   \`\`\`env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   \`\`\`
4. Run \`npm run dev\` to start the development server.

## Features

- **Smart Task Prioritization**: Uses Gemini to sequence your tasks based on priority and energy.
- **AI Routine Coach**: Generates motivational nudges and proverbs relative to your mood.
- **Firebase Sync**: Real-time sync across devices.
- **Drag and Drop**: Manage tasks and goals visually.
- **Pomodoro Focus**: Integrated focus timer.
