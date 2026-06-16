# Veritas Cat — Chrome Extension

A cute pixel cat wearing headphones that lives on your screen and helps detect LLM hallucinations. Like BonziBuddy, but for AI safety.

## Features

- **Desktop Pet** — Pixel-art cat floats on any webpage, drag it anywhere
- **Hallucination Checker** — Select text → Right-click → "Check for Hallucinations"
- **Smart Speech** — Tips, warnings, and sassy comments about factual accuracy
- **Animated** — Blinks, ear wiggles, breathing animation, state machine (idle/listening/thinking/talking)
- **Veritas AI Integration** — Connects to the Veritas backend for real analysis

## How to Use

### Load in Chrome
1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this folder: `extension/`

### Features
- **Right-click text** → "Check for Hallucinations" → cat analyzes it
- **Drag** the cat anywhere on screen
- **Click extension icon** → popup with text verification
- **Watch** the cat's state (idle → 🎧 listening → 🤔 thinking → 💬 talking)

## Files

```
extension/
├── manifest.json          # Chrome extension manifest v3
├── background.js          # Service worker (API calls, context menus)
├── icons/                 # Pixel cat icons (16/32/48/128)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── pet/
│   ├── inject.js          # Content script (desktop pet behavior)
│   └── pet.css            # Pet styles (speech bubble, status bar)
└── popup/
    ├── popup.html         # Extension popup
    ├── popup.css          # Popup styles
    └── popup.js           # Popup logic
```
