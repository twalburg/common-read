# Common Read

A group devotional app — read a chapter of the Bible together each day, reflect, and grow in community.

Built with React + Cloudflare Pages + Workers + D1. Uses the API.Bible API for NIV scripture text.

## Features

**Contemplative Practice Prompts** — Before each day's reading, a centering prompt helps you slow down and prepare your heart. Practices drawn from contemplative Christian traditions: breath prayers, Lectio Divina, silence, the Jesus Prayer, and more.

**Daily Rotating Reflection Questions** — Each chapter comes with a unique question to guide your reflection. 31 rotating questions that vary day to day, moving beyond "what stood out to you" to deeper engagement with the text.

**Group Reflections** — Write your reflection and immediately see what others in your group shared. Simple, honest, personal.

**Reading Streaks & Completion Tracking** — See who's reflected today, each member's current streak, and overall group progress through the book. Gentle accountability without gamification.

**Catch-Up Journal** — Scroll through every past chapter and the group's reflections like a journal. The real artifact of the experience — your group's shared journey through Scripture.

**Invite-Code Groups** — Create a group, pick a book, set a start date. Share a simple code with friends. No app store, no social accounts, no noise.

## Quick Start

See [SETUP-GUIDE.md](./SETUP-GUIDE.md) for complete step-by-step instructions.

## Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | React + Vite | — |
| Hosting | Cloudflare Pages | Free |
| API | Cloudflare Workers (Pages Functions) | Free |
| Database | Cloudflare D1 (SQLite) | Free |
| Bible Text | API.Bible (NIV) | Free |
| Code Backup | GitHub | Free |

## Project Structure

```
common-read/
├── functions/              # Cloudflare Pages Functions (API)
│   ├── api/
│   │   ├── auth/           # register, login
│   │   ├── groups/         # CRUD, join, stats, journal
│   │   ├── reflections.js  # GET / POST reflections
│   │   └── bible/          # Scripture proxy
│   └── lib/
│       └── auth.js         # JWT, password hashing
├── src/                    # React frontend
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Groups.jsx
│   │   └── GroupDetail.jsx # Read, Reflect, Journal, Community tabs
│   ├── lib/
│   │   ├── api.js          # API client
│   │   ├── books.js        # Bible book metadata
│   │   └── prompts.js      # Reflection questions + centering prompts
│   ├── styles/app.css
│   ├── App.jsx
│   └── main.jsx
├── schema.sql              # D1 database schema
├── wrangler.toml           # Cloudflare config
└── SETUP-GUIDE.md          # Step-by-step setup instructions
```

## How It Works

**Groups**: Create a group, pick a book, set a start date. One chapter per day. Share the invite code with friends.

**Daily Flow**: Open the app → centering prompt prepares your heart → read the chapter → switch to Reflect → answer the day's question → see what your friends wrote.

**Late Joiners**: Start on today's chapter with the group. Can go back to read and reflect on earlier chapters.

**Journal**: All past chapters and reflections in one scrollable view — your group's shared history through the book.

## Future Ideas

- Multiple books in sequence (finish John → auto-start Romans)
- Push notifications / daily reminders via Cloudflare Cron
- Custom centering prompts and reflection questions per group
- Export journal as PDF keepsake
