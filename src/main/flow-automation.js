const { BrowserWindow, session, ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');

class FlowAutomationManager {
  constructor() {
    this.flowWindow = null;
    this.currentProjectData = null;
  }

  /**
   * Open or focus the dedicated Google Flow browser window with Veo Studio Companion injected
   */
  async openFlowWindow({ scenes = [], characterProfile = {}, activeIndex = 0, exportDirectory = '' }, mainWindow) {
    this.currentProjectData = {
      scenes,
      characterProfile,
      activeIndex,
      exportDirectory: exportDirectory || path.join(app.getPath('videos'), 'Veo3StudioExports')
    };

    if (this.flowWindow && !this.flowWindow.isDestroyed()) {
      this.flowWindow.focus();
      this.updateCompanionData();
      return { success: true, message: 'Focused existing Google Flow window' };
    }

    this.flowWindow = new BrowserWindow({
      width: 1350,
      height: 900,
      minWidth: 1000,
      minHeight: 650,
      title: 'Google Labs Flow - Veo 3 Studio Auto Companion',
      backgroundColor: '#0f172a',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false
      }
    });

    // Handle video auto-download into user's Veo exports directory
    this.flowWindow.webContents.session.on('will-download', (event, item) => {
      const exportDir = this.currentProjectData.exportDirectory;
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const origName = item.getFilename();
      const sceneNum = (this.currentProjectData.activeIndex || 0) + 1;
      const safeFilename = origName.toLowerCase().endsWith('.mp4') 
        ? `Scene_${String(sceneNum).padStart(2, '0')}_${origName}` 
        : `Scene_${String(sceneNum).padStart(2, '0')}_VeoFlow.mp4`;

      const targetPath = path.join(exportDir, safeFilename);
      item.setSavePath(targetPath);

      item.once('done', (e, state) => {
        if (state === 'completed' && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('flow:video-downloaded', {
            filePath: targetPath,
            sceneIndex: this.currentProjectData.activeIndex
          });
        }
      });
    });

    // Load Google Labs Flow URL
    await this.flowWindow.loadURL('https://labs.google/fx/tools/flow');

    // Inject Studio Companion Toolbar once page finishes loading
    this.flowWindow.webContents.on('did-finish-load', () => {
      this.injectCompanionToolbar();
    });

    this.flowWindow.on('closed', () => {
      this.flowWindow = null;
    });

    return { success: true };
  }

  /**
   * Inject floating UI toolbar directly into Google Labs Flow web page using safe DOM (no innerHTML)
   */
  injectCompanionToolbar() {
    if (!this.flowWindow || this.flowWindow.isDestroyed()) return;

    const payload = JSON.stringify(this.currentProjectData || { scenes: [], activeIndex: 0 });

    const injectionScript = `
      (function() {
        if (!document.body) return;

        window.__VEO_STUDIO_DATA = ${payload};

        if (document.getElementById('veo-studio-companion-bar')) {
          if (window.__updateVeoCompanionUI) window.__updateVeoCompanionUI();
          return;
        }

        function el(tag, styles, text) {
          const e = document.createElement(tag);
          if (styles) {
            for (const k in styles) {
              e.style[k] = styles[k];
            }
          }
          if (text) e.textContent = text;
          return e;
        }

        const bar = el('div', {
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: '2147483647',
          width: '90%',
          maxWidth: '960px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(139, 92, 246, 0.5)',
          borderRadius: '14px',
          padding: '12px 18px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7), 0 0 25px rgba(139, 92, 246, 0.3)',
          color: '#f8fafc',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        });
        bar.id = 'veo-studio-companion-bar';

        // Top Header
        const header = el('div', {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '8px'
        });

        const headerLeft = el('div', { display: 'flex', alignItems: 'center', gap: '8px' });
        const badge = el('span', {
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          color: 'white',
          fontSize: '11px',
          fontWeight: '700',
          padding: '3px 8px',
          borderRadius: '6px',
          letterSpacing: '0.5px'
        }, 'VEO 3 COMPANION');
        const titleEl = el('strong', { color: '#e2e8f0', fontSize: '13px' }, 'Phân cảnh 1');
        titleEl.id = 'veo-scene-title';
        headerLeft.appendChild(badge);
        headerLeft.appendChild(titleEl);

        const headerRight = el('div', { display: 'flex', alignItems: 'center', gap: '8px' });
        const sel = el('select', {
          background: '#1e293b',
          color: '#cbd5e1',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '4px 8px',
          fontSize: '12px',
          outline: 'none',
          cursor: 'pointer'
        });
        sel.id = 'veo-scene-select';

        const prevBtn = el('button', {
          background: '#334155',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '4px 10px',
          cursor: 'pointer',
          fontWeight: '600'
        }, '◀ Trước');
        prevBtn.id = 'veo-btn-prev';

        const nextBtn = el('button', {
          background: '#334155',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '4px 10px',
          cursor: 'pointer',
          fontWeight: '600'
        }, 'Sau ▶');
        nextBtn.id = 'veo-btn-next';

        const toggleBtn = el('button', {
          background: 'transparent',
          color: '#94a3b8',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px'
        }, '✕');
        toggleBtn.id = 'veo-btn-toggle';

        headerRight.appendChild(sel);
        headerRight.appendChild(prevBtn);
        headerRight.appendChild(nextBtn);
        headerRight.appendChild(toggleBtn);

        header.appendChild(headerLeft);
        header.appendChild(headerRight);
        bar.appendChild(header);

        // Action Row
        const actionRow = el('div', { display: 'flex', gap: '10px', alignItems: 'center' });
        const prevEl = el('div', {
          flex: '1',
          background: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#cbd5e1',
          fontSize: '12px',
          maxHeight: '48px',
          overflowY: 'auto',
          lineHeight: '1.4',
          wordBreak: 'break-word'
        }, 'Đang tải prompt...');
        prevEl.id = 'veo-prompt-preview';

        const fillBtn = el('button', {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          fontWeight: '700',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
        }, '⚡ Tự Động Điền & Bấm Tạo');
        fillBtn.id = 'veo-btn-fill-prompt';

        const copyBtn = el('button', {
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 14px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }, '📋 Copy Prompt');
        copyBtn.id = 'veo-btn-copy';

        actionRow.appendChild(prevEl);
        actionRow.appendChild(fillBtn);
        actionRow.appendChild(copyBtn);
        bar.appendChild(actionRow);

        document.body.appendChild(bar);

        function getFullPrompt(scene) {
          if (!scene) return '';
          const profile = window.__VEO_STUDIO_DATA.characterProfile || {};
          let p = scene.prompt || '';
          if (profile.name && profile.appearance) {
            p = '[Character: ' + profile.name + ', ' + profile.appearance + ', wearing ' + (profile.outfit || '') + ']. ' + p;
          }
          if (profile.artStyle) {
            p += ', ' + profile.artStyle;
          }
          return p;
        }

        window.__updateVeoCompanionUI = function() {
          const data = window.__VEO_STUDIO_DATA;
          const scenes = data.scenes || [];
          let activeIdx = data.activeIndex || 0;
          if (activeIdx < 0) activeIdx = 0;
          if (activeIdx >= scenes.length && scenes.length > 0) activeIdx = scenes.length - 1;
          data.activeIndex = activeIdx;

          sel.textContent = '';
          scenes.forEach((sc, i) => {
            const opt = el('option', {}, 'Scene #' + (sc.number || (i+1)) + ': ' + (sc.title || 'Phân cảnh').substring(0, 28));
            opt.value = i;
            if (i === activeIdx) opt.selected = true;
            sel.appendChild(opt);
          });

          const curScene = scenes[activeIdx];
          if (curScene) {
            titleEl.textContent = 'Phân cảnh #' + (curScene.number || (activeIdx + 1)) + ': ' + (curScene.title || '');
            prevEl.textContent = getFullPrompt(curScene);
          } else {
            prevEl.textContent = 'Chưa có phân cảnh nào trong Storyboard!';
          }
        };

        sel.addEventListener('change', (e) => {
          window.__VEO_STUDIO_DATA.activeIndex = parseInt(e.target.value);
          window.__updateVeoCompanionUI();
        });

        prevBtn.addEventListener('click', () => {
          if (window.__VEO_STUDIO_DATA.activeIndex > 0) {
            window.__VEO_STUDIO_DATA.activeIndex--;
            window.__updateVeoCompanionUI();
          }
        });

        nextBtn.addEventListener('click', () => {
          const scs = window.__VEO_STUDIO_DATA.scenes || [];
          if (window.__VEO_STUDIO_DATA.activeIndex < scs.length - 1) {
            window.__VEO_STUDIO_DATA.activeIndex++;
            window.__updateVeoCompanionUI();
          }
        });

        toggleBtn.addEventListener('click', () => {
          bar.style.display = 'none';
        });

        copyBtn.addEventListener('click', () => {
          const scenes = window.__VEO_STUDIO_DATA.scenes || [];
          const cur = scenes[window.__VEO_STUDIO_DATA.activeIndex];
          if (cur) {
            const text = getFullPrompt(cur);
            navigator.clipboard.writeText(text);
            copyBtn.textContent = '✓ Đã Copy!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy Prompt'; }, 2000);
          }
        });

        fillBtn.addEventListener('click', () => {
          const scenes = window.__VEO_STUDIO_DATA.scenes || [];
          const cur = scenes[window.__VEO_STUDIO_DATA.activeIndex];
          if (!cur) return;
          const text = getFullPrompt(cur);

          const target = document.querySelector('textarea, [contenteditable="true"], input[placeholder*="video"], input[placeholder*="prompt"], input[placeholder*="Describe"], textarea[placeholder*="Describe"]');
          if (target) {
            target.focus();
            if (target.isContentEditable) {
              target.innerText = text;
              target.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
            } else {
              target.value = text;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              target.dispatchEvent(new Event('change', { bubbles: true }));
            }

            setTimeout(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const submitBtn = buttons.find(b => {
                const label = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase();
                return label.includes('create') || label.includes('generate') || label.includes('tạo') || label.includes('run') || label.includes('send');
              });
              if (submitBtn) submitBtn.click();
            }, 300);

            fillBtn.textContent = '✓ Đã Điền Thành Công!';
            setTimeout(() => { fillBtn.textContent = '⚡ Tự Động Điền & Bấm Tạo'; }, 2500);
          } else {
            navigator.clipboard.writeText(text);
            alert('Đã copy prompt của phân cảnh này vào Clipboard! Bạn hãy bấm chuột vào ô nhập và nhấn Ctrl + V để dán.');
          }
        });

        window.__updateVeoCompanionUI();
      })();
    `;

    this.flowWindow.webContents.executeJavaScript(injectionScript).catch(err => {
      console.warn('Failed to inject companion toolbar:', err);
    });
  }

  updateCompanionData() {
    this.injectCompanionToolbar();
  }
}

module.exports = new FlowAutomationManager();
