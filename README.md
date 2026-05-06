# AI Productivity Hub 🚀

A modern, highly-interactive productivity hub with a Firebase backend and Gemini AI integration.

## Configuration & Deployment

This project is built using React, Vite, Tailwind CSS, Firebase, and Gemini AI.

### Setting up Environment Variables

When deploying this project to Netlify, Vercel, or GitHub Pages, you **must** configure the following environment variables in your hosting provider's dashboard:

- \`VITE_GEMINI_API_KEY\`: Your Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

**(Firebase config is automatically included via \`firebase-applet-config.json\`)**

### 1-Click Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME)

***Note**: Before clicking, make sure you push this code to a public GitHub repository, then replace \`YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME\` in the URL above with your actual repository details.*

### Manual Deployment via GitHub + Netlify

1. **Export the app** from AI Studio (Settings > Export as ZIP / Export to GitHub).
2. **Push to GitHub** (if you exported as a ZIP).
3. Go to [Netlify](https://app.netlify.com/) and click **Add New Site** > **Import an existing project**.
4. Connect your GitHub account and select this repository.
5. In the **Build Settings**:
   - **Base directory:** (leave empty)
   - **Build command:** \`npm run build\`
   - **Publish directory:** \`dist\`
6. Click **Advanced build settings** > **New variable**:
   - Key: \`VITE_GEMINI_API_KEY\`
   - Value: *(Your Gemini API Key)*
7. Click **Deploy**.

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
