# Selection Assistant — Obsidian Plugin

Select text in Obsidian and a floating toolbar appears with quick actions: translate, copy, search, and custom LLM-powered skills.

## Features

- **Floating toolbar** — Apple-style, appears near your selection
- **Built-in actions** — Translate (Google Translate API), Copy, Search (Google/Bing)
- **Custom skills** — Up to 5 LLM-powered actions with your own prompts
- **LLM config** — Bring your own provider (DeepSeek, Anthropic, OpenRouter, etc.)
- **Right-click menu** — Copy, Paste, Cut with one click
- **Toolbar ordering** — Reorder buttons in settings, overflow goes to "⋯" menu
- **Dark mode** — Adapts to Obsidian's theme automatically

## Quickstart

```bash
# Clone into your vault's plugins folder
cd YOUR_VAULT/.obsidian/plugins
git clone https://github.com/veritasian/selection-assistant.git
```

Then enable it in Obsidian: Settings → Community Plugins → Selection Assistant.

### LLM Setup

1. Settings → Selection Assistant → LLM Configuration
2. Fill in: Provider name, API Host, API Key
3. Click **Fetch Models** to list available models
4. Pick a model, set max tokens
5. Go to Custom Skills tab, define your skills with `{{text}}` placeholder

### Example skill prompts

```
Explain:     "Explain the following in simple terms:\n\n{{text}}"
Summarize:   "Summarize this in 3 bullet points:\n\n{{text}}"
Improve:     "Improve the writing, keep the same meaning:\n\n{{text}}"
Translate:   "Translate to French:\n\n{{text}}"
Code Review: "Review this code and suggest improvements:\n\n{{text}}"
```

## How it works

```
Select text ──→ Toolbar pops up near cursor
                 │
                 ├── 📖 Translate → Google Translate API
                 ├── 📋 Copy      → Clipboard
                 ├── 🔍 Search    → Browser (Google/Bing)
                 ├── ⚡ Custom 1  → LLM
                 └── ⚡ Custom 2  → LLM
                 ⋯  (more in overflow)
```

## Settings

| Tab | What |
|---|---|
| General | Search engine, translate target language, toolbar size |
| LLM | Provider, API host, API key, model, max tokens |
| Custom Skills | Add/edit/delete skills with name, icon, prompt |
| Toolbar Order | Reorder buttons with ↑↓ |

## Requirements

- Obsidian v1.0.0+
- LLM provider (any Anthropic-compatible API) for custom skills
