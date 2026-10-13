const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const veoService = require('./veo-service');
const scriptGenerator = require('./script-generator');

// Disable GPU shader disk cache to avoid Windows lock conflicts
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow = null;

// Settings persistence path
const getSettingsPath = () => path.join(app.getPath('userData'), 'veo-studio-settings.json');

function loadSavedSettings() {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
      // If user had old shut-down model 'veo-2.0-generate-001', automatically migrate to 'veo-3.1-generate-preview'
      if (parsed.model === 'veo-2.0-generate-001') {
        parsed.model = 'veo-3.1-generate-preview';
      }
      if (parsed.endpointType === 'labs_cookie') {
        parsed.endpointType = 'real_chrome';
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return {
    apiKey: '',
    endpointType: 'real_chrome', // 'real_chrome' | 'ai_studio' | 'vertex' | 'custom'
    model: 'veo-3.1-generate-preview',
    customEndpoint: '',
    labsCookie: '',
    vertexProjectId: '',
    vertexLocation: 'us-central1',
    exportDirectory: path.join(app.getPath('videos'), 'Veo3StudioExports'),
    demoMode: false,
    batchDelaySeconds: 5,
    defaultArtStyle: 'Cinematic 8K, photorealistic, anamorphic lens, high fidelity'
  };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0d14',
    title: 'Veo 3 Video Studio - Multi-Scene & Character Batch Generator',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==================== IPC HANDLERS ==================== //

// 1. Settings
ipcMain.handle('settings:get', async () => {
  return loadSavedSettings();
});

ipcMain.handle('settings:save', async (_, newSettings) => {
  return saveSettings(newSettings);
});

// 2. Dialogs
ipcMain.handle('dialog:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Chọn thư mục lưu Video kết quả'
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:select-image', async (_, title = 'Chọn ảnh nhân vật / cảnh') => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title,
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    // Read preview as base64 data url for display in renderer
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const buffer = fs.readFileSync(filePath);
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    return {
      filePath,
      dataUrl,
      fileName: path.basename(filePath)
    };
  }
  return null;
});

// 3. Project Save & Load
ipcMain.handle('project:save', async (_, projectData) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Lưu Project Video Studio (.json)',
    defaultPath: 'Veo_Project_' + new Date().toISOString().slice(0, 10) + '.json',
    filters: [{ name: 'Veo Studio Project', extensions: ['json'] }]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2), 'utf-8');
    return { success: true, filePath: result.filePath };
  }
  return { success: false, canceled: true };
});

ipcMain.handle('project:load', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Mở Project Video Studio',
    filters: [{ name: 'Veo Studio Project', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, project: JSON.parse(raw), filePath: result.filePaths[0] };
  }
  return { success: false, canceled: true };
});

// 4. Shell utilities
ipcMain.handle('shell:open-folder', async (_, folderPath) => {
  if (folderPath && fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});

ipcMain.handle('shell:open-file', async (_, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.openPath(filePath);
    return true;
  }
  return false;
});

// 5. Script & Storyboard Expansion (10-20 scenes)
ipcMain.handle('script:generate-scenes', async (_, params) => {
  const settings = loadSavedSettings();
  if (params.useAi && settings.apiKey) {
    return await scriptGenerator.generateAiScenes({
      apiKey: settings.apiKey,
      count: params.count || 10,
      topic: params.topic,
      characterProfile: params.characterProfile,
      model: params.model || 'gemini-3.1-flash-lite',
      voiceGender: params.voiceGender || 'male_vi'
    });
  } else {
    return scriptGenerator.generateProceduralScenes({
      count: params.count || 10,
      topic: params.topic,
      characterName: params.characterProfile?.name || 'Đầu bếp',
      characterOutfit: params.characterProfile?.outfit || 'tạp dề chuyên nghiệp',
      artStyle: params.characterProfile?.artStyle || settings.defaultArtStyle,
      voiceGender: params.voiceGender || 'male_vi'
    });
  }
});

let liveCapturedToken = null;

