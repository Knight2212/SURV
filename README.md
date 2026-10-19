# SURV — Real-Time Interactive Audience Engagement Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Knight2212/SURV)
![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8?logo=tailwindcss)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-purple?logo=framer)
![License](https://img.shields.io/badge/License-MIT-emerald)

> **SURV** is a modern, real-time audience engagement platform inspired by Vevox and Slido. Built with **Next.js 16**, **Tailwind CSS v4**, **Supabase Realtime**, **Framer Motion**, and **Google Gemini AI**.
> 
> 100% free to develop, run, and host on generous free tiers.

---

## ⚡ Instant Vercel Deployment

Deploy SURV directly to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Knight2212/SURV)

### Environment Variables on Vercel (Optional)
When importing into Vercel, you can configure these environment variables:

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API Key for AI quiz & poll generation | *Intelligent offline generator fallback* |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | *Local BroadcastChannel / WebSockets fallback* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | *Local store fallback* |

---

## 🚀 Key Features

### 1. Three Dedicated Experiences
- **Participant Mobile Web App (`/app/[pin]`)**: Frictionless zero-install web application for mobile and desktop. Instant voting, word clouds, 1-5 star ratings, anonymous Q&A submission, and self-paced surveys.
- **Presenter Projector HUD (`/present/[pin]`)**: High-contrast stage projection display with dynamic joining instructions, high-resolution QR codes, keyboard shortcuts (`Space`, `Arrows`, `C`, `R`, `F`), and animated leaderboards.
- **Host Command Center (`/host/[pin]`)**: Orchestration dashboard for launching polls, locking voting, revealing results, moderating audience questions, and batch generating quizzes with Gemini AI.

### 2. Google Gemini AI Quiz & Poll Generator
- Generate quizzes with timed challenges, correct answers, and word clouds in seconds.
- Built-in preview, question selection, and 1-click batch import directly into the live room.
- Includes an intelligent offline fallback when an API key is not yet configured.

### 3. Dynamic Real-Time Visualizers
- **Live Bar Charts**: Spring progress fills, leading badge indicators, and correct answer reveal styling.
- **Dynamic Word Clouds**: Clustered multi-color tags with fluid scaling based on audience submission frequency.
- **Rating Scales**: 1–5 star distribution visualizer with average score cards.
- **Quiz Leaderboard**: Podium for top-3 participants with animated canvas confetti.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16.4.2 (App Router & Turbopack)](https://nextjs.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: [Plus Jakarta Sans & JetBrains Mono (`next/font/google`)](https://fonts.google.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Real-Time Data**: [Supabase Realtime](https://supabase.com/) & Web BroadcastChannel fallback
- **Generative AI**: [Google Gemini AI](https://ai.google.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 💻 Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/Knight2212/SURV.git
cd SURV
npm install
```

Copy the environment example template:

```bash
cp .env.local.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Production Build

Verify the production build locally:

```bash
npm run build
npm run start
```

---

## 📄 License

MIT License &copy; 2026 SURV Interactive. Built for educators, speakers, and teams worldwide.
