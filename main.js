const { Plugin, PluginSettingTab, Setting, Notice, Menu, MarkdownRenderer, requireApiVersion } = require('obsidian');

// ─── Default Settings ─────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
    // LLM config
    llmProvider: 'DeepSeek',
    llmHost: 'https://api.deepseek.com/anthropic',
    llmApiKey: '',
    llmModel: 'deepseek-v4-pro',
    llmMaxTokens: 500,
    // General
    searchEngine: 'google',  // 'google' | 'bing'
    translateTarget: 'zh',   // target language code
    // Custom skills (max 5)
    skills: [
        { id: 's1', name: 'Explain', icon: '💡', prompt: 'Explain the following in simple terms:\n\n{{text}}', enabled: true },
        { id: 's2', name: 'Summarize', icon: '📝', prompt: 'Summarize this in 3 bullet points:\n\n{{text}}', enabled: true },
        { id: 's3', name: 'Improve', icon: '✨', prompt: 'Improve the writing of the following text. Keep the same meaning:\n\n{{text}}', enabled: true },
    ],
    skillOrder: ['translate', 'copy', 'search', 's1', 's2', 's3'],
    toolbarMaxVisible: 5,
};

// ─── CSS ──────────────────────────────────────────────────────────────
const TOOLBAR_CSS = `
.selection-toolbar {
    position: fixed;
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--background-primary, #ffffff);
    border: 0.5px solid var(--background-modifier-border, rgba(0,0,0,0.1));
    border-radius: 10px;
    padding: 4px 6px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
    user-select: none;
    -webkit-user-select: none;
}
.selection-toolbar.visible {
    opacity: 1;
    transform: translateY(0);
}
.theme-dark .selection-toolbar {
    background: rgba(40,40,40,0.92);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2);
}
.selection-toolbar button {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 15px;
    color: var(--text-muted, #666);
    transition: background 0.1s, color 0.1s;
    flex-shrink: 0;
}
.selection-toolbar button:hover {
    background: var(--background-modifier-hover, rgba(0,0,0,0.06));
    color: var(--text-normal, #333);
}
.selection-toolbar button:active {
    background: var(--background-modifier-active, rgba(0,0,0,0.1));
}
.selection-toolbar .toolbar-divider {
    width: 0.5px;
    height: 20px;
    background: var(--background-modifier-border, rgba(0,0,0,0.08));
    margin: 0 4px;
    flex-shrink: 0;
}
.selection-toolbar .toolbar-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted, #888);
    padding: 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 72px;
    flex-shrink: 1;
}
.selection-popup {
    position: fixed;
    z-index: 99998;
    max-width: 420px;
    min-width: 240px;
    max-height: 360px;
    overflow-y: auto;
    background: var(--background-primary, #ffffff);
    border: 0.5px solid var(--background-modifier-border, rgba(0,0,0,0.1));
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-normal, #333);
    animation: sa-fade-in 0.15s ease;
}
.theme-dark .selection-popup {
    background: rgba(40,40,40,0.95);
}
@keyframes sa-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
}
.selection-popup .sa-close {
    position: absolute;
    top: 8px;
    right: 10px;
    all: unset;
    cursor: pointer;
    font-size: 16px;
    color: var(--text-muted);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
}
.selection-popup .sa-close:hover {
    background: var(--background-modifier-hover);
}
.selection-popup .sa-loading {
    color: var(--text-muted);
    font-style: italic;
    text-align: center;
    padding: 12px 0;
}
.selection-popup .sa-error {
    color: var(--text-error);
}
.selection-overflow-menu {
    position: fixed;
    z-index: 99999;
    background: var(--background-primary, #ffffff);
    border: 0.5px solid var(--background-modifier-border, rgba(0,0,0,0.1));
    border-radius: 10px;
    padding: 4px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    min-width: 140px;
    animation: sa-fade-in 0.1s ease;
}
.theme-dark .selection-overflow-menu {
    background: rgba(40,40,40,0.95);
}
.selection-overflow-menu button {
    all: unset;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-normal);
    box-sizing: border-box;
}
.selection-overflow-menu button:hover {
    background: var(--background-modifier-hover, rgba(0,0,0,0.06));
}
.selection-overflow-menu .overflow-icon {
    width: 20px;
    text-align: center;
}
`;

