# Scrum Poker

Real-time Scrum Poker voting app.

## Production (one command)

```bash
npm run prod
```

Builds the frontend, installs dependencies, and starts the server on **http://localhost:3001**.

Custom port:

```bash
PORT=8080 npm run prod
```

## Development

Two terminals:

```bash
npm run dev:server    # backend on :3001
npm run dev:client    # frontend on :3000 (Vite with HMR)
```

## Features

- Room creation via URL — share link to invite
- Fibonacci cards: 1, 2, 3, 5, 8, 13, 21, ?
- Admin reveals cards, starts new rounds, kicks participants
- Spectator mode (toggle in avatar menu)
- Confetti on unanimous vote
- Auto-reconnect with session recovery
- Polish / English (auto-detected from browser locale)
