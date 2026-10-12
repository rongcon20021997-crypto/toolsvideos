const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

class ChromeLauncher {
  constructor() {
    this.chromeProcess = null;
    this.port = 9222;
  }

  getChromePath() {
    const candidatePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  getProfileDir() {
    const profileDir = path.join(process.env.APPDATA || '', 'veo3-video-studio', 'GoogleFlow_ChromeProfile');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    return profileDir;
  }

  /**
   * Launch Real Google Chrome with persistent user data dir and debugging port
   */
  async launchRealChrome(url = 'https://labs.google/fx/tools/flow') {
    const chromePath = this.getChromePath();
    if (!chromePath) {
      throw new Error('Không tìm thấy trình duyệt Google Chrome trên máy tính của bạn (C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe).');
    }

    const profileDir = this.getProfileDir();

    // Check if Chrome with this profile is already running
    const isAlive = await this.checkIsAlive();
    if (isAlive) {
      // Just focus or open URL
      await this.openUrlInRunningChrome(url);
      return { success: true, message: 'Google Chrome thật đã được mở và lưu hồ sơ vĩnh viễn', profileDir };
    }

    try {
      const lockFile = path.join(profileDir, 'SingletonLock');
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
    } catch (e) {}

    const args = [
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${this.port}`,
      '--remote-allow-origins=*',
      '--no-first-run',
      '--no-default-browser-check',
      url
    ];

    this.chromeProcess = spawn(chromePath, args, {
      detached: true,
      stdio: 'ignore'
    });

    this.chromeProcess.unref();

    return {
      success: true,
      message: 'Đã mở Google Chrome thật với hồ sơ lưu vĩnh viễn!',
      profileDir,
      port: this.port
    };
  }

  /**
   * Check if Chrome debugging port is active
   */
  async checkIsAlive() {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${this.port}/json/version`, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Fetch active tabs from Chrome remote debugging
   */
  async getTabs() {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${this.port}/json`, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const tabs = JSON.parse(raw);
            resolve(tabs);
          } catch (e) {
            resolve([]);
          }
        });
      });
      req.on('error', () => resolve([]));
    });
  }

  /**
   * Open or navigate to URL in already running Chrome instance
   */
  async openUrlInRunningChrome(url) {
    const tabs = await this.getTabs();
    const flowTab = tabs.find(t => t.url && (t.url.includes('labs.google') || t.url.includes('flow.google')));
    if (!flowTab) {
      http.get(`http://127.0.0.1:${this.port}/json/new?${encodeURIComponent(url)}`, () => {});
    }
  }

  /**
   * Automatically send prompt and optional reference image into Google Flow running in real Chrome
   */
  async injectPromptToChrome(input) {
    let fullPrompt = '';
    let imagePath = null;
    if (typeof input === 'object' && input !== null) {
      fullPrompt = input.prompt || '';
      imagePath = input.imagePath || null;
    } else {
      fullPrompt = String(input || '');
    }

    // Ensure Chrome is alive; if not, launch it
    const isAlive = await this.checkIsAlive();
    if (!isAlive) {
      await this.launchRealChrome('https://labs.google/fx/tools/flow');
      await new Promise(r => setTimeout(r, 3000));
    }

    let tabs = await this.getTabs();
    let targetTab = tabs.find(t => t.url && (t.url.includes('/project/') || t.url.includes('/flow'))) 
      || tabs.find(t => t.url && (t.url.includes('labs.google') || t.url.includes('flow.google')));
    
    if (!targetTab) {
      await this.openUrlInRunningChrome('https://labs.google/fx/tools/flow');
      await new Promise(r => setTimeout(r, 2000));
      tabs = await this.getTabs();
      targetTab = tabs.find(t => t.url && (t.url.includes('labs.google') || t.url.includes('flow.google')));
    }

    if (!targetTab || !targetTab.webSocketDebuggerUrl) {
      throw new Error('Chưa kết nối được với Google Flow trên Chrome. Hãy nhấn "Mở Chrome Thật" và mở một dự án trên Flow!');
    }

    const hasImage = Boolean(imagePath && fs.existsSync(imagePath));

    return new Promise((resolve, reject) => {
      const WS = typeof WebSocket !== 'undefined' ? WebSocket : (function() {
        try { return require('ws'); } catch (e) { return null; }
      })();

      if (!WS) {
        return resolve({ injected: false, prompt: fullPrompt });
      }

      const ws = new WS(targetTab.webSocketDebuggerUrl);
      const safePrompt = JSON.stringify(fullPrompt);
      let docRootId = null;

      const closeWs = () => {
        try {
          if (ws.close) ws.close();
        } catch (e) {}
      };

      const doTypeAndSubmit = () => {
        const expression = `
          (function() {
            const text = ${safePrompt};
            let editor = document.querySelector('[contenteditable="true"], div[role="textbox"], textarea, [contenteditable]');
            
            if (!editor) {
              // 1. Detect if user has not logged in to Google yet
              const loginBtn = Array.from(document.querySelectorAll('a, button')).find(b => {
                const href = (b.getAttribute('href') || '').toLowerCase();
                const t = (b.innerText || '').toLowerCase().trim();
                return href.includes('accounts.google.com') || t === 'đăng nhập' || t === 'sign in';
              });
              if (loginBtn) {
                return { success: false, reason: 'Bạn chưa đăng nhập Google trên Chrome. Vui lòng bấm Đăng Nhập trên cửa sổ Chrome rồi thử lại!' };
              }

              // 2. Detect existing project links
              const projectLink = document.querySelector('a[href*="/project/"], [data-project-id], a[href*="flow.google.com/project"]');
              if (projectLink) {
                projectLink.click();
                return { success: true, navigating: true, message: 'Đang tự động mở dự án trên Google Flow...' };
              }

              // 3. Detect "New project" or "Try Flow" / "Get started" buttons
              const actionBtn = Array.from(document.querySelectorAll('button, a')).find(b => {
                const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
                return t.includes('dự án mới') || t.includes('new project') || t.includes('tạo dự án') || 
                       t.includes('create project') || t.includes('try flow') || t.includes('thử flow') ||
                       t.includes('get started') || t.includes('bắt đầu') || t.includes('launch');
              });
              if (actionBtn) {
                actionBtn.click();
                return { success: true, navigating: true, message: 'Đang bấm bắt đầu / mở dự án mới trên Google Flow...' };
              }

              return { success: false, reason: 'Chưa thấy ô nhập prompt. Vui lòng mở hoặc tạo 1 dự án trên tab Google Flow!' };
            }

            editor.focus();
            if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
              editor.value = text;
              editor.dispatchEvent(new Event('input', { bubbles: true }));
              editor.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
              document.execCommand('selectAll', false, null);
              const inserted = document.execCommand('insertText', false, text);
              if (!inserted || !editor.innerText.includes(text.slice(0, 10))) {
                editor.innerText = text;
              }
              editor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
              editor.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            }

            // Try clicking the submit button directly
            let btn = document.querySelector('button[aria-label="Bắt đầu tạo"], button[aria-label*="tạo" i], button[aria-label*="Tạo" i], button[aria-label*="Generate" i], button[aria-label*="arrow" i], button[aria-label*="Gửi" i], button[type="submit"]');
            let clicked = false;
            if (btn && !btn.disabled) {
              btn.click();
              clicked = true;
            } else if (!btn) {
              const parent = editor.closest('form') || editor.parentElement?.parentElement;
              if (parent) {
                const anyBtn = Array.from(parent.querySelectorAll('button')).find(b => !b.disabled && b.offsetWidth > 0);
                if (anyBtn) {
                  anyBtn.click();
                  clicked = true;
                }
              }
            }

            return { success: true, clicked, textLength: text.length };
          })();
        `;

        ws.send(JSON.stringify({
          id: 1001,
          method: 'Runtime.evaluate',
          params: { expression, returnByValue: true }
        }));
      };

      const onOpen = () => {
        // Step 1: Ensure Video mode is selected and prepare image upload if image exists
        const prepExpr = `
          (function() {
            // 1. Ensure Video Mode is selected
            const videoBtn = Array.from(document.querySelectorAll('button')).find(b => 
              (b.innerText || '').includes('Video') || 
              (b.innerText || '').includes('videocam') ||
              (b.getAttribute('aria-label') || '').includes('Video')
            );
            if (videoBtn) {
              const isSelected = videoBtn.getAttribute('aria-selected') === 'true' || 
                                 videoBtn.classList.contains('selected') || 
                                 (videoBtn.innerText || '').includes('crop_16_9') ||
                                 (videoBtn.innerText || '').includes('720p');
              if (!isSelected) videoBtn.click();
            }

            // 2. If uploading image, click add ingredient
            if (${hasImage}) {
              const addBtn = document.querySelector('button[aria-label="Thêm thành phần vào ô nhập câu lệnh"], button[aria-label*="thành phần" i]');
              if (addBtn) addBtn.click();
              setTimeout(() => {
                const upBtn = Array.from(document.querySelectorAll('button')).find(b => 
                  (b.innerText || '').includes('Tải nội dung nghe nhìn lên') ||
                  (b.innerText || '').includes('Tải ảnh') ||
                  (b.innerText || '').includes('Tải lên')
                );
                if (upBtn) upBtn.click();
              }, 300);
            }

            return { ready: true };
          })();
        `;

        ws.send(JSON.stringify({
          id: 1000,
          method: 'Runtime.evaluate',
          params: { expression: prepExpr, returnByValue: true }
        }));
      };

      const onMsg = (event) => {
        try {
          const raw = typeof event.data !== 'undefined' ? event.data : event;
          const res = JSON.parse(raw.toString());

          if (res.id === 1000) {
            if (hasImage) {
              setTimeout(() => {
                ws.send(JSON.stringify({ id: 1005, method: 'DOM.getDocument' }));
              }, 500);
            } else {
              doTypeAndSubmit();
            }
          } else if (res.id === 1005) {
            docRootId = res.result?.root?.nodeId;
            ws.send(JSON.stringify({
              id: 1006,
              method: 'DOM.querySelector',
              params: { nodeId: docRootId, selector: 'input[type="file"]' }
            }));
          } else if (res.id === 1006) {
            const fileNodeId = res.result?.nodeId;
            if (fileNodeId) {
              ws.send(JSON.stringify({
                id: 1007,
                method: 'DOM.setFileInputFiles',
                params: { files: [imagePath], nodeId: fileNodeId }
              }));
            } else {
              doTypeAndSubmit();
            }
          } else if (res.id === 1007) {
            // Reference image attached! Wait 800ms then type & submit
            setTimeout(doTypeAndSubmit, 800);
          } else if (res.id === 1001) {
            const val = res.result?.result?.value;
            if (val && val.success && val.clicked) {
              // Button clicked successfully, done!
              closeWs();
              resolve({ injected: true, result: val, submitted: true });
            } else if (val && val.success && !val.clicked && !val.navigating) {
              // Text typed but button was disabled, dispatch hardware Enter key via CDP
              ws.send(JSON.stringify({
                id: 1002,
                method: 'Input.dispatchKeyEvent',
                params: {
                  type: 'keyDown',
                  windowsVirtualKeyCode: 13,
                  key: 'Enter',
                  code: 'Enter',
                  text: '\r',
                  unmodifiedText: '\r'
                }
              }));
              ws.send(JSON.stringify({
                id: 1003,
                method: 'Input.dispatchKeyEvent',
                params: {
                  type: 'keyUp',
                  windowsVirtualKeyCode: 13,
                  key: 'Enter',
                  code: 'Enter'
                }
              }));
            } else if (val && val.navigating) {
              // Navigating to project page, close and report
              closeWs();
              resolve({ injected: false, navigating: true, reason: val.message || 'Đang mở dự án...' });
            } else {
              // Editor not found or injection failed
              closeWs();
              resolve({ injected: false, reason: val?.reason || 'Chưa thấy ô nhập prompt. Hãy mở 1 dự án trên Google Flow!' });
            }
          } else if (res.id === 1003) {
            closeWs();
            resolve({ injected: true, submitted: true });
          }
        } catch (e) {
          closeWs();
          resolve({ injected: false, error: e.message });
        }
      };

      if (ws.on) {
        ws.on('open', onOpen);
        ws.on('message', onMsg);
        ws.on('error', (err) => { closeWs(); reject(err); });
      } else {
        ws.onopen = onOpen;
        ws.onmessage = onMsg;
        ws.onerror = (err) => { closeWs(); reject(err); };
      }

      setTimeout(() => {
        closeWs();
        resolve({ injected: false, timeout: true });
      }, 7000);
    });
  }
}

module.exports = new ChromeLauncher();

