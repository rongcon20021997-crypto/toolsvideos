const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // File dialogs
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  selectImage: (title) => ipcRenderer.invoke('dialog:select-image', title),

  // Project management
  saveProject: (projectData) => ipcRenderer.invoke('project:save', projectData),
  loadProject: () => ipcRenderer.invoke('project:load'),

  // Shell
  openFolder: (folderPath) => ipcRenderer.invoke('shell:open-folder', folderPath),
  openFile: (filePath) => ipcRenderer.invoke('shell:open-file', filePath),

  // Script & Storyboard Generator (10-20 scenes)
  generateScenes: (params) => ipcRenderer.invoke('script:generate-scenes', params),

  // Veo API lifecycle
  listModels: () => ipcRenderer.invoke('veo:list-models'),
  submitVeoScene: (params) => ipcRenderer.invoke('veo:submit-scene', params),
  checkVeoStatus: (params) => ipcRenderer.invoke('veo:check-status', params),
  saveVeoVideo: (params) => ipcRenderer.invoke('veo:save-video', params),

  // Cookie & Google Labs Auth
  parseCookie: (cookieInput) => ipcRenderer.invoke('cookie:parse', cookieInput),
  openGoogleLogin: () => ipcRenderer.invoke('auth:open-google-login'),

  // Google Flow In-Browser Automation Companion
  openFlowBrowser: (params) => ipcRenderer.invoke('flow:open-studio-browser', params),
  onFlowVideoDownloaded: (callback) => {
    ipcRenderer.on('flow:video-downloaded', (_, data) => callback(data));
  },

  // Real Google Chrome (Persistent Profile) & Step-by-Step Flow Automation
  launchRealChrome: (url) => ipcRenderer.invoke('chrome:launch-real', url),
  checkChromeAlive: () => ipcRenderer.invoke('chrome:check-alive'),
  getFlowStatus: () => ipcRenderer.invoke('chrome:get-status'),
  createFlowProject: () => ipcRenderer.invoke('chrome:create-project'),
  setupFlowCharacter: (characterData) => ipcRenderer.invoke('chrome:setup-character', characterData),
  injectPromptToChrome: (prompt) => ipcRenderer.invoke('chrome:inject-prompt', prompt)
});