app.whenReady().then(() => {
  try {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.googleapis.com/*', '*://*.labs.google/*', '*://*.flow.google.com/*'] },
      (details, callback) => {
        const auth = details.requestHeaders['Authorization'] || details.requestHeaders['authorization'];
        if (auth && (auth.startsWith('Bearer ya29.') || auth.startsWith('SAPISIDHASH'))) {
          liveCapturedToken = auth;
        }
        callback({ requestHeaders: details.requestHeaders });
      }
    );
  } catch (e) {
    console.warn('Failed to attach webRequest listener:', e);
  }
});

// 6. Veo Generation
ipcMain.handle('veo:list-models', async () => {
  const settings = loadSavedSettings();
  return await veoService.listAvailableModels(settings.apiKey);
});

ipcMain.handle('veo:submit-scene', async (_, { scene, characterProfile }) => {
  const settings = loadSavedSettings();
  if (liveCapturedToken) {
    settings.capturedToken = liveCapturedToken;
  }
  return await veoService.submitGeneration({
    apiKey: settings.apiKey,
    endpointType: settings.endpointType,
    customEndpoint: settings.customEndpoint,
    model: settings.model || 'veo-3.1-generate-preview',
    scene,
    characterProfile,
    globalSettings: settings,
    demoMode: settings.demoMode
  });
});

ipcMain.handle('veo:check-status', async (_, { operationName, elapsedMs, isMock }) => {
  const settings = loadSavedSettings();
  if (isMock || settings.demoMode) {
    return await veoService.mockCheckStatus(operationName, elapsedMs);
  }
  return await veoService.checkOperationStatus({
    apiKey: settings.apiKey,
    operationName,
    endpointType: settings.endpointType,
    globalSettings: settings
  });
});

ipcMain.handle('veo:save-video', async (_, { videoUrl, videoBase64, outputDir, filename }) => {
  const settings = loadSavedSettings();
  const dir = outputDir || settings.exportDirectory;
  const savedPath = await veoService.saveVideo({
    videoUrl,
    videoBase64,
    outputDir: dir,
    filename
  });
  return savedPath;
});

// 7. Google Labs Cookie & Browser Login
const cookieManager = require('./cookie-manager');

ipcMain.handle('cookie:parse', async (_, cookieInput) => {
  return cookieManager.parseCookieInput(cookieInput);
});

ipcMain.handle('auth:open-google-login', async () => {
  return new Promise((resolve) => {
    const loginWin = new BrowserWindow({
      width: 950,
      height: 780,
      parent: mainWindow,
      modal: true,
      title: 'Đăng nhập Google Labs (VideoFX / Flow) để tự động trích xuất Cookie',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    loginWin.loadURL('https://labs.google/fx/tools/flow');

    loginWin.on('close', async () => {
      try {
        const extracted = await cookieManager.extractSessionCookies();
        resolve({
          ...extracted,
          capturedToken: liveCapturedToken
        });
      } catch (err) {
        resolve({ cookieString: '', cookieArray: [], capturedToken: liveCapturedToken });
      }
    });
  });
});

// 8. Google Flow In-Browser Automation Companion
const flowAutomation = require('./flow-automation');

ipcMain.handle('flow:open-studio-browser', async (_, params) => {
  const settings = loadSavedSettings();
  return await flowAutomation.openFlowWindow({
    ...params,
    exportDirectory: settings.exportDirectory
  }, mainWindow);
});

// 9. Real Google Chrome with Persistent Profile
const chromeLauncher = require('./chrome-launcher');

ipcMain.handle('chrome:launch-real', async (_, url) => {
  return await chromeLauncher.launchRealChrome(url);
});

ipcMain.handle('chrome:check-alive', async () => {
  return await chromeLauncher.checkIsAlive();
});

ipcMain.handle('chrome:get-status', async () => {
  return await chromeLauncher.getFlowStatus();
});

ipcMain.handle('chrome:create-project', async () => {
  return await chromeLauncher.createFlowProject();
});

ipcMain.handle('chrome:setup-character', async (_, characterData) => {
  return await chromeLauncher.setupFlowCharacter(characterData);
});

ipcMain.handle('chrome:inject-prompt', async (_, input) => {
  return await chromeLauncher.injectPromptToChrome(input);
});



