# FitTrack - Workout Analyzer (Browser-Only Version)

This is a browser-based workout analysis application that allows users to upload their workout data (exported from the "Strong" app in CSV format) and view statistics, analytics, and AI-powered workout suggestions. All data is stored locally in the browser's `localStorage`.

## Features

* **CSV Upload:** Upload workout data from "Strong" app exports.
* **Data Parsing:** Processes CSV data into a structured format.
* **Local Storage:** All workout data is saved in the browser's `localStorage`. No external database is needed.
* **Dashboard:**
    * Summary statistics (total workouts, unique exercises, last workout, average duration).
    * Personal Record (PR) display for top e1RM.
    * Muscle group frequency chart.
    * "Time 'Til Gains" estimation.
    * List of recent workouts with search functionality.
* **Analytics:**
    * Workouts per month chart.
    * Total volume per workout chart.
    * Exercise frequency chart.
    * Detailed progress charts for individual exercises (Max Weight, e1RM, Total Volume).
* **AI Workout Suggestions:**
    * Generates workout suggestions using the Gemini API.
    * Considers recent workout history, PRs, muscle groups worked, available machines (from user history), and planned next workout date.
* **Imperial Units:** All weights are assumed and displayed in pounds (lbs).
* **Responsive UI:** Designed with Tailwind CSS for a modern look on desktop and mobile.

## Tech Stack

* React
* Vite (for development and build)
* Tailwind CSS (via CDN)
* Recharts (for charts)
* Lucide React (for icons)
* Gemini API (for AI workout suggestions)

## Project Structure

```
/public
  vite.svg (or your favicon)
/src
  App.jsx       (Main application component)
  main.jsx      (React entry point)
  index.css     (Optional: for global styles if not using CDN for everything)
index.html      (Main HTML file)
package.json    (Project dependencies and scripts)
vite.config.js  (Vite configuration - often defaults are fine)
README.md       (This file)
```

## Setup and Running Locally

1.  **Clone the repository (or create the files as provided).**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Google AI API Key for Workout Suggestions:**
    * The AI workout suggestions feature uses the Google Gemini API.
    * You need to obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    * In `src/App.jsx`, find the line: `const apiKey = "";` (around line 400).
    * Replace the empty string with your actual Google AI API key: `const apiKey = "YOUR_GOOGLE_AI_API_KEY";`
    * **IMPORTANT:** Do NOT commit your API key to a public repository. For deployment, use environment variables.
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will usually start the app on `http://localhost:5173`.

## Building for Production

```bash
npm run build
```
This command will create a `dist` folder with the optimized static assets for your application.

## Deployment to Vercel (or similar platforms)

1.  **Push your code to a GitHub (or GitLab/Bitbucket) repository.**
2.  **Sign up or log in to [Vercel](https://vercel.com).**
3.  **Create a new project and connect it to your repository.**
4.  **Configure Build Settings (Vercel usually auto-detects Vite):**
    * Framework Preset: Vite
    * Build Command: `npm run build` (or `vite build`)
    * Output Directory: `dist`
5.  **Environment Variables (Crucial for API Key):**
    * In your Vercel project settings, add an Environment Variable for your Google AI API Key.
    * Name: `VITE_GEMINI_API_KEY` (or any name you prefer, but `VITE_` prefix is standard for Vite to expose it to client-side code).
    * Value: Your actual Google AI API key.
    * Then, in `src/App.jsx`, modify the API key line to use this environment variable:
        ```javascript
        // const apiKey = "YOUR_GOOGLE_AI_API_KEY"; // Old way
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
        ```
        This ensures your key is not hardcoded in the client-side bundle.
6.  **Deploy!**

## Notes on `localStorage`

* Data is stored directly in the user's browser. If the user clears their browser data for this site, the workout history will be lost.
* `localStorage` has a storage limit (typically 5-10MB per origin). For very extensive workout histories over many years, this limit could eventually be reached. For larger-scale or more robust storage, `IndexedDB` would be a better browser-based solution, or a proper backend database if you decide to scale beyond a purely client-side app.

## Favicon

The `index.html` references `/vite.svg`. You should replace this with your own favicon (e.g., `dumbbell.svg` or `favicon.ico`) in the `/public` directory and update the link in `index.html` accordingly.
