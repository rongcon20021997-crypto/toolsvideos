const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

let WebSocketImpl = null;
try {
  WebSocketImpl = require('ws');
} catch (e) {
  if (typeof WebSocket !== 'undefined') WebSocketImpl = WebSocket;
}

/**
 * Lightweight, Promise-based Chrome DevTools Protocol (CDP) WebSocket client
 */
class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      let WS = WebSocketImpl;
      if (!WS) {
        try { WS = require('ws'); } catch (e) {}
      }
      if (!WS && typeof WebSocket !== 'undefined') {
        WS = WebSocket;
      }

      if (!WS) {
        return reject(new Error('Môi trường không có sẵn WebSocket. Hãy chạy npm install ws.'));
      }

      try {
        this.ws = new WS(this.wsUrl);
      } catch (err) {
        return reject(err);
      }

      const timer = setTimeout(() => {
        this.close();
        reject(new Error('Kết nối CDP tới Google Chrome bị quá thời gian (7s).'));
      }, 7000);

      const onOpen = () => {
        clearTimeout(timer);
        resolve();
      };

      const onError = (err) => {
        clearTimeout(timer);
        reject(err);
      };

      const onMessage = (event) => {
        try {
          const raw = typeof event.data !== 'undefined' ? event.data : event;
          const msg = JSON.parse(raw.toString());
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve: res, reject: rej } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) {
              rej(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              res(msg.result);
            }
          }
        } catch (e) {}
      };

      if (this.ws.on) {
        this.ws.on('open', onOpen);
        this.ws.on('error', onError);
        this.ws.on('message', onMessage);
      } else {
        this.ws.onopen = onOpen;
        this.ws.onerror = onError;
        this.ws.onmessage = onMessage;
      }
    });
  }

  async send(method, params = {}) {
    if (!this.ws || (this.ws.readyState !== 1 && this.ws.readyState !== 1)) {
      throw new Error('Kết nối CDP WebSocket không còn mở');
    }
    const msgId = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(msgId, { resolve, reject });
      try {
        this.ws.send(JSON.stringify({ id: msgId, method, params }));
      } catch (err) {
        this.pending.delete(msgId);
        return reject(err);
      }

      setTimeout(() => {
        if (this.pending.has(msgId)) {
          this.pending.delete(msgId);
          reject(new Error(`Quá thời gian thực thi lệnh CDP: ${method}`));
        }
      }, 10000);
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  close() {
    try {
      if (this.ws && this.ws.close) this.ws.close();
    } catch (e) {}
    this.pending.clear();
  }
}

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
   * Check if Chrome remote debugging port is alive
   */
  async checkIsAlive() {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${this.port}/json/version`, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1200, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Launch Real Google Chrome with persistent user data dir and debugging port
   */
  async launchRealChrome(url = 'https://labs.google/fx/tools/flow') {
    const chromePath = this.getChromePath();
    if (!chromePath) {
      throw new Error('Không tìm thấy Google Chrome trên máy tính của bạn (C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe).');
    }

    const profileDir = this.getProfileDir();

    // Check if Chrome is already active on port 9222
    const isAlive = await this.checkIsAlive();
    if (isAlive) {
      await this.openUrlInRunningChrome(url);
      return {
        success: true,
        message: 'Google Chrome thật đã được mở và kết nối sẵn sàng (Port 9222)!',
        profileDir,
        port: this.port
      };
    }

    // Clean lock file if leftover from abrupt shutdown
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

    // Poll until Chrome debugging port responds (up to 10s)
    let ready = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await this.checkIsAlive()) {
        ready = true;
        break;
      }
    }

    return {
      success: true,
      message: ready 
        ? 'Đã mở Google Chrome thật thành công (Hồ sơ lưu tài khoản vĩnh viễn)!' 
        : 'Đã gửi lệnh mở Google Chrome, vui lòng chờ vài giây để trình duyệt khởi động...',
      profileDir,
      port: this.port
    };
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
            resolve(Array.isArray(tabs) ? tabs : []);
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
    const flowTab = tabs.find(t => t.type === 'page' && t.url && (t.url.includes('labs.google') || t.url.includes('flow.google')));
    if (!flowTab) {
      return new Promise((resolve) => {
        http.get(`http://127.0.0.1:${this.port}/json/new?${encodeURIComponent(url)}`, () => resolve());
      });
    }
  }

  /**
   * Get the active Google Flow tab and instantiate a CDP connection
   */
  async getFlowTabAndCDP() {
    const isAlive = await this.checkIsAlive();
    if (!isAlive) {
      await this.launchRealChrome('https://labs.google/fx/tools/flow');
      await new Promise(r => setTimeout(r, 2500));
    }

    let tabs = await this.getTabs();
    let flowTab = tabs.find(t => t.type === 'page' && t.url && (t.url.includes('/project/') || t.url.includes('/flow')))
      || tabs.find(t => t.type === 'page' && t.url && (t.url.includes('labs.google') || t.url.includes('flow.google')));

    if (!flowTab) {
      await this.openUrlInRunningChrome('https://labs.google/fx/tools/flow');
      await new Promise(r => setTimeout(r, 2000));
      tabs = await this.getTabs();
      flowTab = tabs.find(t => t.type === 'page' && t.url && (t.url.includes('labs.google') || t.url.includes('flow.google')));
    }

    if (!flowTab || !flowTab.webSocketDebuggerUrl) {
      throw new Error('Chưa tìm thấy tab Google Flow trên Chrome. Hãy bấm "1. Mở Trình Duyệt Chrome" trước!');
    }

    const cdp = new CDPClient(flowTab.webSocketDebuggerUrl);
    await cdp.connect();
    return { flowTab, cdp };
  }

  /**
   * Check realtime Flow status (URL, Login status, In Project, Editor detected)
   */
  async getFlowStatus() {
    const isAlive = await this.checkIsAlive();
    if (!isAlive) {
      return {
        chromeAlive: false,
        flowTabFound: false,
        isInProject: false,
        hasPromptBox: false,
        message: 'Chưa mở Chrome'
      };
    }

    try {
      const { flowTab, cdp } = await this.getFlowTabAndCDP();
      try {
        const state = await cdp.evaluate(`
            const isLoginPage = window.location.href.includes('accounts.google.com/signin') || window.location.href.includes('accounts.google.com/v3/signin');
            const hasEditor = Boolean(document.querySelector('[contenteditable="true"], textarea, div[role="textbox"]'));
            const title = document.title || '';

            return {
              url,
              title,
              isLoggedIn: !isLoginPage,
              isInProject: inProject,
              hasPromptBox: hasEditor
            };
          })();
        `);
        cdp.close();

        return {
          chromeAlive: true,
          flowTabFound: true,
          ...state,
          tabTitle: flowTab.title || ''
        };
      } catch (err) {
        cdp.close();
        return {
          chromeAlive: true,
          flowTabFound: true,
          isInProject: flowTab.url.includes('/project/'),
          hasPromptBox: false,
          currentUrl: flowTab.url
        };
      }
    } catch (err) {
      return {
        chromeAlive: true,
        flowTabFound: false,
        message: err.message
      };
    }
  }

  /**
   * STEP 2: Automatically click Create Project / Open Project on Google Flow
   */
  async createFlowProject() {
    const { flowTab, cdp } = await this.getFlowTabAndCDP();

    try {
      const result = await cdp.evaluate(`
        (function() {
          const curUrl = window.location.href;
          
          // 1. Check if already inside an active project editor
          const hasEditor = document.querySelector('[contenteditable="true"], textarea, div[role="textbox"]');
          if (curUrl.includes('/project/') || hasEditor) {
            return {
              success: true,
              alreadyInProject: true,
              message: 'Bạn đã ở trong giao diện dự án Google Flow sẵn sàng!'
            };
          }

          // 2. Search for "New Project", "Dự án mới", "add Dự án mới", "Tạo dự án", "Blank project", "Dự án trống"
          const allClickables = Array.from(document.querySelectorAll('button, a, div[role="button"], [data-test*="project"]'));
          
          // Match priority 1: Specific create project text (matches "add Dự án mới", "Dự án mới", "New project")
          const newProjectBtn = allClickables.find(b => {
            const t = (b.innerText || b.getAttribute('aria-label') || b.getAttribute('title') || '').toLowerCase().trim();
            return t.includes('dự án mới') || t.includes('new project') || 
                   t.includes('tạo dự án') || t.includes('create project') ||
                   t.includes('dự án trống') || t.includes('blank project') ||
                   t.includes('bắt đầu dự án');
          });

          if (newProjectBtn) {
            newProjectBtn.click();
            return {
              success: true,
              clicked: true,
              buttonText: newProjectBtn.innerText?.trim() || 'Tạo dự án',
              message: 'Đã bấm nút "Dự án mới" trên Google Flow!'
            };
          }

          // Match priority 2: Existing project cards / links
          const existingProject = document.querySelector('a[href*="/project/"], [data-project-id], a[href*="flow.google.com/project"]');
          if (existingProject) {
            existingProject.click();
            return {
              success: true,
              clicked: true,
              openedExisting: true,
              message: 'Đang mở dự án gần nhất trên Google Flow...'
            };
          }

          // Match priority 3: Generic "Try Flow", "Khám phá", "Bắt đầu", "Launch"
          const launchBtn = allClickables.find(b => {
            const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
            return t.includes('try flow') || t.includes('thử flow') || t.includes('get started') || t.includes('bắt đầu');
          });

          if (launchBtn) {
            launchBtn.click();
            return {
              success: true,
              clicked: true,
              message: 'Đã bấm nút bắt đầu trên Google Flow!'
            };
          }

          // Match priority 4: Look for plus icons (+)
          const plusBtn = allClickables.find(b => {
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            const text = (b.innerText || '').trim();
            return aria.includes('thêm') || aria.includes('tạo') || aria.includes('add') || aria.includes('new') || text === '+';
          });

          if (plusBtn) {
            plusBtn.click();
            return {
              success: true,
              clicked: true,
              message: 'Đã bấm nút tạo mới (+) trên Google Flow!'
            };
          }

          return {
            success: false,
            message: 'Không tìm thấy nút "Dự án mới" trên màn hình. Hãy kiểm tra xem tab Chrome đã tải xong trang chưa hoặc bấm Tạo dự án trực tiếp trên Chrome.'
          };
        })();
      `);

      cdp.close();
      return result || { success: false, message: 'Không nhận được phản hồi từ Chrome' };
    } catch (err) {
      cdp.close();
      throw err;
    }
  }

  /**
   * STEP 3: Setup Character Profile & Reference Image on Google Flow
   */
  async setupFlowCharacter({ name = '', appearance = '', outfit = '', artStyle = '', imagePath = null }) {
    const { flowTab, cdp } = await this.getFlowTabAndCDP();

    try {
      const hasImage = Boolean(imagePath && fs.existsSync(imagePath));
      const charDesc = [
        name ? `Nhân vật: ${name}` : '',
        appearance ? `Diện mạo: ${appearance}` : '',
        outfit ? `Trang phục: ${outfit}` : '',
        artStyle ? `Phong cách: ${artStyle}` : ''
      ].filter(Boolean).join('. ');

      // Step A: Click "Nhân vật" button on Flow project toolbar
      await cdp.evaluate(`
        (function() {
          const charBtn = Array.from(document.querySelectorAll('button')).find(b => 
            (b.innerText || '').includes('Nhân vật') || 
            (b.getAttribute('aria-label') || '').includes('Nhân vật')
          );
          if (charBtn) charBtn.click();
          return { clickedCharBtn: Boolean(charBtn) };
        })()
      `);

      await new Promise(r => setTimeout(r, 600));

      // Step B: If reference image exists, click "Tải lên" to open file input & set file via CDP
      let imageUploaded = false;
      if (hasImage) {
        await cdp.evaluate(`
          (function() {
            const upBtn = Array.from(document.querySelectorAll('button')).find(b => 
              (b.innerText || '').includes('Tải lên') || 
              (b.getAttribute('aria-label') || '').includes('Tải lên')
            );
            if (upBtn) upBtn.click();
            return { clickedUpload: Boolean(upBtn) };
          })()
        `);

        await new Promise(r => setTimeout(r, 600));

        try {
          const doc = await cdp.send('DOM.getDocument');
          const rootNodeId = doc?.root?.nodeId;
          if (rootNodeId) {
            const queryRes = await cdp.send('DOM.querySelector', {
              nodeId: rootNodeId,
              selector: 'input[type="file"]'
            });

            if (queryRes?.nodeId) {
              await cdp.send('DOM.setFileInputFiles', {
                files: [imagePath],
                nodeId: queryRes.nodeId
              });
              imageUploaded = true;
              await new Promise(r => setTimeout(r, 1200));
            }
          }
        } catch (imgErr) {
          console.warn('Lỗi đính kèm file ảnh nhân vật qua CDP:', imgErr);
        }
      }

      // Step C: Fill character description into the character textarea (or prompt box) and click Xong
      const safeDesc = JSON.stringify(charDesc || 'Nhân vật chính');
      await cdp.evaluate(`
        (function() {
          const text = ${safeDesc};
          const ta = document.querySelector('textarea, [contenteditable="true"]');
          if (ta) {
            ta.focus();
            if (ta.tagName === 'TEXTAREA') {
              ta.value = text;
              ta.dispatchEvent(new Event('input', { bubbles: true }));
              ta.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
              document.execCommand('selectAll', false, null);
              document.execCommand('insertText', false, text);
              ta.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
              ta.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            }
          }

          // Step D: If there is a "Xong" or "Done" button, click it to save!
          setTimeout(() => {
            const doneBtn = Array.from(document.querySelectorAll('button')).find(b => {
              const t = (b.innerText || '').trim();
              return t === 'Xong' || t === 'Done' || t.includes('Lưu') || t.includes('Save');
            });
            if (doneBtn) doneBtn.click();
          }, 400);

          return { success: true };
        })()
      `);

      await new Promise(r => setTimeout(r, 800));
      cdp.close();

      const summary = [
        name ? `Nhân vật: ${name}` : 'Nhân vật chính',
        imageUploaded ? '✓ Đã tải ảnh chân dung lên Flow' : (hasImage ? 'Đang tải ảnh' : 'Đã điền mô tả diện mạo nhân vật')
      ].filter(Boolean).join(' | ');

      return {
        success: true,
        imageUploaded,
        characterName: name,
        message: `Đã thiết lập thông tin nhân vật thành công! (${summary})`
      };
    } catch (err) {
      cdp.close();
      throw err;
    }
  }

  /**
   * STEP 4 / BATCH: Automatically inject scene prompt into Google Flow and click Generate
   */
  async injectPromptToChrome(input) {
    let fullPrompt = '';
    let imagePath = null;
    let autoSubmit = true;

    if (typeof input === 'object' && input !== null) {
      fullPrompt = input.prompt || '';
      imagePath = input.imagePath || null;
      if (typeof input.autoSubmit !== 'undefined') autoSubmit = input.autoSubmit;
    } else {
      fullPrompt = String(input || '');
    }

    const { flowTab, cdp } = await this.getFlowTabAndCDP();

    try {
      const hasImage = Boolean(imagePath && fs.existsSync(imagePath));

      // 1. Ensure Video mode is chosen and prepare editor
      await cdp.evaluate(`
        (function() {
          // Select Video mode button if not selected
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

          // If image upload is requested
          if (${hasImage}) {
            const addBtn = document.querySelector('button[aria-label*="thành phần" i], button[aria-label*="ingredient" i], button[aria-label*="Thêm" i]');
            if (addBtn) addBtn.click();
            setTimeout(() => {
              const upBtn = Array.from(document.querySelectorAll('button')).find(b => 
                (b.innerText || '').includes('Tải nội dung') ||
                (b.innerText || '').includes('Tải ảnh') ||
                (b.innerText || '').includes('Tải lên')
              );
              if (upBtn) upBtn.click();
            }, 250);
          }
        })();
      `);

      // 2. Attach reference image if provided
      if (hasImage) {
        try {
          await new Promise(r => setTimeout(r, 600));
          const doc = await cdp.send('DOM.getDocument');
          const rootNodeId = doc?.root?.nodeId;
          if (rootNodeId) {
            const fileInput = await cdp.send('DOM.querySelector', {
              nodeId: rootNodeId,
              selector: 'input[type="file"]'
            });
            if (fileInput?.nodeId) {
              await cdp.send('DOM.setFileInputFiles', {
                files: [imagePath],
                nodeId: fileInput.nodeId
              });
              await new Promise(r => setTimeout(r, 800));
            }
          }
        } catch (e) {}
      }

      // 3. Type prompt into editor and click Create
      const safePrompt = JSON.stringify(fullPrompt);
      const evalResult = await cdp.evaluate(`
        (function() {
          const text = ${safePrompt};
          let editor = document.querySelector('[contenteditable="true"], div[role="textbox"], textarea, [contenteditable]');
          
          if (!editor) {
            // Check if not logged in
            if (window.location.href.includes('accounts.google.com/signin')) {
              return { success: false, reason: 'Bạn chưa đăng nhập Google trên Chrome. Vui lòng bấm Đăng Nhập trên Chrome rồi thử lại!' };
            }

            // Check if project needs to be opened
            const projectLink = document.querySelector('a[href*="/project/"], [data-project-id]');
            if (projectLink) {
              projectLink.click();
              return { success: true, navigating: true, reason: 'Đang tự động mở dự án trên Google Flow...' };
            }

            return { success: false, reason: 'Chưa thấy ô nhập prompt. Vui lòng bấm "Bước 2: Tạo Dự Án" trước!' };
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

          // Submit if requested
          if (!${autoSubmit}) {
            return { success: true, clicked: false, textFilled: true, textLength: text.length };
          }

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
      `);

      // If button was disabled or not clicked, send Enter key via CDP
      if (evalResult && evalResult.success && autoSubmit && !evalResult.clicked && !evalResult.navigating) {
        try {
          await cdp.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            windowsVirtualKeyCode: 13,
            key: 'Enter',
            code: 'Enter',
            text: '\r',
            unmodifiedText: '\r'
          });
          await cdp.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            windowsVirtualKeyCode: 13,
            key: 'Enter',
            code: 'Enter'
          });
          evalResult.clicked = true;
        } catch (keyErr) {}
      }

      cdp.close();

      if (evalResult && evalResult.success && (evalResult.clicked || evalResult.textFilled)) {
        return { injected: true, ...evalResult };
      }

      return { injected: false, ...evalResult };
    } catch (err) {
      cdp.close();
      throw err;
    }
  }
}

module.exports = new ChromeLauncher();
