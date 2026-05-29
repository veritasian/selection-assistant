const { Plugin, PluginSettingTab, Setting, Notice, Modal, TextComponent, TextAreaComponent, ToggleComponent } = require('obsidian');

// ─── Provider presets ─────────────────────────────────────────────────
const PROVIDER_PRESETS = {
    'deepseek': {
        name: 'DeepSeek',
        host: 'https://api.deepseek.com/anthropic',
        search: 'deepseek-v4-pro',
    },
    'openrouter': {
        name: 'OpenRouter',
        host: 'https://openrouter.ai/api/v1',
        search: 'openai/gpt-5.2',
    },
    'ollama': {
        name: 'Ollama (Local)',
        host: 'http://localhost:11434/v1',
        search: 'llama3.2',
    },
    'custom': {
        name: 'Custom Provider',
        host: '',
        search: '',
    },
};

// ─── Default Settings ─────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
    // LLM
    llmProvider: 'deepseek',
    llmHost: 'https://api.deepseek.com/anthropic',
    llmApiKey: '',
    llmModel: '',
    llmMaxTokens: 500,
    llmSaved: false,       // lock after confirmed save
    // General
    searchEngine: 'google',
    translateTarget: 'zh',
    // Skills (max 5)
    skills: [
        { id: 's1', name: 'Explain', prompt: 'Explain in simple terms:\n\n{{text}}', enabled: true },
        { id: 's2', name: 'Summarize', prompt: 'Summarize in 3 bullets:\n\n{{text}}', enabled: true },
        { id: 's3', name: 'Improve', prompt: 'Improve the writing, keep meaning:\n\n{{text}}', enabled: true },
    ],
    // Order: 'translate','copy','search' are built-in; skill IDs are custom
    skillOrder: ['translate', 'copy', 'search', 's1', 's2', 's3'],
    toolbarMaxVisible: 5,
};

// ─── SVG icons (thin line, theme-adaptive) ───────────────────────────
const ICONS = {
    translate: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l4 10"/><path d="M9 8l4 10"/><line x1="2" y1="12" x2="10" y2="12"/><circle cx="17" cy="12" r="4"/><line x1="15" y1="7" x2="15" y2="5"/><line x1="15" y1="19" x2="15" y2="17"/></svg>`,
    copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    skill: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    more: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
    close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

// ─── CSS ──────────────────────────────────────────────────────────────
const TOOLBAR_CSS = `
.sa-toolbar {
    position: fixed; z-index: 99999;
    display: flex; align-items: center; gap: 1px;
    background: var(--background-primary, #fff);
    border: 0.5px solid var(--background-modifier-border, rgba(0,0,0,0.08));
    border-radius: 9px; padding: 3px 5px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
    opacity: 0; transform: translateY(3px);
    transition: opacity 0.12s ease, transform 0.12s ease;
    user-select: none; -webkit-user-select: none;
}
.theme-dark .sa-toolbar { background: rgba(35,35,35,0.94); box-shadow: 0 4px 20px rgba(0,0,0,0.35); }
.sa-toolbar.sa-visible { opacity: 1; transform: translateY(0); }
.sa-toolbar button {
    all: unset; display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 6px; cursor: pointer;
    font-size: 16px; color: var(--text-muted, #777);
    transition: background 0.1s, color 0.1s; flex-shrink: 0;
}
.sa-toolbar button:hover { background: var(--background-modifier-hover, rgba(0,0,0,0.05)); color: var(--text-normal, #222); }
.sa-toolbar button:active { background: var(--background-modifier-active, rgba(0,0,0,0.08)); }
.sa-toolbar .sa-divider { width: 0.5px; height: 18px; background: var(--background-modifier-border, rgba(0,0,0,0.08)); margin: 0 3px; flex-shrink: 0; }
.sa-toolbar .sa-more { padding: 5px 7px; }
.sa-popup {
    position: fixed; z-index: 99998; max-width: 440px; min-width: 220px; max-height: 380px; overflow-y: auto;
    background: var(--background-primary, #fff); border: 0.5px solid var(--background-modifier-border, rgba(0,0,0,0.08));
    border-radius: 12px; padding: 14px 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    font-size: 13px; line-height: 1.6; color: var(--text-normal);
    animation: sa-pop 0.12s ease;
}
.theme-dark .sa-popup { background: rgba(35,35,35,0.96); }
@keyframes sa-pop { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.sa-popup .sa-popup-close { position: absolute; top: 8px; right: 10px; all: unset; cursor: pointer; color: var(--text-muted); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 5px; }
.sa-popup .sa-popup-close:hover { background: var(--background-modifier-hover); }
.sa-popup .sa-loading { color: var(--text-muted); font-style: italic; text-align: center; padding: 12px; }
.sa-popup .sa-error { color: var(--text-error); }
.sa-popup .sa-title { font-weight: 600; margin-bottom: 8px; color: var(--text-accent); }
.sa-overflow {
    position: fixed; z-index: 99999; min-width: 130px;
    background: var(--background-primary, #fff); border: 0.5px solid var(--background-modifier-border, rgba(0,0,0,0.08));
    border-radius: 9px; padding: 3px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    animation: sa-pop 0.08s ease;
}
.theme-dark .sa-overflow { background: rgba(35,35,35,0.96); }
.sa-overflow button {
    all: unset; display: flex; align-items: center; gap: 7px;
    width: 100%; padding: 7px 11px; border-radius: 6px; cursor: pointer;
    font-size: 12px; color: var(--text-normal); box-sizing: border-box;
}
.sa-overflow button:hover { background: var(--background-modifier-hover); }
`;

// ─── Services ─────────────────────────────────────────────────────────

const TranslateService = {
    async translate(text, targetLang) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const sentences = (data[0] || []).map(s => s[0]).filter(Boolean);
        return sentences.join(' ') || '(no translation)';
    }
};

