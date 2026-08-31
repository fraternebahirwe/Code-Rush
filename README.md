# CodeRush — Developer Challenge

A polished React mini-game collection for practicing developer skills.

## Included modes

- **Code Quiz** — timed questions on JavaScript, React, CSS, Git, HTTP and databases.
- **Bug Hunter** — identify the correct fix for short code bugs.
- **Code Sprint** — type snippets quickly and get a WPM-based score.
- **Memory Stack** — memorize and rebuild technical sequences.

## Features

- Difficulty levels: Easy / Normal / Hard
- Score, lives, streak and accuracy system
- Timed rounds
- Local high-score leaderboard
- LocalStorage persistence
- Responsive dark UI
- Keyboard shortcuts for quiz and bug-hunter answers
- Settings for timer visibility and sound preference

## Run locally

Requirements: a recent Node.js version.

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Production build

```bash
npm run build
npm run preview
```

## Project structure

```text
CodeRush/
├── index.html
├── package.json
├── README.md
└── src/
    ├── main.jsx
    └── styles.css
```

## Notes

The app uses browser `localStorage`, so each browser keeps its own saved scores and settings. There is no backend or account system in this version.

### Audio
Sound effects are generated in the browser with the Web Audio API, so the project does not depend on external audio files. The game unlocks audio from the Play action to comply with browser autoplay restrictions. You can enable or disable sound from Settings.
# Code-Rush
