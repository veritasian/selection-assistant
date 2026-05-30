# AI Selection Assistant — Obsidian 智能划词工具栏

> 在 Obsidian 中划选文字，精致浮动工具栏出现在光标旁。翻译、复制、搜索、自定义 LLM 技能——无需离开笔记。

[![GitHub stars](https://img.shields.io/github/stars/veritasian/selection-assistant?style=flat)](https://github.com/veritasian/selection-assistant)
[![license](https://img.shields.io/github/license/veritasian/selection-assistant?style=flat)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-插件-%237C3AED?logo=obsidian)](https://obsidian.md)

[English](README.md)



<img width="1592" height="696" alt="Screenshot 2026-05-31 at 07-55-42" src="https://github.com/user-attachments/assets/45b79d0b-f457-4be1-bf1b-a8e212dfb74d" />




## 为什么需要 Selection Assistant

Obsidian 是强大的写作工具，但频繁在不同应用间切换来翻译、搜索、处理文字会打断思绪。Selection Assistant 将一切操作放在光标旁——划词、点击、完成。
灵感来源于豆包划词助手和popclik,数据不外泄,自定义任何自己想要的结果. 

每个按钮以**白色圆圈内显示技能名称首字母**作为图标。风格原生适配 Obsidian，自动跟随浅色/深色主题。

## 功能特性

- **划词触发** — 不响应单击、双击，只有主动拖选文字才弹出
- **翻译** — Google 翻译 API，自动检测语言 → 目标语言
- **复制与搜索** — 一键复制到剪贴板或打开 Google/Bing 搜索
- **自定义 LLM 技能** — 最多 5 个，由你配置的 AI 服务驱动
- **提供商预设** — DeepSeek、OpenRouter、Ollama 或自定义
- **拉取与测试** — 从 API 获取模型列表，保存前验证连接
- **可排序工具栏** — 显示前 N 个按钮，"⋯" 展开更多
- **右键菜单** — 复制、粘贴、剪切
- **暗色模式** — 自动适配 Obsidian 主题

## 快速开始

```bash
cd 你的笔记仓库/.obsidian/plugins
git clone https://github.com/veritasian/selection-assistant.git
```

重启 Obsidian。设置 → 第三方插件 → 启用 **Selection Assistant**。

打开任意笔记，拖选文字。工具栏随之出现。

## 设置面板

| 分类 | 配置内容 |
|---|---|
| **常规** | 搜索引擎（Google/Bing）、翻译目标语言（zh/en/ja/fr...）、最大可见按钮数 |
| **LLM 配置** | 提供商下拉（DeepSeek/OpenRouter/Ollama/自定义）、API 地址、API Key、拉取模型、保存并测试 |
| **自定义技能** | 最多 5 个：英文名称 + 带 `{{text}}` 占位符的提示词。名称首字母即为图标 |
| **工具栏排序** | ↑↓ 调整按钮展示顺序 |

## 工作原理

```
用户拖选文字
        │
        ▼
┌──────────────────────────────────┐
│  Ⓣ  Ⓒ   Ⓢ   Ⓔ   Ⓢ   Ⓘ   ⋯    │  ← 工具栏
│  译  复  搜  解释 总结 润色  更多  │
└──────────────────────────────────┘
   │    │    │    │──────┘──────┘
   ▼    ▼    ▼    ▼
 Google剪贴 浏览器  LLM
```
<img width="2208" height="2000" alt="Screenshot 2026-05-31 at 07-56-41" src="https://github.com/user-attachments/assets/94532641-3d61-401b-86de-844e6a623d5b" />

## 内置功能

| 功能 | 技术实现 | 无需配置 |
|---|---|---|
| 翻译 | `translate.googleapis.com` | ✅ |
| 复制 | `navigator.clipboard` | ✅ |
| 搜索 | 打开 `google.com` 或 `bing.com` | ✅ |

## 自定义技能（LLM）

自行提供 API Key。支持任意 OpenAI 兼容接口（`/v1/chat/completions`）。

**内置支持的服务商：**

| 服务商 | 接口地址 | 默认模型 |
|---|---|---|
| DeepSeek | `api.deepseek.com/v1` | `deepseek-chat` |
| OpenRouter | `openrouter.ai/api/v1` | `openai/gpt-5.2` |
| Ollama | `localhost:11434/v1` | `llama3.2` |

**提示词示例：**

```
解释:   "用通俗易懂的语言解释：\n\n{{text}}"
总结:   "用 3 个要点总结：\n\n{{text}}"
润色:   "改善写作，保持原意：\n\n{{text}}"
翻译:   "翻译成日语：\n\n{{text}}"
审阅:   "审阅并提出改进建议：\n\n{{text}}"
```

## 环境要求

- Obsidian **v1.0.0+**
- 需要网络连接（翻译和 LLM 功能）
- 自定义技能需要对应服务商的 API Key

## 许可证

[MIT](LICENSE) © veritasian
