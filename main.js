const { Plugin, PluginSettingTab, Setting, MarkdownView } = require('obsidian');

const DEFAULT_SETTINGS = {
    enabled: true,
    indentString: '⠀⠀' // 2 U+2800 chars
};

module.exports = class AutoRedLinePlugin extends Plugin {
    async onload() {
        await this.loadSettings();

        this.addSettingTab(new AutoRedLineSettingTab(this.app, this));

        // event capture to prevent CodeMirror from creating its own newline
        this.registerDomEvent(document, 'keydown', (evt) => {
            if (!this.settings.enabled) return;
			
            if (evt.key !== 'Enter' || evt.shiftKey || evt.ctrlKey || evt.altKey || evt.metaKey || evt.isComposing) return;

            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView || activeView.getMode() !== 'source') return;
			
            if (evt.target && !activeView.contentEl.contains(evt.target)) return;

            const editor = activeView.editor;
            const cursor = editor.getCursor();
            const currentLine = editor.getLine(cursor.line);
            const realText = currentLine.replace(/[⠀\s]/g, '');

            if (realText.length > 0) {
                evt.preventDefault();
                evt.stopPropagation();
                editor.replaceSelection('\n' + this.settings.indentString);
            } else {
                evt.preventDefault();
                evt.stopPropagation();

                if (currentLine.length > 0) { // if line contained only indentation -  clear it before inserting a plain newline
                    editor.setLine(cursor.line, '');
                }
                editor.replaceSelection('\n');
            }
        }, true);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
};

class AutoRedLineSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Auto Red Line' });

        new Setting(containerEl)
            .setName('Enable Auto Red Line')
            .setDesc('Inserts 2 Braille Blank symbols')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enabled)
                .onChange(async (value) => {
                    this.plugin.settings.enabled = value;
                    await this.plugin.saveSettings();
                }));
    }
};