const SearchService = {
    open(text, engine) {
        const q = encodeURIComponent(text);
        const url = engine === 'bing'
            ? `https://www.bing.com/search?q=${q}`
            : `https://www.google.com/search?q=${q}`;
        window.open(url, '_blank');
    }
};

// ─── Main Plugin ──────────────────────────────────────────────────────

module.exports = class SelectionAssistant extends Plugin {

    async onload() {
        await this.loadSettings();
        this.styleEl = document.createElement('style');
        this.styleEl.textContent = TOOLBAR_CSS;
        document.head.appendChild(this.styleEl);
        console.log('[SA] Loaded');

        this.toolbar = null;
        this.popup = null;
        this.overflowMenu = null;
        this.lastSelection = '';
        this.skipNextHide = false;
        this.selectionStartTime = 0;

        // Only trigger on drag-select (mouseup after mousedown with delay)
        this.registerDomEvent(document, 'mousedown', this.onMouseDown.bind(this));
        this.registerDomEvent(document, 'mouseup', this.onMouseUp.bind(this));
        this.registerDomEvent(document, 'mousedown', this.onGlobalMouseDown.bind(this));
        this.registerDomEvent(document, 'scroll', this.hideAll.bind(this), true);
        this.registerDomEvent(document, 'keydown', this.onKeyDown.bind(this));
        this.registerDomEvent(document, 'contextmenu', this.onContextMenu.bind(this));

        this.addSettingTab(new SASettingsTab(this.app, this));

        // Command palette: translate
        this.addCommand({
            id: 'sa-translate',
            name: 'Translate selection',
            editorCallback: (editor) => {
                const sel = editor.getSelection();
                if (sel) this.showPopup(this.translateContent(sel));
            }
        });
        // Command palette: search
        this.addCommand({
            id: 'sa-search',
            name: 'Search selection',
            editorCallback: (editor) => {
                const sel = editor.getSelection();
                if (sel) SearchService.open(sel, this.settings.searchEngine);
            }
        });
    }

    onunload() {
        this.hideAll();
        if (this.styleEl) this.styleEl.remove();
    }

    async loadSettings() {
        const saved = await this.loadData() || {};
        this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
        // Migrate old skills without id
        this.settings.skills = (this.settings.skills || []).map((s, i) => ({ ...s, id: s.id || `s${i + 1}` }));
        // Ensure order contains all ids
        const allIds = ['translate', 'copy', 'search', ...this.settings.skills.map(s => s.id)];
        for (const id of allIds) {
            if (!this.settings.skillOrder.includes(id)) this.settings.skillOrder.push(id);
        }
        this.settings.skillOrder = this.settings.skillOrder.filter(id => allIds.includes(id));
        this.settings.toolbarMaxVisible = this.settings.toolbarMaxVisible || 5;
        // Fallbacks
        if (!this.settings.llmModel) {
            const preset = PROVIDER_PRESETS[this.settings.llmProvider];
            if (preset) this.settings.llmModel = preset.search;
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // ─── Button helpers ─────────────────────────────────────────────────

    getOrderedButtons() {
        return this.settings.skillOrder.map(id => this.getButton(id)).filter(Boolean);
    }

    getButton(id) {
        if (id === 'translate') return { id, name: 'Translate', type: 'translate', icon: ICONS.translate };
        if (id === 'copy') return { id, name: 'Copy', type: 'copy', icon: ICONS.copy };
        if (id === 'search') return { id, name: 'Search', type: 'search', icon: ICONS.search };
        const skill = this.settings.skills.find(s => s.id === id && s.enabled);
        if (skill) return { id: skill.id, name: skill.name, type: 'skill', icon: ICONS.skill, skill };
        return null;
    }

    // ─── Selection detection ────────────────────────────────────────────

    onMouseDown(e) {
        this.selectionStartTime = Date.now();
        this.hideAll();
    }

    onMouseUp(e) {
        // Only show toolbar if drag-selected (held mouse for >80ms — not a click)
        const held = Date.now() - this.selectionStartTime;
        if (held < 80) return;

        setTimeout(() => {
            const sel = window.getSelection();
            const text = (sel || '').toString().trim();
            if (text && text.length > 0 && text.length < 5000) {
                this.lastSelection = text;
                this.showToolbar(e);
            } else {
                this.lastSelection = '';
            }
        }, 30);
    }

    getSelectionRect() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const range = sel.getRangeAt(0);
        if (range.collapsed) return null;
        const rects = range.getClientRects();
        return rects.length > 0 ? rects[rects.length - 1] : null;
    }

    // ─── Toolbar ────────────────────────────────────────────────────────

    showToolbar(mouseEvent) {
        this.hideToolbar();
        this.hideOverflowMenu();

        const toolbar = document.createElement('div');
        toolbar.className = 'sa-toolbar';

        const buttons = this.getOrderedButtons();
        const visible = buttons.slice(0, this.settings.toolbarMaxVisible);
        const overflow = buttons.slice(this.settings.toolbarMaxVisible);

        for (const btn of visible) {
            const el = document.createElement('button');
            el.innerHTML = btn.icon;
            el.title = btn.name;
            el.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); this.doAction(btn); });
            toolbar.appendChild(el);
        }

        if (overflow.length > 0) {
            const div = document.createElement('div');
            div.className = 'sa-divider';
            toolbar.appendChild(div);
            const more = document.createElement('button');
            more.className = 'sa-more';
            more.innerHTML = ICONS.more;
            more.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); this.showOverflowMenu(overflow, more); });
            toolbar.appendChild(more);
        }

        document.body.appendChild(toolbar);
        this.toolbar = toolbar;

        const rect = this.getSelectionRect();
        const bx = rect ? rect.right : mouseEvent.clientX;
        const by = rect ? rect.top : mouseEvent.clientY;
        const bbot = rect ? rect.bottom : mouseEvent.clientY;

        requestAnimationFrame(() => {
            const tw = toolbar.offsetWidth;
            const th = toolbar.offsetHeight;
            let left = bx - tw / 2;
            let top = by - th - 8;
            if (left < 8) left = 8;
            if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
            if (top < 8) top = bbot + 8;
            toolbar.style.left = `${left}px`;
            toolbar.style.top = `${top}px`;
            toolbar.classList.add('sa-visible');
        });

        this.skipNextHide = true;
        setTimeout(() => { this.skipNextHide = false; }, 150);
    }

    showOverflowMenu(items, anchor) {
        this.hideOverflowMenu();
        const menu = document.createElement('div');
        menu.className = 'sa-overflow';
        for (const btn of items) {
            const row = document.createElement('button');
            row.innerHTML = `${btn.icon}`;
            const label = document.createElement('span');
            label.textContent = btn.name;
            label.style.cssText = 'font-size:12px;';
            row.appendChild(label);
            row.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); this.hideOverflowMenu(); this.doAction(btn); });
            menu.appendChild(row);
        }
        document.body.appendChild(menu);
        const ar = anchor.getBoundingClientRect();
        menu.style.left = `${ar.left}px`;
        menu.style.top = `${ar.bottom + 4}px`;
        requestAnimationFrame(() => {
            const mr = menu.getBoundingClientRect();
            if (mr.right > window.innerWidth - 8) menu.style.left = `${window.innerWidth - mr.width - 8}px`;
        });
        this.overflowMenu = menu;
    }

    hideToolbar() {
        if (this.skipNextHide) return;
        if (this.toolbar) { this.toolbar.remove(); this.toolbar = null; }
    }

    hideOverflowMenu() {
        if (this.overflowMenu) { this.overflowMenu.remove(); this.overflowMenu = null; }
    }

    hideAll() {
        this.hideToolbar();
        this.hideOverflowMenu();
    }

    onGlobalMouseDown(e) {
        if (this.toolbar && this.toolbar.contains(e.target)) return;
        if (this.overflowMenu && this.overflowMenu.contains(e.target)) return;
        if (this.popup && this.popup.contains(e.target)) return;
        this.hideAll();
    }

    onKeyDown(e) {
        if (e.key === 'Escape') { this.hideAll(); this.hidePopup(); }
    }

    // ─── Actions ───────────────────────────────────────────────────────

    async doAction(btn) {
        const text = this.lastSelection;
        if (!text) return;
        this.hideAll();
        switch (btn.type) {
            case 'translate':
                this.showPopup(this.translateContent(text));
                break;
            case 'copy':
                await navigator.clipboard.writeText(text);
                new Notice('Copied');
                break;
            case 'search':
                SearchService.open(text, this.settings.searchEngine);
                break;
            case 'skill':
                this.showPopup(this.skillContent(btn.skill, text));
                break;
        }
    }

    // ─── Popup ─────────────────────────────────────────────────────────

    showPopup(contentPromise) {
        this.hidePopup();
        const popup = document.createElement('div');
        popup.className = 'sa-popup';
        popup.innerHTML = '<div class="sa-loading">Loading...</div>';
        const rect = this.getSelectionRect();
        if (rect) {
            popup.style.left = `${Math.max(8, rect.left)}px`;
            const t = rect.bottom + 8;
            popup.style.top = t + 200 > window.innerHeight ? `${rect.top - 220}px` : `${t}px`;
        } else {
            popup.style.left = '50%'; popup.style.top = '40%'; popup.style.transform = 'translate(-50%,-50%)';
        }
        document.body.appendChild(popup);
        this.popup = popup;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'sa-popup-close';
        closeBtn.innerHTML = ICONS.close;
        closeBtn.addEventListener('click', () => this.hidePopup());
        popup.appendChild(closeBtn);

        Promise.resolve(contentPromise).then(html => {
            if (this.popup !== popup) return;
            popup.innerHTML = '';
            popup.appendChild(closeBtn);
            const body = document.createElement('div');
            body.innerHTML = html;
            popup.appendChild(body);
        }).catch(err => {
            if (this.popup !== popup) return;
            popup.innerHTML = '';
            popup.appendChild(closeBtn);
            popup.innerHTML += `<div class="sa-error">${err.message}</div>`;
        });
    }

    async translateContent(text) {
        try {
            const result = await TranslateService.translate(text, this.settings.translateTarget);
            return `<div class="sa-title">Translation (${this.settings.translateTarget.toUpperCase()})</div><div>${escHtml(result)}</div>`;
        } catch (e) {
            return `<div class="sa-error">Translation failed: ${e.message}</div>`;
        }
    }

    async skillContent(skill, text) {
        try {
            const result = await LLMService.chat(this.settings, skill.prompt.replace('{{text}}', text));
            return `<div class="sa-title">${escHtml(skill.name)}</div><div>${escHtml(result).replace(/\n/g, '<br>')}</div>`;
        } catch (e) {
            return `<div class="sa-error">${escHtml(skill.name)} failed: ${e.message}</div>`;
        }
    }

    hidePopup() {
        if (this.popup) { this.popup.remove(); this.popup = null; }
    }

    // ─── Right-click menu ──────────────────────────────────────────────

    onContextMenu(e) {
        setTimeout(() => {
            const menu = document.querySelector('.menu');
            if (!menu || menu.dataset.saDone) return;
            menu.dataset.saDone = '1';
            const sel = window.getSelection().toString().trim();

            const addItem = (label, fn) => {
                const sep = document.createElement('div');
                sep.className = 'menu-separator';
                menu.appendChild(sep);
                const item = document.createElement('div');
                item.className = 'menu-item';
                item.innerHTML = `<div class="menu-item-title">${label}</div>`;
                item.addEventListener('click', () => { fn(); menu.remove(); });
                menu.appendChild(item);
            };

            if (sel) addItem('📋 Copy', () => navigator.clipboard.writeText(sel).then(() => new Notice('Copied')));
            addItem('📄 Paste', async () => {
                try {
                    const clip = await navigator.clipboard.readText();
                    const el = document.activeElement;
                    if (el && (el.closest('.cm-editor') || el.closest('.markdown-source-view'))) {
                        document.execCommand('paste');
                    } else if (clip) {
                        new Notice('Click in editor and Cmd+V to paste');
                    }
                } catch { new Notice('No clipboard access'); }
            });
            if (sel) addItem('✂️ Cut', () => {
                navigator.clipboard.writeText(sel).then(() => { document.execCommand('delete'); new Notice('Cut'); });
            });
        }, 30);
    }
};

