# AI Interview Assistant

Real-time AI-powered interview assistant for Zoom, Teams, Meet, Webex, and Slack. Converts the Chrome extension into a deployable web app.

## Features

- 🎤 **Voice Recognition** — Speak your interview question, AI listens automatically
- ⚡ **Instant AI Answers** — GPT-4o powered answer suggestions in 2-3 seconds
- 📚 **Reference Materials** — Auto-sourced technical docs and articles
- 🔊 **Text-to-Speech** — Read answers aloud to maintain eye contact
- 📊 **Usage Dashboard** — Track your interview practice history
- 🔑 **BYOK** — Bring your own OpenAI API key (we never subsidize)

## Architecture

```
Next.js 14 (App Router)
├── Clerk Authentication (auth middleware)
├── Tailwind CSS (styling)
├── OpenAI API (proxy via /api/analyze)
└── Vercel (deployment)
```

## Getting Started

### 1. Clone & Install

```bash
npm install
```

### 2. Set up Clerk Authentication

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application (choose your auth method)
3. Copy your Publishable Key and Secret Key
4. Create `.env.local`:

```bash
cp .env.local.example .env.local
# Then fill in your Clerk keys:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# CLERK_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
# NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Set Your API Key

1. Sign up / Sign in
2. Go to Settings
3. Enter your OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

> ⚠️ You must bring your own OpenAI API key. We do not subsidize any API costs.

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Set the same environment variables in Vercel Dashboard → Settings → Environment Variables.

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/pricing` | Pricing plans | No |
| `/sign-in` | Sign in | No |
| `/sign-up` | Sign up | No |
| `/dashboard` | Usage stats & history | Yes |
| `/interview` | Core interview practice | Yes |
| `/settings` | API key management | Yes |

## Pricing Tiers

| Feature | Free | Pro ($9/mo) | Business ($29/mo) |
|---------|------|-------------|-------------------|
| Voice recognition | ✓ | ✓ | ✓ |
| AI answer suggestions | ✓ | ✓ | ✓ |
| History limit | 20 | 200 | Unlimited |
| Languages | EN | EN/ZH/JP/KR | All |
| Export reports | — | ✓ | ✓ |
| Team sharing | — | — | ✓ |

## Development

```bash
# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign in page URL |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign up page URL |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after sign in |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after sign up |

## License

MIT