// ─── Services ─────────────────────────────────────────────────────────

const TranslateService = {
    async translate(text, targetLang) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        // Google returns [[["translated text","original",...],null,...],...]
        const sentences = (data[0] || []).map(s => s[0]).filter(Boolean);
        return sentences.join(' ') || '(no translation)';
    }
};

const LLMService = {
    async chat(settings, skill, text) {
        const prompt = skill.prompt.replace('{{text}}', text);
        const host = settings.llmHost.replace(/\/+$/, '');
        const url = host + '/messages';

        const body = {
            model: settings.llmModel,
            max_tokens: settings.llmMaxTokens,
            messages: [
                { role: 'system', content: 'Reply concisely. No extra commentary.' },
                { role: 'user', content: prompt }
            ]
        };

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': settings.llmApiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`LLM error ${resp.status}: ${err.slice(0, 200)}`);
        }

        const data = await resp.json();
        // Anthropic format
        if (data.content && data.content[0]) return data.content[0].text;
        // OpenAI format fallback
        if (data.choices && data.choices[0]) return data.choices[0].message.content;
        return JSON.stringify(data);
    },

    async fetchModels(settings) {
        const host = settings.llmHost.replace(/\/+$/, '');
        const resp = await fetch(host + '/models', {
            headers: {
                'x-api-key': settings.llmApiKey,
                'anthropic-version': '2023-06-01',
            }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const models = data.data || data.models || [];
        return models.map(m => typeof m === 'string' ? m : (m.id || m.model || m.name || String(m))).filter(Boolean);
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

        // Inject CSS
        this.styleEl = document.createElement('style');
        this.styleEl.textContent = TOOLBAR_CSS;
        document.head.appendChild(this.styleEl);

        // State
        this.toolbar = null;
        this.popup = null;
        this.overflowMenu = null;
        this.lastSelection = '';
        this.toolbarVisible = false;
        this.skipNextHide = false;

        // Listen for text selection (mouseup)
        this.registerDomEvent(document, 'mouseup', this.onMouseUp.bind(this));

        // Hide toolbar on scroll / click outside
        this.registerDomEvent(document, 'mousedown', this.onGlobalMouseDown.bind(this));
        this.registerDomEvent(document, 'scroll', this.hideToolbar.bind(this), true);

        // Keyboard: Escape to dismiss
        this.registerDomEvent(document, 'keydown', this.onKeyDown.bind(this));

        // Right-click context menu
        this.registerDomEvent(document, 'contextmenu', this.onContextMenu.bind(this));

        // Add settings tab
        this.addSettingTab(new SelectionAssistantSettingsTab(this.app, this));

        // Add command: translate selection
        this.addCommand({
            id: 'sa-translate',
            name: 'Translate selected text',
            editorCallback: (editor) => {
                const sel = editor.getSelection();
                if (sel) this.showPopup(sel, this.translatePopup.bind(this, sel));
            }
        });

        // Add command: custom skill via palette
        this.addCommand({
            id: 'sa-run-skill',
            name: 'Run custom skill on selected text',
            editorCallback: async (editor) => {
                const sel = editor.getSelection();
                if (!sel) return;
                const skills = this.settings.skills.filter(s => s.enabled);
                if (skills.length === 0) {
                    new Notice('No custom skills configured.');
                    return;
                }
                // Pick first skill, or show a quick chooser
                const skill = skills[0];
                await this.runSkill(skill, sel);
            }
        });

        this.addCommand({
            id: 'sa-search',
            name: 'Search selected text',
            editorCallback: (editor) => {
                const sel = editor.getSelection();
                if (sel) SearchService.open(sel, this.settings.searchEngine);
            }
        });
    }

    onunload() {
        this.hideToolbar();
        this.hidePopup();
        this.hideOverflowMenu();
        if (this.styleEl) this.styleEl.remove();
    }

    // ─── Settings ──────────────────────────────────────────────────────

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        // Ensure skills have IDs
        this.settings.skills = this.settings.skills.map((s, i) => ({
            ...s, id: s.id || `s${i + 1}`
        }));
        // Ensure skillOrder has all items
        const allIds = ['translate', 'copy', 'search', ...this.settings.skills.map(s => s.id)];
        const existing = new Set(this.settings.skillOrder);
        for (const id of allIds) {
            if (!existing.has(id)) this.settings.skillOrder.push(id);
        }
        // Remove deleted
        this.settings.skillOrder = this.settings.skillOrder.filter(id => allIds.includes(id));
        this.settings.toolbarMaxVisible = this.settings.toolbarMaxVisible || 5;
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // ─── Skill Helpers ─────────────────────────────────────────────────

    getOrderedButtons() {
        return this.settings.skillOrder.map(id => this.getButtonById(id)).filter(Boolean);
    }

    getButtonById(id) {
        if (id === 'translate') return { id: 'translate', name: 'Translate', icon: '📖', type: 'translate', builtin: true };
        if (id === 'copy') return { id: 'copy', name: 'Copy', icon: '📋', type: 'copy', builtin: true };
        if (id === 'search') return { id: 'search', name: 'Search', icon: '🔍', type: 'search', builtin: true };
        const skill = this.settings.skills.find(s => s.id === id && s.enabled);
        if (skill) return { id: skill.id, name: skill.name, icon: skill.icon || '⚡', type: 'skill', builtin: false, skill };
        return null;
    }

    // ─── Selection / Toolbar ───────────────────────────────────────────

    onMouseUp(e) {
        setTimeout(() => {
            const sel = window.getSelection();
            const text = (sel || '').toString().trim();
            if (text && text.length > 0 && text.length < 5000) {
                // Only show if we're in an editable area or preview
                const activeEl = document.activeElement;
                const inEditor = activeEl && (
                    activeEl.classList.contains('cm-content') ||
                    activeEl.closest('.markdown-source-view') ||
                    activeEl.closest('.markdown-preview-view') ||
                    activeEl.closest('.cm-editor') ||
                    activeEl.closest('.workspace-leaf')
                );
                // Also check if selection is inside a note
                const selNode = sel.anchorNode;
                const inNote = selNode && (
                    selNode.parentElement?.closest('.markdown-source-view') ||
                    selNode.parentElement?.closest('.markdown-preview-view') ||
                    selNode.parentElement?.closest('.cm-content')
                );

                if ((inEditor || inNote) && text !== this.lastSelection) {
                    this.lastSelection = text;
                    this.showToolbar(sel, e);
                } else if (!text) {
                    this.lastSelection = '';
                    this.hideToolbar();
                }
            } else if (!text) {
                this.lastSelection = '';
                this.hideToolbar();
            }
        }, 50);
    }

    getSelectionRect() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const range = sel.getRangeAt(0);
        if (range.collapsed) return null;

        // Try to get the end of selection rect
        const rects = range.getClientRects();
        if (rects.length === 0) return null;

        // Use last rect (end of selection)
        const lastRect = rects[rects.length - 1];
        return lastRect;
    }

    showToolbar(sel, mouseEvent) {
        this.hideToolbar();
        this.hideOverflowMenu();

        const rect = this.getSelectionRect();
        if (!rect) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'selection-toolbar';

        const buttons = this.getOrderedButtons();
        const visible = buttons.slice(0, this.settings.toolbarMaxVisible);
        const overflow = buttons.slice(this.settings.toolbarMaxVisible);

        for (const btn of visible) {
            const el = this.createToolbarButton(btn);
            toolbar.appendChild(el);
        }

        if (overflow.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'toolbar-divider';
            toolbar.appendChild(divider);

            const moreBtn = document.createElement('button');
            moreBtn.innerHTML = '⋯';
            moreBtn.setAttribute('aria-label', 'More');
            moreBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showOverflowMenu(overflow, toolbar);
            });
            toolbar.appendChild(moreBtn);
        }

        document.body.appendChild(toolbar);
        this.toolbar = toolbar;

        // Position above the selection end
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // Force a layout to get dimensions
        requestAnimationFrame(() => {
            const tw = toolbar.offsetWidth;
            const th = toolbar.offsetHeight;

            let left = rect.right - tw / 2;
            let top = rect.top - th - 8;

            // Clamp horizontal
            if (left < 8) left = 8;
            if (left + tw > viewportW - 8) left = viewportW - tw - 8;

            // If not enough space above, put below
            if (top < 8) {
                top = rect.bottom + 8;
            }

            toolbar.style.left = `${left}px`;
            toolbar.style.top = `${top}px`;
            toolbar.classList.add('visible');
        });

        this.toolbarVisible = true;
        this.skipNextHide = true;
        setTimeout(() => { this.skipNextHide = false; }, 100);
    }

    createToolbarButton(btn) {
        const el = document.createElement('button');
        el.setAttribute('aria-label', btn.name);
        el.innerHTML = btn.icon;
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.onToolbarAction(btn);
        });
        return el;
    }

    showOverflowMenu(items, anchor) {
        this.hideOverflowMenu();
        const menu = document.createElement('div');
        menu.className = 'selection-overflow-menu';

        for (const btn of items) {
            const row = document.createElement('button');
            row.innerHTML = `<span class="overflow-icon">${btn.icon}</span> ${btn.name}`;
            row.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideOverflowMenu();
                this.onToolbarAction(btn);
            });
            menu.appendChild(row);
        }

        document.body.appendChild(menu);
        const rect = anchor.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 4}px`;
        // Clamp
        requestAnimationFrame(() => {
            const mr = menu.getBoundingClientRect();
            if (mr.right > window.innerWidth - 8) {
                menu.style.left = `${window.innerWidth - mr.width - 8}px`;
            }
        });
        this.overflowMenu = menu;
    }

    hideOverflowMenu() {
        if (this.overflowMenu) {
            this.overflowMenu.remove();
            this.overflowMenu = null;
        }
    }

    hideToolbar() {
        if (this.skipNextHide) return;
        if (this.toolbar) {
            this.toolbar.remove();
            this.toolbar = null;
            this.toolbarVisible = false;
        }
        this.hideOverflowMenu();
    }

    onGlobalMouseDown(e) {
        // If clicking on toolbar or its children, don't hide
        if (this.toolbar && this.toolbar.contains(e.target)) return;
        if (this.overflowMenu && this.overflowMenu.contains(e.target)) return;
        if (this.popup && this.popup.contains(e.target)) return;
        this.hideToolbar();
        // Don't auto-hide popup — user explicitly closes it
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.hideToolbar();
            this.hidePopup();
        }
    }

    // ─── Actions ───────────────────────────────────────────────────────

    async onToolbarAction(btn) {
        const text = this.lastSelection;
        if (!text) return;
        this.hideToolbar();

        switch (btn.type) {
            case 'translate':
                this.showPopup(text, this.translatePopup.bind(this, text));
                break;
            case 'copy':
                await navigator.clipboard.writeText(text);
                new Notice('Copied');
                break;
            case 'search':
                SearchService.open(text, this.settings.searchEngine);
                break;
            case 'skill':
                await this.runSkill(btn.skill, text);
                break;
        }
    }

    // ─── Popup ─────────────────────────────────────────────────────────

    showPopup(word, contentFn) {
        this.hidePopup();

        const popup = document.createElement('div');
        popup.className = 'selection-popup';
        popup.innerHTML = '<div class="sa-loading">Loading...</div>';

        const rect = this.getSelectionRect();
        if (rect) {
            popup.style.left = `${Math.max(8, rect.left)}px`;
            const top = rect.bottom + 8;
            popup.style.top = `${top}px`;
            // If too close to bottom, put above
            if (top + 200 > window.innerHeight) {
                popup.style.top = `${rect.top - 220}px`;
            }
        } else {
            popup.style.left = '50%';
            popup.style.top = '40%';
            popup.style.transform = 'translate(-50%, -50%)';
        }

        document.body.appendChild(popup);
        this.popup = popup;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'sa-close';
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', () => this.hidePopup());
        popup.appendChild(closeBtn);

        // Load content
        contentFn.then(html => {
            if (this.popup === popup) {
                popup.innerHTML = '';
                popup.appendChild(closeBtn);
                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = html;
                popup.appendChild(contentDiv);
            }
        }).catch(err => {
            if (this.popup === popup) {
                popup.innerHTML = '';
                popup.appendChild(closeBtn);
                popup.innerHTML += `<div class="sa-error">${err.message}</div>`;
            }
        });
    }

    async translatePopup(text) {
        try {
            const result = await TranslateService.translate(text, this.settings.translateTarget);
            const src = this.settings.translateTarget.toUpperCase();
            return `<div style="font-weight:600;margin-bottom:6px;color:var(--text-accent)">Translation (${src})</div><div>${escapeHtml(result)}</div>`;
        } catch (e) {
            return `<div class="sa-error">Translation failed: ${e.message}</div>`;
        }
    }

    async runSkill(skill, text) {
        this.showPopup(text, this.skillPopup.bind(this, skill, text));
    }

    async skillPopup(skill, text) {
        try {
            const result = await LLMService.chat(this.settings, skill, text);
            const html = `<div style="font-weight:600;margin-bottom:6px;color:var(--text-accent)">${escapeHtml(skill.name)}</div><div>${escapeHtml(result).replace(/\n/g, '<br>')}</div>`;
            return html;
        } catch (e) {
            return `<div class="sa-error">${skill.name} failed: ${e.message}</div>`;
        }
    }

    hidePopup() {
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }
    }

    // ─── Right-Click Menu ──────────────────────────────────────────────

    onContextMenu(e) {
        const sel = window.getSelection();
        const text = (sel || '').toString().trim();

        // We let Obsidian's native menu render, then add our items
        // This is a hack: listen for menu open after a tick
        setTimeout(() => {
            const menu = document.querySelector('.menu');
            if (!menu || menu.dataset.saEnhanced) return;
            menu.dataset.saEnhanced = '1';

            if (text) {
                // Add copy
                this.addMenuItem(menu, '📋 Copy', () => {
                    navigator.clipboard.writeText(text);
                    new Notice('Copied');
                });
            }

            // Add paste
            this.addMenuItem(menu, '📄 Paste', async () => {
                try {
                    const clip = await navigator.clipboard.readText();
                    const activeEl = document.activeElement;
                    if (activeEl && activeEl.closest('.cm-editor')) {
                        // Let editor handle it
                        document.execCommand('paste');
                    } else if (clip) {
                        new Notice('Click in an editor and press Cmd+V to paste');
                    }
                } catch { /* no clipboard access */ }
            });

            if (text) {
                // Add cut
                this.addMenuItem(menu, '✂️ Cut', () => {
                    navigator.clipboard.writeText(text).then(() => {
                        document.execCommand('delete');
                        new Notice('Cut to clipboard');
                    });
                });
            }
        }, 10);
    }

    addMenuItem(menuEl, label, onClick) {
        // Find separator or end of menu
        const items = menuEl.querySelectorAll('.menu-item');
        const lastItem = items[items.length - 1];
        const separator = document.createElement('div');
        separator.className = 'menu-separator';

        if (lastItem && lastItem.nextSibling) {
            menuEl.insertBefore(separator, lastItem.nextSibling);
        } else {
            menuEl.appendChild(separator);
        }

        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerHTML = `<div class="menu-item-title">${label}</div>`;
        item.addEventListener('click', () => {
            onClick();
            // Close the menu
            menuEl.remove();
        });
        menuEl.appendChild(item);
    }
};

// ─── Settings Tab ─────────────────────────────────────────────────────

class SelectionAssistantSettingsTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        const s = this.plugin.settings;

        // ========== GENERAL ==========
        containerEl.createEl('h2', { text: 'General' });

        new Setting(containerEl)
            .setName('Search engine')
            .setDesc('Open selected text in this search engine')
            .addDropdown(d => d
                .addOption('google', 'Google')
                .addOption('bing', 'Bing')
                .setValue(s.searchEngine)
                .onChange(async (v) => {
                    s.searchEngine = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Translate target language')
            .setDesc('Language code: zh=Chinese, en=English, ja=Japanese, fr=French, etc.')
            .addText(t => t
                .setValue(s.translateTarget)
                .setPlaceholder('zh')
                .onChange(async (v) => {
                    s.translateTarget = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Toolbar max visible')
            .setDesc('Number of buttons shown before overflow "⋯" menu (1-6)')
            .addSlider(sl => sl
                .setLimits(1, 6, 1)
                .setValue(s.toolbarMaxVisible)
                .setDynamicTooltip()
                .onChange(async (v) => {
                    s.toolbarMaxVisible = v;
                    await this.plugin.saveSettings();
                }));

        // ========== LLM ==========
        containerEl.createEl('h2', { text: 'LLM Configuration' });
        containerEl.createEl('p', { text: 'Custom skills use this LLM to process selected text.', cls: 'setting-item-description' });

        new Setting(containerEl)
            .setName('Provider name')
            .addText(t => t
                .setValue(s.llmProvider)
                .setPlaceholder('DeepSeek')
                .onChange(async (v) => {
                    s.llmProvider = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('API Host')
            .setDesc('Anthropic-compatible endpoint')
            .addText(t => t
                .setValue(s.llmHost)
                .setPlaceholder('https://api.deepseek.com/anthropic')
                .onChange(async (v) => {
                    s.llmHost = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('API Key')
            .addText(t => {
                t.inputEl.type = 'password';
                t.setValue(s.llmApiKey)
                    .setPlaceholder('sk-...')
                    .onChange(async (v) => {
                        s.llmApiKey = v;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Model')
            .setDesc('Model name to use for custom skills')
            .addText(t => t
                .setValue(s.llmModel)
                .setPlaceholder('deepseek-v4-pro')
                .onChange(async (v) => {
                    s.llmModel = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Fetch models')
            .setDesc('Pull available models from the API host')
            .addButton(btn => btn
                .setButtonText('Fetch Models')
                .setCta()
                .onClick(async () => {
                    btn.setButtonText('Fetching...');
                    btn.setDisabled(true);
                    try {
                        const models = await LLMService.fetchModels(s);
                        new Notice(`Found ${models.length} models`);
                        // Show in a modal
                        const modal = document.createElement('div');
                        modal.style.cssText = 'position:fixed;z-index:99999;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--background-primary);border-radius:12px;padding:20px;box-shadow:0 8px 40px rgba(0,0,0,0.2);max-width:400px;max-height:500px;overflow-y:auto;';
                        modal.innerHTML = `<h3>Models (${models.length})</h3>` +
                            models.map(m => `<div style="padding:4px 0;cursor:pointer;font-family:monospace;font-size:13px" onclick="navigator.clipboard.writeText('${m}');new Notice('${m}')">${m}</div>`).join('');
                        const overlay = document.createElement('div');
                        overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;';
                        overlay.addEventListener('click', () => { overlay.remove(); modal.remove(); });
                        document.body.appendChild(overlay);
                        document.body.appendChild(modal);
                    } catch (e) {
                        new Notice('Failed: ' + e.message);
                    }
                    btn.setButtonText('Fetch Models');
                    btn.setDisabled(false);
                }));

        new Setting(containerEl)
            .setName('Max output tokens')
            .addSlider(sl => sl
                .setLimits(100, 5000, 100)
                .setValue(s.llmMaxTokens)
                .setDynamicTooltip()
                .onChange(async (v) => {
                    s.llmMaxTokens = v;
                    await this.plugin.saveSettings();
                }));

        // ========== Custom Skills ==========
        containerEl.createEl('h2', { text: 'Custom Skills' });
        containerEl.createEl('p', { text: 'Define up to 5 skills. Use {{text}} as placeholder for selected text.', cls: 'setting-item-description' });

        // Skill list
        const skillContainer = containerEl.createDiv();
        this.renderSkillList(skillContainer);

        // Add skill button
        new Setting(containerEl)
            .addButton(btn => btn
                .setButtonText('+ Add Skill')
                .onClick(async () => {
                    if (s.skills.length >= 5) {
                        new Notice('Maximum 5 custom skills');
                        return;
                    }
                    const newId = 's' + Date.now();
                    s.skills.push({ id: newId, name: 'New Skill', icon: '⚡', prompt: '{{text}}', enabled: true });
                    s.skillOrder.push(newId);
                    await this.plugin.saveSettings();
                    this.renderSkillList(skillContainer);
                }));

        // ========== Button Order ==========
        containerEl.createEl('h2', { text: 'Toolbar Order' });
        containerEl.createEl('p', { text: 'Drag to reorder. First 5 appear on toolbar, rest in "⋯" menu.', cls: 'setting-item-description' });

        const orderContainer = containerEl.createDiv();
        this.renderOrderList(orderContainer);
    }

    renderSkillList(container) {
        container.empty();
        const s = this.plugin.settings;

        for (const skill of s.skills) {
            const row = container.createDiv({ cls: 'setting-item' });
            const info = row.createDiv({ cls: 'setting-item-info' });
            info.createDiv({ cls: 'setting-item-name', text: `${skill.icon} ${skill.name}` });
            info.createDiv({ cls: 'setting-item-description', text: skill.enabled ? 'Enabled' : 'Disabled' });

            const ctrl = row.createDiv({ cls: 'setting-item-control' });

            // Enable toggle
            new Setting(row).addToggle(t => t
                .setValue(skill.enabled)
                .onChange(async (v) => {
                    skill.enabled = v;
                    if (!v) {
                        s.skillOrder = s.skillOrder.filter(id => id !== skill.id);
                    } else if (!s.skillOrder.includes(skill.id)) {
                        s.skillOrder.push(skill.id);
                    }
                    await this.plugin.saveSettings();
                    this.renderSkillList(container);
                    this.renderOrderList(this.orderContainer);
                }));

            // Edit button
            new Setting(row).addButton(btn => btn
                .setButtonText('Edit')
                .onClick(() => this.showSkillEditor(skill, container)));

            // Delete button
            new Setting(row).addButton(btn => btn
                .setButtonText('Delete')
                .setWarning()
                .onClick(async () => {
                    s.skills = s.skills.filter(sk => sk.id !== skill.id);
                    s.skillOrder = s.skillOrder.filter(id => id !== skill.id);
                    await this.plugin.saveSettings();
                    this.renderSkillList(container);
                }));
        }
        this.orderContainer = container.parentElement;
    }

    showSkillEditor(skill, listContainer) {
        const s = this.plugin.settings;
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;z-index:99999;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--background-primary);border-radius:12px;padding:24px;box-shadow:0 8px 40px rgba(0,0,0,0.2);width:420px;';
        modal.innerHTML = `
            <h3>Edit Skill</h3>
            <div style="margin-bottom:8px"><label style="font-size:12px;color:var(--text-muted)">Name</label><br>
            <input id="sk-name" value="${escapeHtml(skill.name)}" style="width:100%;padding:6px;border-radius:6px;border:1px solid var(--background-modifier-border);background:var(--background-primary);margin-top:4px"></div>
            <div style="margin-bottom:8px"><label style="font-size:12px;color:var(--text-muted)">Icon (emoji)</label><br>
            <input id="sk-icon" value="${skill.icon}" style="width:100%;padding:6px;border-radius:6px;border:1px solid var(--background-modifier-border);background:var(--background-primary);margin-top:4px"></div>
            <div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text-muted)">Prompt (use {{text}} for selected text)</label><br>
            <textarea id="sk-prompt" rows="4" style="width:100%;padding:6px;border-radius:6px;border:1px solid var(--background-modifier-border);background:var(--background-primary);margin-top:4px;resize:vertical">${escapeHtml(skill.prompt)}</textarea></div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
                <button id="sk-cancel" style="padding:6px 16px;border-radius:6px;border:1px solid var(--background-modifier-border);background:var(--background-secondary);cursor:pointer">Cancel</button>
                <button id="sk-save" style="padding:6px 16px;border-radius:6px;border:none;background:var(--interactive-accent);color:white;cursor:pointer">Save</button>
            </div>
        `;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;';
        overlay.addEventListener('click', () => { overlay.remove(); modal.remove(); });
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        modal.querySelector('#sk-cancel').addEventListener('click', () => { overlay.remove(); modal.remove(); });
        modal.querySelector('#sk-save').addEventListener('click', async () => {
            skill.name = modal.querySelector('#sk-name').value || skill.name;
            skill.icon = modal.querySelector('#sk-icon').value || skill.icon;
            skill.prompt = modal.querySelector('#sk-prompt').value || skill.prompt;
            await this.plugin.saveSettings();
            overlay.remove();
            modal.remove();
            this.renderSkillList(listContainer);
            this.renderOrderList(this.orderContainer);
        });
    }

    renderOrderList(container) {
        container.empty();
        const s = this.plugin.settings;
        const buttons = this.plugin.getOrderedButtons();

        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const row = container.createDiv({ cls: 'setting-item' });
            const info = row.createDiv({ cls: 'setting-item-info' });
            info.createDiv({ cls: 'setting-item-name', text: `${btn.icon} ${btn.name}` });
            info.createDiv({ cls: 'setting-item-description', text: btn.builtin ? 'Built-in' : 'Custom skill' });

            const ctrl = row.createDiv({ cls: 'setting-item-control' });

            // Move up
            new Setting(row).addButton(b => b
                .setButtonText('↑')
                .setDisabled(i === 0)
                .onClick(async () => {
                    const idx = s.skillOrder.indexOf(btn.id);
                    if (idx > 0) {
                        [s.skillOrder[idx], s.skillOrder[idx - 1]] = [s.skillOrder[idx - 1], s.skillOrder[idx]];
                        await this.plugin.saveSettings();
                        this.renderOrderList(container);
                    }
                }));

            // Move down
            new Setting(row).addButton(b => b
                .setButtonText('↓')
                .setDisabled(i === buttons.length - 1)
                .onClick(async () => {
                    const idx = s.skillOrder.indexOf(btn.id);
                    if (idx < s.skillOrder.length - 1) {
                        [s.skillOrder[idx], s.skillOrder[idx + 1]] = [s.skillOrder[idx + 1], s.skillOrder[idx]];
                        await this.plugin.saveSettings();
                        this.renderOrderList(container);
                    }
                }));
        }
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