// ─── LLM Service ─────────────────────────────────────────────────────

const LLMService = {
    _detectProtocol(host) {
        if (host.includes('11434') || host.includes('ollama')) return 'ollama';
        if (host.includes('openrouter')) return 'openrouter';
        if (host.includes('anthropic') || host.includes('deepseek')) return 'anthropic';
        return 'openai';
    },

    async chat(settings, prompt) {
        const host = settings.llmHost.replace(/\/+$/, '');
        if (!settings.llmApiKey && host.includes('api')) {
            throw new Error('API key is empty. Enter your key first.');
        }
        const proto = this._detectProtocol(host);

        let url, body, headers;
        const model = settings.llmModel || (PROVIDER_PRESETS[settings.llmProvider]?.search || 'gpt-4');

        if (proto === 'ollama') {
            url = host + '/chat/completions';
            body = JSON.stringify({ model, max_tokens: settings.llmMaxTokens, messages: [{ role: 'user', content: prompt }] });
            headers = { 'Content-Type': 'application/json' };
        } else if (proto === 'anthropic') {
            url = host + '/messages';
            body = JSON.stringify({ model, max_tokens: settings.llmMaxTokens, messages: [{ role: 'user', content: prompt }] });
            headers = { 'Content-Type': 'application/json', 'x-api-key': settings.llmApiKey, 'anthropic-version': '2023-06-01' };
        } else {
            // OpenAI-compatible: OpenRouter, Groq, etc.
            url = host + '/chat/completions';
            body = JSON.stringify({ model, max_tokens: settings.llmMaxTokens, messages: [{ role: 'user', content: prompt }] });
            headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.llmApiKey}` };
        }

        console.log('[SA] LLM request:', { url, model, hasKey: !!settings.llmApiKey });

        const resp = await fetch(url, { method: 'POST', headers, body });
        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`LLM ${resp.status}: ${err.slice(0, 200)}`);
        }
        const data = await resp.json();
        if (data.content && data.content[0]) return data.content[0].text;
        if (data.choices && data.choices[0]) return data.choices[0].message.content;
        if (data.message) return data.message.content;
        return JSON.stringify(data);
    },

    async fetchModels(settings) {
        const host = settings.llmHost.replace(/\/+$/, '');
        if (!settings.llmApiKey && host.includes('api')) {
            throw new Error('API key is empty. Enter your key first.');
        }
        const proto = this._detectProtocol(host);
        const headers = {};

        if (proto === 'anthropic') {
            headers['x-api-key'] = settings.llmApiKey;
            headers['anthropic-version'] = '2023-06-01';
        } else if (proto !== 'ollama') {
            headers['Authorization'] = `Bearer ${settings.llmApiKey}`;
        }

        console.log('[SA] Fetch models:', host + '/models', { hasKey: !!settings.llmApiKey });
        const resp = await fetch(host + '/models', { headers });
        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`HTTP ${resp.status}: ${err.slice(0, 100)}`);
        }
        const data = await resp.json();
        const raw = data.data || data.models || data || [];
        return raw.map(m => typeof m === 'string' ? m : (m.id || m.model || m.name || String(m))).filter(Boolean);
    },

    async testConnection(settings) {
        const prompt = 'Reply with exactly: OK';
        const result = await LLMService.chat(settings, prompt);
        return result.trim().toLowerCase().includes('ok');
    }
};

// ─── Settings Tab ─────────────────────────────────────────────────────

class SASettingsTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        const s = this.plugin.settings;

        // ====== GENERAL ======
        containerEl.createEl('h2', { text: 'General' });

        new Setting(containerEl)
            .setName('Search engine')
            .addDropdown(d => d.addOption('google', 'Google').addOption('bing', 'Bing').setValue(s.searchEngine)
                .onChange(async v => { s.searchEngine = v; await this.plugin.saveSettings(); }));

        new Setting(containerEl)
            .setName('Translate to language')
            .setDesc('Language code: zh, en, ja, fr, de, ko, etc.')
            .addText(t => t.setValue(s.translateTarget).setPlaceholder('zh')
                .onChange(async v => { s.translateTarget = v; await this.plugin.saveSettings(); }));

        new Setting(containerEl)
            .setName('Toolbar visible buttons')
            .setDesc('Max visible before "..." overflow')
            .addSlider(sl => sl.setLimits(1, 8, 1).setValue(s.toolbarMaxVisible).setDynamicTooltip()
                .onChange(async v => { s.toolbarMaxVisible = v; await this.plugin.saveSettings(); }));

        // ====== LLM ======
        containerEl.createEl('h2', { text: 'LLM Configuration' });

        new Setting(containerEl)
            .setName('Provider')
            .setDesc('Select your LLM provider')
            .addDropdown(d => {
                d.addOption('deepseek', 'DeepSeek');
                d.addOption('openrouter', 'OpenRouter');
                d.addOption('ollama', 'Ollama (Local)');
                d.addOption('custom', 'Custom');
                d.setValue(s.llmProvider);
                d.onChange(async v => {
                    s.llmProvider = v;
                    const preset = PROVIDER_PRESETS[v];
                    if (preset && preset.host) {
                        s.llmHost = preset.host;
                    }
                    if (preset && preset.search && !s.llmSaved) {
                        s.llmModel = preset.search;
                    }
                    s.llmSaved = false;
                    await this.plugin.saveSettings();
                    this.display(); // refresh
                });
                return d;
            });

        new Setting(containerEl)
            .setName('API Host')
            .setDesc('Anthropic or OpenAI-compatible endpoint')
            .addText(t => {
                t.setValue(s.llmHost).setPlaceholder('https://api.deepseek.com/anthropic');
                t.inputEl.addEventListener('input', () => { s.llmHost = t.getValue(); s.llmSaved = false; });
                t.onChange(async v => { s.llmHost = v; s.llmSaved = false; await this.plugin.saveSettings(); });
            });

        new Setting(containerEl)
            .setName('API Key')
            .addText(t => {
                t.inputEl.type = 'password';
                t.setValue(s.llmApiKey).setPlaceholder('sk-...');
                // Sync on every keystroke (not just blur) so buttons can read the value
                t.inputEl.addEventListener('input', () => {
                    s.llmApiKey = t.getValue();
                    s.llmSaved = false;
                });
                t.onChange(async v => { s.llmApiKey = v; s.llmSaved = false; await this.plugin.saveSettings(); });
            });

        // Fetch Models + Model dropdown
        const modelSetting = new Setting(containerEl)
            .setName('Model')
            .setDesc('Fetch and select a model');

        const modelSelect = modelSetting.addDropdown(d => {
            if (s.llmModel) d.addOption(s.llmModel, s.llmModel);
            d.setValue(s.llmModel || '');
            d.onChange(async v => {
                if (v && v !== '__fetch__') {
                    s.llmModel = v;
                    await this.plugin.saveSettings();
                }
            });
            return d;
        });

        modelSetting.addButton(btn => btn.setButtonText('Fetch Models').onClick(async () => {
            btn.setButtonText('...'); btn.setDisabled(true);
            try {
                const models = await LLMService.fetchModels(s);
                // Rebuild dropdown
                const dd = modelSetting.controlEl.querySelector('select');
                if (dd) {
                    dd.innerHTML = '';
                    for (const m of models) {
                        const opt = document.createElement('option');
                        opt.value = m; opt.textContent = m;
                        if (m === s.llmModel) opt.selected = true;
                        dd.appendChild(opt);
                    }
                }
                new Notice(`${models.length} models loaded`);
            } catch (e) {
                new Notice('Fetch failed: ' + e.message);
            }
            btn.setButtonText('Fetch Models'); btn.setDisabled(false);
        }));

        // Save & Test
        const testRow = containerEl.createDiv({ cls: 'setting-item' });
        const testInfo = testRow.createDiv({ cls: 'setting-item-info' });
        testInfo.createDiv({ cls: 'setting-item-name', text: 'Save & Test Connection' });
        testInfo.createDiv({ cls: 'setting-item-description', text: s.llmSaved ? '✅ Saved — locked. Change a field above to unlock.' : '⚠ Not saved yet. Fill in all fields and click below.' });

        const testCtrl = testRow.createDiv({ cls: 'setting-item-control' });
        const testBtn = testCtrl.createEl('button', { text: 'Save & Test' });
        testBtn.addEventListener('click', async () => {
            testBtn.textContent = 'Testing...'; testBtn.disabled = true;
            try {
                const ok = await LLMService.testConnection(s);
                if (ok) {
                    s.llmSaved = true;
                    await this.plugin.saveSettings();
                    new Notice('Connection OK — saved and locked');
                } else {
                    new Notice('Unexpected response from LLM');
                }
            } catch (e) {
                new Notice('Test failed: ' + e.message);
            }
            testBtn.textContent = 'Save & Test'; testBtn.disabled = false;
            this.display();
        });

        // ====== Custom Skills ======
        containerEl.createEl('h2', { text: 'Custom Skills' });
        containerEl.createEl('p', { text: 'Define up to 5 skills. Use {{text}} for selected text.', cls: 'setting-item-description' });

        const skillList = containerEl.createDiv();
        const renderSkills = () => {
            skillList.empty();
            for (const skill of s.skills) {
                const row = skillList.createDiv({ cls: 'setting-item' });
                const info = row.createDiv({ cls: 'setting-item-info' });
                info.createDiv({ cls: 'setting-item-name', text: skill.name + (skill.enabled ? '' : ' (disabled)') });
                info.createDiv({ cls: 'setting-item-description', text: skill.prompt.substring(0, 60) + '...' });

                const ctrl = row.createDiv({ cls: 'setting-item-control' });
                // Edit button
                const editBtn = ctrl.createEl('button', { text: 'Edit' });
                editBtn.addEventListener('click', () => this.openSkillEditor(skill, renderSkills));
                // Delete button
                const delBtn = ctrl.createEl('button', { text: 'Delete' });
                delBtn.style.marginLeft = '8px';
                delBtn.addEventListener('click', async () => {
                    s.skills = s.skills.filter(sk => sk.id !== skill.id);
                    s.skillOrder = s.skillOrder.filter(id => id !== skill.id);
                    await this.plugin.saveSettings();
                    renderSkills();
                    this.renderOrderList();
                });
            }
        };
        renderSkills();

        new Setting(containerEl)
            .addButton(btn => btn.setButtonText('+ Add Skill').onClick(async () => {
                if (s.skills.length >= 5) { new Notice('Maximum 5 skills'); return; }
                const id = 's' + Date.now();
                s.skills.push({ id, name: 'New Skill', prompt: '{{text}}', enabled: true });
                s.skillOrder.push(id);
                await this.plugin.saveSettings();
                renderSkills();
                this.renderOrderList();
            }));

        // ====== Toolbar Order ======
        containerEl.createEl('h2', { text: 'Toolbar Order' });
        this.orderContainer = containerEl.createDiv();
        this.renderOrderList();
    }

    openSkillEditor(skill, onSave) {
        const s = this.plugin.settings;
        const modal = new Modal(this.app);
        modal.titleEl.setText('Edit Skill');

        const content = modal.contentEl.createDiv({ cls: 'sa-skill-editor' });

        new Setting(content).setName('Name').addText(t => {
            t.setValue(skill.name).onChange(v => skill.name = v);
        });

        new Setting(content).setName('Prompt').setDesc('Use {{text}} for selection').addTextArea(t => {
            t.setValue(skill.prompt);
            t.inputEl.rows = 4;
            t.inputEl.style.width = '100%';
            t.onChange(v => skill.prompt = v);
        });

        new Setting(content).setName('Enabled').addToggle(t => {
            t.setValue(skill.enabled).onChange(v => skill.enabled = v);
        });

        new Setting(content).addButton(btn => btn.setButtonText('Save').setCta().onClick(async () => {
            // Auto-sync: if disabled remove from order, if enabled add back
            if (skill.enabled && !s.skillOrder.includes(skill.id)) {
                s.skillOrder.push(skill.id);
            }
            if (!skill.enabled) {
                s.skillOrder = s.skillOrder.filter(id => id !== skill.id);
            }
            await this.plugin.saveSettings();
            modal.close();
            onSave();
            this.renderOrderList();
        }));

        modal.open();
    }

    renderOrderList() {
        if (!this.orderContainer) return;
        this.orderContainer.empty();
        const s = this.plugin.settings;
        const buttons = this.plugin.getOrderedButtons();

        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const row = this.orderContainer.createDiv({ cls: 'setting-item' });
            const info = row.createDiv({ cls: 'setting-item-info' });
            info.createDiv({ cls: 'setting-item-name', text: btn.name });
            info.createDiv({ cls: 'setting-item-description', text: btn.type === 'skill' ? 'Custom' : 'Built-in' });

            const ctrl = row.createDiv({ cls: 'setting-item-control' });
            const up = ctrl.createEl('button', { text: '↑' });
            up.disabled = i === 0;
            up.addEventListener('click', async () => {
                const idx = s.skillOrder.indexOf(btn.id);
                if (idx > 0) {
                    [s.skillOrder[idx], s.skillOrder[idx - 1]] = [s.skillOrder[idx - 1], s.skillOrder[idx]];
                    await this.plugin.saveSettings();
                    this.renderOrderList();
                }
            });
            const down = ctrl.createEl('button', { text: '↓' });
            down.style.marginLeft = '4px';
            down.disabled = i === buttons.length - 1;
            down.addEventListener('click', async () => {
                const idx = s.skillOrder.indexOf(btn.id);
                if (idx < s.skillOrder.length - 1) {
                    [s.skillOrder[idx], s.skillOrder[idx + 1]] = [s.skillOrder[idx + 1], s.skillOrder[idx]];
                    await this.plugin.saveSettings();
                    this.renderOrderList();
                }
            });
        }
    }
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}
