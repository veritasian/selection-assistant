# Ai Selection Assistant — Smart Floating Toolbar for Obsidian

> Drag-select any text in Obsidian and a sleek floating toolbar appears. Translate, copy, search, or run custom LLM prompts — all without leaving your note.

[![GitHub stars](https://img.shields.io/github/stars/veritasian/selection-assistant?style=flat)](https://github.com/veritasian/selection-assistant)
[![license](https://img.shields.io/github/license/veritasian/selection-assistant?style=flat)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-%237C3AED?logo=obsidian)](https://obsidian.md)

[中文说明](README-zh.md)

## Why Selection Assistant

Obsidian is a powerful writing tool, but switching between apps to translate, search, or process text breaks your flow. Selection Assistant puts everything right next to your cursor — just drag, click, done.

Each button shows the **first letter of its name in a white circle**. Native to Obsidian, adapts to light/dark theme automatically.

## Features

- **Drag-select to trigger** — no clicking, no double-clicking. Only appears when you intentionally select text
- **Translate** — Google Translate API, auto-detect → your target language
- **Copy & Search** — one-click copy to clipboard or open in Google/Bing
- **Custom LLM skills** — up to 5 skills powered by your own AI provider
- **Provider presets** — DeepSeek, OpenRouter, Ollama, or custom endpoint
- **Fetch & test** — pull model list from API, test connection before saving
- **Reorderable toolbar** — visible buttons + "⋯" overflow menu
- **Right-click menu** — Copy, Paste, Cut in context menu
- **Dark mode** — inherits Obsidian theme colors

## Quickstart

```bash
cd YOUR_VAULT/.obsidian/plugins
git clone https://github.com/veritasian/selection-assistant.git
```

Restart Obsidian. Settings → Community Plugins → Enable **Selection Assistant**.

Open any note, drag-select some text. The toolbar pops up.

## Settings

| Section | What you configure |
|---|---|
| **General** | Search engine (Google/Bing), translate target language (zh/en/ja/fr...), max visible buttons |
| **LLM** | Provider dropdown (DeepSeek/OpenRouter/Ollama/Custom), API host, API key, fetch models, save & test |
| **Custom Skills** | Add up to 5 skills: English name + prompt with `{{text}}` placeholder. First letter becomes the icon |
| **Toolbar Order** | ↑↓ to arrange button sequence |

## How it works

```
User drag-selects text
        │
        ▼
┌──────────────────────────────────┐
│  Ⓣ  Ⓒ   Ⓢ   Ⓔ   Ⓢ   Ⓘ   ⋯    │  ← toolbar
│  Tr  Cp  Sr  Ex  Su  Im  more   │
└──────────────────────────────────┘
   │    │    │    │──────┘──────┘
   ▼    ▼    ▼    ▼
 Google Clip Browser LLM
```

## Built-in actions

| Action | Technology | No setup needed |
|---|---|---|
| Translate | `translate.googleapis.com` | ✅ |
| Copy | `navigator.clipboard` | ✅ |
| Search | Opens `google.com` or `bing.com` | ✅ |

## Custom skills (LLM)

Bring your own API key. Supports any OpenAI-compatible endpoint (`/v1/chat/completions`).

**Supported providers out of the box:**

| Provider | Endpoint | Default model |
|---|---|---|
| DeepSeek | `api.deepseek.com/v1` | `deepseek-chat` |
| OpenRouter | `openrouter.ai/api/v1` | `openai/gpt-5.2` |
| Ollama | `localhost:11434/v1` | `llama3.2` |

**Example prompts:**

```
Explain:    "Explain in simple terms:\n\n{{text}}"
Summarize:  "Summarize in 3 bullet points:\n\n{{text}}"
Polish:     "Improve the writing, keep the same meaning:\n\n{{text}}"
Translate:  "Translate to French:\n\n{{text}}"
Review:     "Review and suggest improvements:\n\n{{text}}"
```

## Requirements

- Obsidian **v1.0.0+**
- Internet connection (for Translation and LLM features)
- API key from your chosen provider (for Custom Skills)

## License

[MIT](LICENSE) © veritasian
