/**
 * Veo 3 Video Studio - Frontend Application Controller
 * Handles 10-20 Scenes Storyboard, Character DNA consistency, and Sequential Batch Generation
 */

// Application State
const state = {
  project: {
    title: 'Kịch Bản Veo 3: Nhiệm Vụ Đặc Biệt',
    characterProfile: {
      name: 'Alex Vance',
      gender: 'Nam, 28 tuổi, vóc dáng điệp viên thể thao',
      appearance: 'Tóc ngắn cắt fade hiện đại, đôi mắt xám sắc sảo, vóc dáng săn chắc, khuôn mặt góc cạnh nam tính.',
      outfit: 'Áo khoác bomber công nghệ màu xám than viền phản quang, áo thun đen ôm sát, găng tay chiến thuật và đồng hồ số thông minh.',
      artStyle: 'Cinematic 8K, photorealistic, anamorphic lens, 35mm film grain, moody cinematic lighting',
      aspectRatio: '16:9',
      negativePrompt: 'blurry, deformed, distorted face, extra limbs, bad anatomy, text, watermark, changing clothes, inconsistent face, low quality, glitch',
      referenceImage: null,
      referenceImageDataUrl: null,
      enabled: true
    },
    scenes: []
  },
  settings: {
    apiKey: '',
    endpointType: 'real_chrome',
    model: 'veo-3.1-generate-preview',
    customEndpoint: '',
    labsCookie: '',
    vertexProjectId: '',
    vertexLocation: 'us-central1',
    exportDirectory: '',
    demoMode: false,
    batchDelaySeconds: 15,
    defaultArtStyle: 'Cinematic 8K, photorealistic, anamorphic lens, high fidelity'
  },
  batch: {
    isRunning: false,
    isCancelled: false,
    startTime: null,
    timerInterval: null
  }
};

// DOM References
const DOM = {
  // Tabs
  navBtns: document.querySelectorAll('.nav-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  badgeSceneCount: document.getElementById('badge-scene-count'),
  badgeQueueStatus: document.getElementById('badge-queue-status'),
  
  // Storyboard Toolbar
  projectTitleInput: document.getElementById('project-title-input'),
  summaryScenesTag: document.getElementById('summary-scenes-tag'),
  btnPreset10: document.getElementById('btn-preset-10'),
  btnPreset15: document.getElementById('btn-preset-15'),
  btnPreset20: document.getElementById('btn-preset-20'),
  btnModalAiScript: document.getElementById('btn-modal-ai-script'),
  btnAddScene: document.getElementById('btn-add-scene'),
  
  // Character Sync Bar
  miniCharAvatar: document.getElementById('mini-char-avatar'),
  syncCharName: document.getElementById('sync-char-name'),
  syncCharStyle: document.getElementById('sync-char-style'),
  syncCharDesc: document.getElementById('sync-char-desc'),
  toggleConsistency: document.getElementById('toggle-consistency'),
  btnEditCharShortcut: document.getElementById('btn-edit-char-shortcut'),
  
  // Storyboard Grid
  scenesGrid: document.getElementById('scenes-grid'),
  
  // Character Studio
  charImageDropzone: document.getElementById('char-image-dropzone'),
  charImagePreviewWrap: document.getElementById('char-image-preview-wrap'),
  charImagePreview: document.getElementById('char-image-preview'),
  charUploadPlaceholder: document.getElementById('char-upload-placeholder'),
  btnChooseCharImage: document.getElementById('btn-choose-char-image'),
  btnRemoveCharImage: document.getElementById('btn-remove-char-image'),
  charImagePathDisplay: document.getElementById('char-image-path-display'),
  
  charNameInput: document.getElementById('char-name-input'),
  charGenderInput: document.getElementById('char-gender-input'),
  charAppearanceInput: document.getElementById('char-appearance-input'),
  charOutfitInput: document.getElementById('char-outfit-input'),
  charArtStyleSelect: document.getElementById('char-art-style-select'),
  charAspectRatioSelect: document.getElementById('char-aspect-ratio-select'),
  charNegativePrompt: document.getElementById('char-negative-prompt'),
  dnaPreviewText: document.getElementById('dna-preview-text'),
  btnSaveCharacterProfile: document.getElementById('btn-save-character-profile'),

  // Batch Hub
  btnStartBatch: document.getElementById('btn-start-batch'),
  btnStopBatch: document.getElementById('btn-stop-batch'),
  btnOpenExportFolder: document.getElementById('btn-open-export-folder'),
  btnQuickCookie: document.getElementById('btn-quick-cookie'),
  statTotalScenes: document.getElementById('stat-total-scenes'),
  statCompletedScenes: document.getElementById('stat-completed-scenes'),
  statActiveScenes: document.getElementById('stat-active-scenes'),
  statElapsedTime: document.getElementById('stat-elapsed-time'),
  statModeBadge: document.getElementById('stat-mode-badge'),
  batchProgressBar: document.getElementById('batch-progress-bar'),
  batchProgressCaption: document.getElementById('batch-progress-caption'),
  queueTableBody: document.getElementById('queue-table-body'),
  consoleLogs: document.getElementById('console-logs'),
  btnCopyLogs: document.getElementById('btn-copy-logs'),
  btnClearLogs: document.getElementById('btn-clear-logs'),

  // Modals
  modalAiScript: document.getElementById('modal-ai-script'),
  btnCloseModalScript: document.getElementById('btn-close-modal-script'),
  btnCancelModalScript: document.getElementById('btn-cancel-modal-script'),
  btnExecuteAiScript: document.getElementById('btn-execute-ai-script'),
  aiScriptTopic: document.getElementById('ai-script-topic'),
  aiScriptCount: document.getElementById('ai-script-count'),
  aiScriptEngine: document.getElementById('ai-script-engine'),

  modalSettings: document.getElementById('modal-settings'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnCloseModalSettings: document.getElementById('btn-close-modal-settings'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  btnTabChromeMode: document.getElementById('btn-tab-chrome-mode'),
  btnTabApiMode: document.getElementById('btn-tab-api-mode'),
  groupChromeMode: document.getElementById('group-chrome-mode'),
  btnModalLaunchChrome: document.getElementById('btn-modal-launch-chrome'),
  chromeStatusBadge: document.getElementById('chrome-status-badge'),
  settingDemoMode: document.getElementById('setting-demo-mode'),
  settingEndpointType: document.getElementById('setting-endpoint-type'),
  settingModelName: document.getElementById('setting-model-name'),
  settingApiKey: document.getElementById('setting-api-key'),
  btnToggleKeyVisibility: document.getElementById('btn-toggle-key-visibility'),
  btnTestModels: document.getElementById('btn-test-models'),
  apiModelsResult: document.getElementById('api-models-result'),
  groupApiKey: document.getElementById('group-api-key'),
  settingLabsCookie: document.getElementById('setting-labs-cookie'),
  settingExportDir: document.getElementById('setting-export-dir'),
  btnBrowseExportDir: document.getElementById('btn-browse-export-dir'),
  settingBatchDelay: document.getElementById('setting-batch-delay'),
  settingDefaultStyle: document.getElementById('setting-default-style'),
  groupVertex: document.getElementById('group-vertex'),
  settingVertexProject: document.getElementById('setting-vertex-project'),
  settingVertexLocation: document.getElementById('setting-vertex-location'),

  // Video Modal
  modalVideoPlayer: document.getElementById('modal-video-player'),
  btnCloseModalVideo: document.getElementById('btn-close-modal-video'),
  modalVideoElement: document.getElementById('modal-video-element'),
  videoModalTitle: document.getElementById('video-modal-title'),
  videoModalPrompt: document.getElementById('video-modal-prompt'),
  btnModalOpenFolder: document.getElementById('btn-modal-open-folder'),
  btnModalOpenSystem: document.getElementById('btn-modal-open-system'),

  // Project Header buttons
  btnOpenProject: document.getElementById('btn-open-project'),
  btnSaveProject: document.getElementById('btn-save-project'),
  toastContainer: document.getElementById('toast-container'),

  // Google Flow In-Browser Companion
  btnFlowCompanionStoryboard: document.getElementById('btn-flow-companion-storyboard'),
  btnFlowCompanionQueue: document.getElementById('btn-flow-companion-queue'),

  // Real Google Chrome (Persistent Profile)
  btnLaunchRealChrome: document.getElementById('btn-launch-real-chrome'),
  btnLaunchRealChromeQueue: document.getElementById('btn-launch-real-chrome-queue')
};

// ==================== INITIALIZATION ==================== //
async function initApp() {
  bindEvents();

  // Load saved settings from disk
  if (window.electronAPI) {
    try {
      const savedSettings = await window.electronAPI.getSettings();
      if (savedSettings) {
        state.settings = { ...state.settings, ...savedSettings };
        // Migrate old cookie mode to real_chrome mode
        if (state.settings.endpointType === 'labs_cookie' || !state.settings.endpointType) {
          state.settings.endpointType = 'real_chrome';
        }
        updateSettingsUI();
      }
    } catch (e) {
      console.warn('Could not read settings:', e);
    }
  }

  // Generate initial 10 scenes preset
  generateDefaultScenes(10);
  
  updateCharacterUI();
  renderScenesGrid();
  renderQueueTable();
  updateStats();

  if (window.electronAPI && window.electronAPI.onFlowVideoDownloaded) {
    window.electronAPI.onFlowVideoDownloaded((data) => {
      showToast(`✓ Đã tự động lưu video từ Google Flow: ${data.filePath}`, 'success');
      logToConsole(`✓ Đã tự động lưu video từ Google Flow: ${data.filePath}`, 'success');
      if (data.sceneIndex !== undefined && state.project.scenes[data.sceneIndex]) {
        const sc = state.project.scenes[data.sceneIndex];
        sc.status = 'completed';
        sc.videoPath = data.filePath;
        updateSceneStatusUI(sc, 'Hoàn thành');
        updateStats();
        renderScenesGrid();
        renderQueueTable();
      }
    });
  }

  logToConsole('Veo 3 Video Studio đã sẵn sàng! Đã nạp 10 phân cảnh mẫu.', 'info');
}

// Generate default template of 10, 15, or 20 scenes
function generateDefaultScenes(count = 10) {
  const shotPresets = [
    { shot: 'Establishing Shot, góc nhìn Flycam toàn cảnh', action: 'quan sát toàn cảnh thành phố tương lai rực rỡ ánh đèn neon từ sân thượng' },
    { shot: 'Medium Tracking Shot, Steadicam bám sát bước chân', action: 'bước nhanh qua con hẻm ẩm ướt với áo khoác phản quang' },
    { shot: 'Close-Up Shot, cận cảnh đôi mắt sắc sảo', action: 'dừng lại và quét ánh mắt tìm kiếm mục tiêu' },
    { shot: 'Over-The-Shoulder Shot, góc máy qua vai', action: 'kiểm tra bản đồ 3D hologram chiếu từ thiết bị đeo tay' },
    { shot: 'Low Angle Hero Shot, góc nhìn thấp dũng mãnh', action: 'tiến vào sảnh chính của tòa nhà bảo mật cao' },
    { shot: 'Dutch Angle Suspense Shot, góc nghiêng hồi hộp', action: 'phát hiện camera an ninh xoay và kịp thời ẩn mình sau cột đá' },
    { shot: 'Point of View (POV) Shot, góc nhìn thứ nhất', action: 'cắm chìa khóa mã hóa vào bảng điều khiển bảo mật' },
    { shot: 'Dynamic Action Dolly Shot, đẩy máy nhanh', action: 'chạy thoát qua lối thoát hiểm khi còi báo động rực đỏ' },
    { shot: 'Slow-Motion Push-In, máy quay tiến chậm 60fps', action: 'nhảy lên mui xe bay lơ lửng ngay khi cửa kính vỡ' },
    { shot: 'Cinematic Wide Shot, đại cảnh hoàng hôn kết phim', action: 'lái xe bay lướt đi về phía chân trời rực rỡ hoàn thành nhiệm vụ' },
    { shot: 'Drone Top-Down Shot, góc nhìn thẳng đứng từ trên trời', action: 'nhìn mạng lưới giao thông đan xen bên dưới' },
    { shot: 'Rack Focus Shot, chuyển nét tiền cảnh sang hậu cảnh', action: 'nắm chặt viên ngọc năng lượng phát sáng trong tay' },
    { shot: 'Side Profile Glide Shot, góc trượt ngang', action: 'mở kính mũ bảo hiểm và thở phào nhẹ nhõm' },
    { shot: 'Silhouette Golden Hour Shot, ngược sáng nghệ thuật', action: 'đứng trên mép tòa tháp nhìn ánh mặt trời xuyên qua sương mù' },
    { shot: 'Orbit 360 Degree Shot, xoay vòng 360 độ quanh nhân vật', action: 'kích hoạt khiên chắn trường năng lượng xung quanh' },
    { shot: 'Macro Close-Up Shot, cận cảnh vi mạch', action: 'khởi động con chip nhận diện sinh trắc học' },
    { shot: 'Handheld Gritty Shot, góc quay rung lắc chân thực', action: 'né tránh mảnh vỡ bay ngang trong cơn bão điện từ' },
    { shot: 'Crane Rising Shot, cần cẩu nâng máy lên cao', action: 'bước lên boong phi thuyền mẹ' },
    { shot: 'Atmospheric Fog Shot, ánh đèn pha xuyên sương mù dày', action: 'bước vào căn cứ bí mật' },
    { shot: 'Epic Climactic Master Shot, toàn cảnh kết thúc tráng lệ', action: 'trao chiếc hộp năng lượng cho người đồng đội đón sẵn' }
  ];

  state.project.scenes = [];
  for (let i = 0; i < count; i++) {
    const p = shotPresets[i % shotPresets.length];
    const num = i + 1;
    const char = state.project.characterProfile;

    state.project.scenes.push({
      id: 'sc_' + Date.now() + '_' + i,
      number: num,
      title: `Phân cảnh ${num}`,
      shotType: p.shot,
      actionText: p.action,
      prompt: `${p.shot}. ${char.name} ${p.action}. Consistent character, ${char.outfit}. ${char.artStyle}. Cinematic lighting, 4K resolution, photorealistic, smooth motion.`,
      duration: 6,
      aspectRatio: char.aspectRatio || '16:9',
      referenceImage: null,
      referenceImageDataUrl: null,
      status: 'idle', // idle, queued, generating, completed, failed
      progress: 0,
      videoPath: null,
      videoUrl: null,
      error: null
    });
  }

  DOM.badgeSceneCount.textContent = state.project.scenes.length;
  DOM.summaryScenesTag.textContent = `${state.project.scenes.length} phân cảnh`;
}

// ==================== EVENT BINDINGS ==================== //
function bindEvents() {
  // Navigation Tabs
  DOM.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      DOM.navBtns.forEach(b => b.classList.remove('active'));
      DOM.tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetTab)?.classList.add('active');
    });
  });

  DOM.btnEditCharShortcut.addEventListener('click', () => {
    document.getElementById('nav-btn-character')?.click();
  });

  // Project title
  DOM.projectTitleInput.addEventListener('input', (e) => {
    state.project.title = e.target.value;
  });

  // Quick Presets
  DOM.btnPreset10.addEventListener('click', () => switchPreset(10));
  DOM.btnPreset15.addEventListener('click', () => switchPreset(15));
  DOM.btnPreset20.addEventListener('click', () => switchPreset(20));

  // Add scene button
  DOM.btnAddScene.addEventListener('click', () => {
    if (state.project.scenes.length >= 25) {
      showToast('Đã đạt giới hạn tối đa 25 phân cảnh cho 1 dự án', 'error');
      return;
    }
    const num = state.project.scenes.length + 1;
    const char = state.project.characterProfile;
    state.project.scenes.push({
      id: 'sc_' + Date.now() + '_' + num,
      number: num,
      title: `Phân cảnh ${num}`,
      shotType: 'Medium Cinematic Shot',
      actionText: 'hành động mới trong phân cảnh',
      prompt: `Medium cinematic shot. ${char.name} tiếp tục hành trình. ${char.outfit}. ${char.artStyle}. Masterpiece, 4k resolution, cinematic lighting.`,
      duration: 6,
      aspectRatio: char.aspectRatio || '16:9',
      referenceImage: null,
      referenceImageDataUrl: null,
      status: 'idle',
      progress: 0,
      videoPath: null,
      videoUrl: null,
      error: null
    });
    renderScenesGrid();
    renderQueueTable();
    updateStats();
    showToast(`Đã thêm Phân Cảnh ${num}`, 'info');
  });

  // Consistency Lock switch
  DOM.toggleConsistency.addEventListener('change', (e) => {
    state.project.characterProfile.enabled = e.target.checked;
    updateCharacterUI();
    showToast(e.target.checked ? 'Đã bật Khóa Nhất Quán Nhân Vật' : 'Đã tắt Khóa Nhất Quán', 'info');
  });

  // Character DNA inputs
  const charInputs = [
    DOM.charNameInput, DOM.charGenderInput, DOM.charAppearanceInput,
    DOM.charOutfitInput, DOM.charArtStyleSelect, DOM.charAspectRatioSelect,
    DOM.charNegativePrompt
  ];
  charInputs.forEach(input => {
    input.addEventListener('input', () => {
      saveCharFormToState();
      updateCharacterUI();
    });
  });

  DOM.btnSaveCharacterProfile.addEventListener('click', () => {
    saveCharFormToState();
    updateCharacterUI();
    showToast('Đã lưu cấu hình Nhân Vật DNA!', 'success');
  });

  // Character Image picker
  DOM.btnChooseCharImage.addEventListener('click', pickCharacterImage);
  DOM.charImageDropzone.addEventListener('click', (e) => {
    if (e.target.id !== 'btn-remove-char-image') pickCharacterImage();
  });
  DOM.btnRemoveCharImage.addEventListener('click', (e) => {
    e.stopPropagation();
    state.project.characterProfile.referenceImage = null;
    state.project.characterProfile.referenceImageDataUrl = null;
    updateCharacterUI();
    showToast('Đã xóa ảnh tham chiếu nhân vật', 'info');
  });

  // AI Script Modal
  DOM.btnModalAiScript.addEventListener('click', () => {
    DOM.modalAiScript.style.display = 'flex';
  });
  DOM.btnCloseModalScript.addEventListener('click', () => {
    DOM.modalAiScript.style.display = 'none';
  });
  DOM.btnCancelModalScript.addEventListener('click', () => {
    DOM.modalAiScript.style.display = 'none';
  });
  DOM.btnExecuteAiScript.addEventListener('click', executeAiScriptGeneration);

  // Settings Modal
  DOM.btnOpenSettings.addEventListener('click', () => {
    updateSettingsUI();
    DOM.modalSettings.style.display = 'flex';
  });
  DOM.btnCloseModalSettings.addEventListener('click', () => {
    DOM.modalSettings.style.display = 'none';
  });
  DOM.btnCancelSettings.addEventListener('click', () => {
    DOM.modalSettings.style.display = 'none';
  });
  DOM.btnSaveSettings.addEventListener('click', saveSettingsFromUI);

  DOM.btnToggleKeyVisibility.addEventListener('click', () => {
    const isPass = DOM.settingApiKey.type === 'password';
    DOM.settingApiKey.type = isPass ? 'text' : 'password';
    DOM.btnToggleKeyVisibility.textContent = isPass ? 'Ẩn' : 'Hiện';
  });

  DOM.btnTestModels.addEventListener('click', async () => {
    const key = DOM.settingApiKey.value.trim();
    if (!key) {
      showToast('Vui lòng nhập API Key trước khi kiểm tra', 'error');
      return;
    }
    DOM.btnTestModels.disabled = true;
    DOM.btnTestModels.textContent = 'Đang kiểm tra...';
    DOM.apiModelsResult.style.display = 'block';
    DOM.apiModelsResult.innerHTML = '<span style="color:var(--accent-cyan);">Đang kết nối Google API...</span>';

    try {
      state.settings.apiKey = key;
      if (window.electronAPI) {
        await window.electronAPI.saveSettings(state.settings);
        const res = await window.electronAPI.listModels();
        if (res.videoModels && res.videoModels.length > 0) {
          DOM.apiModelsResult.innerHTML = `
            <div style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); border-radius:6px; padding:8px; color:var(--accent-emerald);">
              <strong>✓ API Key hợp lệ! Các model Video có sẵn:</strong><br>
              ${res.videoModels.map(m => `<code>${m}</code>`).join(', ')}
            </div>
          `;
          showToast('API Key đã được cấp quyền Veo video!', 'success');
        } else {
          DOM.apiModelsResult.innerHTML = `
            <div style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:8px; color:var(--accent-amber);">
              <strong>⚠️ API Key hợp lệ nhưng chưa có model Veo trong danh sách:</strong><br>
              Các model hiện có: ${res.all.slice(0, 5).join(', ')}...<br>
              <small>Lưu ý: Google Veo yêu cầu tài khoản Google AI Studio có kích hoạt quyền truy cập Veo (Billing Tier 1+ hoặc Waitlist). Bạn có thể bật <strong>Demo Mode</strong> để chạy thử hoàn toàn miễn phí!</small>
            </div>
          `;
          showToast('API Key hợp lệ nhưng chưa kích hoạt quyền Veo', 'warning');
        }
      }
    } catch (err) {
      DOM.apiModelsResult.innerHTML = `
        <div style="background:rgba(244,63,94,0.15); border:1px solid rgba(244,63,94,0.3); border-radius:6px; padding:8px; color:var(--accent-rose);">
          <strong>✗ Lỗi API Key:</strong> ${err.message}
        </div>
      `;
      showToast('Lỗi kiểm tra API Key: ' + err.message, 'error');
    } finally {
      DOM.btnTestModels.disabled = false;
      DOM.btnTestModels.textContent = 'Kiểm Tra Model';
    }
  });

  DOM.btnTabChromeMode?.addEventListener('click', () => {
    state.settings.endpointType = 'real_chrome';
    DOM.settingEndpointType.value = 'real_chrome';
    DOM.btnTabChromeMode.className = 'btn btn-primary';
    DOM.btnTabApiMode.className = 'btn btn-secondary';
    DOM.groupChromeMode.style.display = 'block';
    DOM.groupApiKey.style.display = 'none';
  });

  DOM.btnTabApiMode?.addEventListener('click', () => {
    state.settings.endpointType = 'ai_studio';
    DOM.settingEndpointType.value = 'ai_studio';
    DOM.btnTabApiMode.className = 'btn btn-primary';
    DOM.btnTabChromeMode.className = 'btn btn-secondary';
    DOM.groupChromeMode.style.display = 'none';
    DOM.groupApiKey.style.display = 'flex';
  });

  DOM.settingEndpointType?.addEventListener('change', (e) => {
    const ep = e.target.value;
    if (ep === 'real_chrome') {
      DOM.btnTabChromeMode?.click();
    } else {
      DOM.btnTabApiMode?.click();
    }
  });

  DOM.btnModalLaunchChrome?.addEventListener('click', async () => {
    await launchRealGoogleChrome();
    checkChromeStatusInUI();
  });

  DOM.btnBrowseExportDir.addEventListener('click', async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        DOM.settingExportDir.value = dir;
        state.settings.exportDirectory = dir;
      }
    }
  });

  // Video Modal
  DOM.btnCloseModalVideo.addEventListener('click', () => {
    DOM.modalVideoPlayer.style.display = 'none';
    DOM.modalVideoElement.pause();
  });

  DOM.btnModalOpenFolder.addEventListener('click', () => {
    const currentPath = DOM.modalVideoElement.getAttribute('data-filepath');
    if (currentPath && window.electronAPI) {
      const folder = currentPath.substring(0, currentPath.lastIndexOf('\\'));
      window.electronAPI.openFolder(folder);
    }
  });

  DOM.btnModalOpenSystem.addEventListener('click', () => {
    const currentPath = DOM.modalVideoElement.getAttribute('data-filepath');
    if (currentPath && window.electronAPI) {
      window.electronAPI.openFile(currentPath);
    }
  });

  // Batch Controls
  DOM.btnQuickCookie?.addEventListener('click', () => {
    DOM.btnOpenSettings.click();
  });
  DOM.btnStartBatch.addEventListener('click', startBatchGeneration);
  DOM.btnStopBatch.addEventListener('click', stopBatchGeneration);
  DOM.btnOpenExportFolder.addEventListener('click', () => {
    if (window.electronAPI && state.settings.exportDirectory) {
      window.electronAPI.openFolder(state.settings.exportDirectory);
    }
  });
  DOM.btnCopyLogs?.addEventListener('click', async () => {
    const text = DOM.consoleLogs.innerText;
    if (!text || text.trim() === '') {
      showToast('Chưa có log để copy', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('✓ Đã copy toàn bộ log vào Clipboard!', 'success');
      logToConsole('📋 Đã copy toàn bộ nội dung log vào Clipboard', 'info');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('✓ Đã copy toàn bộ log vào Clipboard!', 'success');
    }
  });
  DOM.btnClearLogs.addEventListener('click', () => {
    DOM.consoleLogs.innerHTML = '';
  });

  // Project Save & Load
  DOM.btnSaveProject.addEventListener('click', saveProjectToFile);
  DOM.btnOpenProject.addEventListener('click', loadProjectFromFile);

  // Google Flow In-Browser Companion Toolbar triggers
  DOM.btnFlowCompanionStoryboard?.addEventListener('click', () => openFlowStudioBrowser(0));
  DOM.btnFlowCompanionQueue?.addEventListener('click', () => openFlowStudioBrowser(0));

  // Real Google Chrome (Persistent Profile)
  DOM.btnLaunchRealChrome?.addEventListener('click', launchRealGoogleChrome);
  DOM.btnLaunchRealChromeQueue?.addEventListener('click', launchRealGoogleChrome);
}

// Build full prompt with Character DNA
function buildFullScenePrompt(scene) {
  if (!scene) return '';
  const profile = state.project.characterProfile || {};
  let p = scene.prompt || '';
  if (profile.name && profile.appearance) {
    p = `[Character: ${profile.name}, ${profile.appearance}, wearing ${profile.outfit || ''}]. ${p}`;
  }
  if (profile.artStyle) {
    p += `, ${profile.artStyle}`;
  }
  return p;
}

// Open Google Chrome with persistent user data dir
async function launchRealGoogleChrome() {
  if (!window.electronAPI || !window.electronAPI.launchRealChrome) return;
  showToast('Đang mở Google Chrome thật...', 'info');
  logToConsole('Đang mở Google Chrome thật trên máy tính của bạn với hồ sơ lưu vĩnh viễn...', 'info');
  try {
    const res = await window.electronAPI.launchRealChrome('https://labs.google/fx/tools/flow');
    showToast('Đã mở Google Chrome thật! Mọi đăng nhập tài khoản sẽ được lưu vĩnh viễn.', 'success');
    logToConsole(`✓ Đã mở Chrome thật thành công! Thư mục hồ sơ: ${res.profileDir}`, 'success');
  } catch (err) {
    showToast('Lỗi mở Chrome: ' + err.message, 'error');
    logToConsole('Lỗi mở Chrome: ' + err.message, 'error');
  }
}

// Copy prompt or inject into Chrome via CDP
async function copyOrInjectSceneToChrome(scene) {
  const fullPrompt = buildFullScenePrompt(scene);
  const imagePath = scene.referenceImage || state.project.characterProfile.referenceImage || null;
  try {
    if (window.electronAPI && window.electronAPI.injectPromptToChrome) {
      showToast(`Đang tự động điền prompt ${imagePath ? 'và tải ảnh nhân vật ' : ''}Cảnh ${scene.number} vào Google Chrome thật...`, 'info');
      const res = await window.electronAPI.injectPromptToChrome({
        prompt: fullPrompt,
        imagePath: imagePath
      });
      if (res && res.injected) {
        showToast(`✓ ĐÃ TỰ ĐỘNG ĐIỀN & BẤM TẠO CẢNH ${scene.number} TRÊN GOOGLE CHROME THẬT!`, 'success');
        logToConsole(`✓ [Scene #${scene.number}] Đã tự động điền prompt, khóa chế độ Video${imagePath ? ' & đính kèm ảnh tham chiếu nhân vật' : ''} trên Google Chrome thật!`, 'success');
        scene.status = 'generating';
        updateSceneStatusUI(scene, 'Đang tạo trên Chrome...');
        return;
      }
    }
  } catch (e) {
    console.warn('Chrome injection error:', e);
  }

  await navigator.clipboard.writeText(fullPrompt);
  showToast(`✓ Đã copy prompt Cảnh ${scene.number}! Bạn chỉ cần bấm Ctrl + V vào ô tạo video trên Chrome.`, 'success');
  logToConsole(`✓ Đã copy prompt Cảnh ${scene.number} vào Clipboard`, 'info');
}

// Open Google Flow with dedicated Studio Companion Toolbar
async function openFlowStudioBrowser(sceneIndex = 0) {
  if (!window.electronAPI || !window.electronAPI.openFlowBrowser) return;
  showToast('Đang mở trình duyệt Google Flow...', 'info');
  logToConsole('Đang mở trình duyệt Google Labs Flow với thanh công cụ Veo 3 Studio Companion...', 'info');
  try {
    await window.electronAPI.openFlowBrowser({
      scenes: state.project.scenes,
      characterProfile: state.project.characterProfile,
      activeIndex: sceneIndex,
      exportDirectory: state.settings.exportDirectory
    });
    showToast('Đã mở Google Flow! Hãy sử dụng thanh điều khiển nổi phía dưới trang để tự động điền prompt.', 'success');
  } catch (err) {
    showToast('Lỗi mở trình duyệt Google Flow: ' + err.message, 'error');
    logToConsole('Lỗi mở Flow: ' + err.message, 'error');
  }
}

function switchPreset(count) {
  if (confirm(`Bạn có chắc muốn chuyển sang mẫu ${count} phân cảnh? Các nội dung chưa lưu sẽ được làm mới.`)) {
    generateDefaultScenes(count);
    renderScenesGrid();
    renderQueueTable();
    updateStats();
    showToast(`Đã nạp mẫu ${count} phân cảnh thành công!`, 'success');
  }
}

// ==================== CHARACTER DNA LOGIC ==================== //
function saveCharFormToState() {
  state.project.characterProfile.name = DOM.charNameInput.value.trim();
  state.project.characterProfile.gender = DOM.charGenderInput.value.trim();
  state.project.characterProfile.appearance = DOM.charAppearanceInput.value.trim();
  state.project.characterProfile.outfit = DOM.charOutfitInput.value.trim();
  state.project.characterProfile.artStyle = DOM.charArtStyleSelect.value;
  state.project.characterProfile.aspectRatio = DOM.charAspectRatioSelect.value;
  state.project.characterProfile.negativePrompt = DOM.charNegativePrompt.value.trim();
}

function updateCharacterUI() {
  const char = state.project.characterProfile;
  DOM.charNameInput.value = char.name;
  DOM.charGenderInput.value = char.gender;
  DOM.charAppearanceInput.value = char.appearance;
  DOM.charOutfitInput.value = char.outfit;
  DOM.charArtStyleSelect.value = char.artStyle;
  DOM.charAspectRatioSelect.value = char.aspectRatio || '16:9';
  DOM.charNegativePrompt.value = char.negativePrompt;
  DOM.toggleConsistency.checked = char.enabled !== false;

  // Sync bar
  DOM.syncCharName.textContent = char.name || 'Chưa đặt tên';
  DOM.syncCharStyle.textContent = char.artStyle.split(',')[0] || 'Cinematic';
  DOM.syncCharDesc.textContent = `${char.gender}. ${char.outfit}`;

  // Image preview
  if (char.referenceImageDataUrl) {
    DOM.charImagePreview.src = char.referenceImageDataUrl;
    DOM.charImagePreviewWrap.style.display = 'block';
    DOM.charUploadPlaceholder.style.display = 'none';
    DOM.miniCharAvatar.innerHTML = `<img src="${char.referenceImageDataUrl}" alt="Avatar">`;
    DOM.charImagePathDisplay.textContent = char.referenceImage || 'Đã chọn ảnh';
  } else {
    DOM.charImagePreviewWrap.style.display = 'none';
    DOM.charUploadPlaceholder.style.display = 'flex';
    DOM.miniCharAvatar.innerHTML = `<span>👤</span>`;
    DOM.charImagePathDisplay.textContent = 'Chưa chọn ảnh';
  }

  // DNA Prompt preview
  DOM.dnaPreviewText.textContent = `[Character: ${char.name}, ${char.gender}, wearing ${char.outfit}]. Appearance: ${char.appearance}. Style: ${char.artStyle}. Negative: ${char.negativePrompt}`;
}

async function pickCharacterImage() {
  if (!window.electronAPI) return;
  const result = await window.electronAPI.selectImage('Chọn ảnh tham chiếu nhân vật (Master Reference)');
  if (result) {
    state.project.characterProfile.referenceImage = result.filePath;
    state.project.characterProfile.referenceImageDataUrl = result.dataUrl;
    updateCharacterUI();
    showToast('Đã nạp ảnh nhân vật thành công!', 'success');
  }
}

// ==================== SCENES GRID RENDERING ==================== //
function renderScenesGrid() {
  DOM.scenesGrid.innerHTML = '';
  DOM.badgeSceneCount.textContent = state.project.scenes.length;
  DOM.summaryScenesTag.textContent = `${state.project.scenes.length} phân cảnh`;

  state.project.scenes.forEach((scene, index) => {
    scene.number = index + 1; // Keep numbers 1-indexed and clean

    const card = document.createElement('div');
    card.className = `scene-card ${scene.status === 'generating' ? 'active-rendering' : ''}`;
    card.id = `card-${scene.id}`;

    // Status Pill
    let statusText = 'Chờ xử lý';
    let statusClass = 'idle';
    if (scene.status === 'queued') { statusText = 'Đang xếp hàng'; statusClass = 'queued'; }
    else if (scene.status === 'generating') { statusText = 'Đang tạo video...'; statusClass = 'generating'; }
    else if (scene.status === 'completed') { statusText = 'Hoàn thành'; statusClass = 'completed'; }
    else if (scene.status === 'failed') { statusText = 'Lỗi'; statusClass = 'failed'; }

    // Card Inner HTML
    card.innerHTML = `
      <div class="scene-card-header">
        <div class="scene-title-badge">
          <span class="scene-index">${scene.number}</span>
          <input type="text" class="scene-name-input" value="${scene.title}" data-field="title" data-id="${scene.id}" placeholder="Tên cảnh...">
        </div>
        <div class="scene-actions-header">
          <button class="btn-icon-danger btn-delete-scene" data-id="${scene.id}" title="Xóa cảnh này">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <div class="scene-meta-row">
        <input type="text" class="form-select-sm" value="${scene.shotType}" data-field="shotType" data-id="${scene.id}" placeholder="Góc quay (VD: Close-Up, Wide Drone...)">
        <select class="form-select-sm" style="max-width: 90px;" data-field="duration" data-id="${scene.id}">
          <option value="4" ${scene.duration == 4 ? 'selected' : ''}>4 giây</option>
          <option value="5" ${(!scene.duration || scene.duration == 5) ? 'selected' : ''}>5 giây (Chuẩn)</option>
          <option value="6" ${scene.duration == 6 ? 'selected' : ''}>6 giây</option>
          <option value="8" ${(scene.duration >= 8) ? 'selected' : ''}>8 giây (Tối đa)</option>
        </select>
        <select class="form-select-sm" style="max-width: 80px;" data-field="aspectRatio" data-id="${scene.id}">
          <option value="16:9" ${scene.aspectRatio === '16:9' ? 'selected' : ''}>16:9</option>
          <option value="9:16" ${scene.aspectRatio === '9:16' ? 'selected' : ''}>9:16</option>
          <option value="1:1" ${scene.aspectRatio === '1:1' ? 'selected' : ''}>1:1</option>
        </select>
      </div>

      <div class="scene-prompt-box">
        <div class="prompt-label">
          <span>Prompt Veo 3:</span>
          <span style="color:var(--text-muted); font-size:10px;">${scene.prompt.length} ký tự</span>
        </div>
        <textarea class="scene-prompt-textarea" data-field="prompt" data-id="${scene.id}" placeholder="Mô tả phân cảnh chi tiết...">${scene.prompt}</textarea>
      </div>

      <!-- Reference Image for Scene -->
      <div class="scene-media-area">
        <img class="scene-image-preview-thumb" src="${scene.referenceImageDataUrl || (state.project.characterProfile.referenceImageDataUrl || '')}" alt="Ref" style="${(!scene.referenceImageDataUrl && !state.project.characterProfile.referenceImageDataUrl) ? 'display:none;' : ''}">
        <div class="scene-media-info">
          <strong>Ảnh mồi (Conditioning):</strong>
          <span>${scene.referenceImage ? 'Ảnh riêng của cảnh' : (state.project.characterProfile.referenceImage ? 'Dùng ảnh nhân vật chung' : 'Chưa có ảnh')}</span>
        </div>
        <button class="btn btn-sm btn-secondary btn-pick-scene-image" data-id="${scene.id}">
          ${scene.referenceImage ? 'Đổi ảnh' : 'Thêm ảnh'}
        </button>
      </div>

      ${scene.videoPath || scene.videoUrl ? `
        <div class="scene-video-player-wrap">
          <video src="${scene.videoPath || scene.videoUrl}" controls preload="metadata"></video>
          <button class="scene-video-overlay-btn btn-open-video-modal" data-id="${scene.id}">Phóng to</button>
        </div>
      ` : ''}

      <div class="scene-card-footer">
        <span class="status-pill ${statusClass}" id="pill-${scene.id}">
          ${scene.status === 'generating' ? '<span class="pulse-dot"></span>' : ''}
          ${statusText}
        </span>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-primary btn-generate-single" data-id="${scene.id}" style="background:linear-gradient(135deg, #10b981, #059669); font-weight:700;" title="Tự động bơm prompt & ảnh nhân vật vào Google Chrome thật và bấm tạo video" ${state.batch.isRunning ? 'disabled' : ''}>
            ⚡ Tự Điền Vào Chrome & Tạo
          </button>
          <button class="btn btn-sm btn-secondary btn-copy-scene-prompt" data-id="${scene.id}" title="Sao chép prompt đầy đủ kèm DNA nhân vật">
            📋 Copy Prompt
          </button>
        </div>
      </div>
    `;

    DOM.scenesGrid.appendChild(card);
  });

  // Attach card event listeners
  attachCardEvents();
}

function attachCardEvents() {
  // Copy full prompt
  document.querySelectorAll('.btn-copy-scene-prompt').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const sc = state.project.scenes.find(s => s.id === id);
      if (sc) {
        const fullPrompt = buildFullScenePrompt(sc);
        await navigator.clipboard.writeText(fullPrompt);
        showToast(`✓ Đã copy prompt Cảnh ${sc.number} kèm DNA nhân vật!`, 'success');
        logToConsole(`✓ Đã copy prompt Cảnh ${sc.number} vào Clipboard`, 'info');
      }
    });
  });
  // Input changes
  document.querySelectorAll('.scene-card [data-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      const field = e.target.getAttribute('data-field');
      const id = e.target.getAttribute('data-id');
      const sc = state.project.scenes.find(s => s.id === id);
      if (sc) {
        sc[field] = e.target.value;
        if (field === 'title' || field === 'shotType') renderQueueTable();
      }
    });
  });

  // Delete scene
  document.querySelectorAll('.btn-delete-scene').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      if (state.project.scenes.length <= 1) {
        showToast('Cần giữ lại ít nhất 1 phân cảnh', 'error');
        return;
      }
      state.project.scenes = state.project.scenes.filter(s => s.id !== id);
      renderScenesGrid();
      renderQueueTable();
      updateStats();
    });
  });

  // Pick scene-specific image
  document.querySelectorAll('.btn-pick-scene-image').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!window.electronAPI) return;
      const id = btn.getAttribute('data-id');
      const sc = state.project.scenes.find(s => s.id === id);
      if (!sc) return;
      const res = await window.electronAPI.selectImage(`Chọn ảnh cho Phân Cảnh ${sc.number}`);
      if (res) {
        sc.referenceImage = res.filePath;
        sc.referenceImageDataUrl = res.dataUrl;
        renderScenesGrid();
        showToast(`Đã thêm ảnh cho Phân cảnh ${sc.number}`, 'success');
      }
    });
  });

  // Single scene render
  document.querySelectorAll('.btn-generate-single').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const sc = state.project.scenes.find(s => s.id === id);
      if (sc) {
        renderSingleScene(sc);
      }
    });
  });

  // Full video preview modal
  document.querySelectorAll('.btn-open-video-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sc = state.project.scenes.find(s => s.id === id);
      if (sc) {
        openVideoModal(sc);
      }
    });
  });
}

function openVideoModal(scene) {
  DOM.videoModalTitle.textContent = `${scene.title} - ${scene.shotType}`;
  DOM.videoModalPrompt.textContent = scene.prompt;
  DOM.modalVideoElement.src = scene.videoPath || scene.videoUrl;
  DOM.modalVideoElement.setAttribute('data-filepath', scene.videoPath || '');
  DOM.modalVideoPlayer.style.display = 'flex';
  DOM.modalVideoElement.play().catch(() => {});
}

// ==================== QUEUE TABLE RENDERING ==================== //
function renderQueueTable() {
  DOM.queueTableBody.innerHTML = '';
  state.project.scenes.forEach(scene => {
    const tr = document.createElement('tr');
    tr.id = `queue-row-${scene.id}`;

    let statusBadge = '<span class="badge">Chờ</span>';
    if (scene.status === 'queued') statusBadge = '<span class="badge badge-warning">Hàng đợi</span>';
    else if (scene.status === 'generating') statusBadge = '<span class="badge badge-info pulse-dot"> Đang tạo...</span>';
    else if (scene.status === 'completed') statusBadge = '<span class="badge badge-success">✓ Xong</span>';
    else if (scene.status === 'failed') statusBadge = '<span class="badge badge-danger">✗ Lỗi</span>';

    tr.innerHTML = `
      <td><strong>#${scene.number}</strong></td>
      <td>
        <div style="font-weight:600; color:#fff;">${scene.title}</div>
        <div style="font-size:11px; color:var(--text-muted);">${scene.shotType}</div>
      </td>
      <td>${scene.duration}s (${scene.aspectRatio})</td>
      <td id="table-status-${scene.id}">${statusBadge}</td>
      <td>
        ${scene.videoPath ? `
          <button class="btn btn-sm btn-secondary btn-view-table-video" data-id="${scene.id}">Xem Video</button>
        ` : `
          <button class="btn btn-sm btn-ghost btn-table-single" data-id="${scene.id}">Tạo lẻ</button>
        `}
      </td>
    `;
    DOM.queueTableBody.appendChild(tr);
  });

  // Table events
  document.querySelectorAll('.btn-view-table-video').forEach(b => {
    b.addEventListener('click', () => {
      const sc = state.project.scenes.find(s => s.id === b.getAttribute('data-id'));
      if (sc) openVideoModal(sc);
    });
  });
  document.querySelectorAll('.btn-table-single').forEach(b => {
    b.addEventListener('click', () => {
      const sc = state.project.scenes.find(s => s.id === b.getAttribute('data-id'));
      if (sc) renderSingleScene(sc);
    });
  });
}

// ==================== BATCH GENERATION ENGINE (10-20 SCENES ON REAL CHROME) ==================== //
async function startBatchGeneration() {
  if (state.batch.isRunning) return;

  // Validate Real Chrome connection
  const isChromeMode = state.settings.endpointType !== 'google_api_key' && state.settings.endpointType !== 'demo';
  if (isChromeMode) {
    if (window.electronAPI && window.electronAPI.checkChromeAlive) {
      const isAlive = await window.electronAPI.checkChromeAlive();
      if (!isAlive) {
        showToast('Đang mở Google Chrome thật...', 'info');
        logToConsole('Đang khởi chạy Google Chrome thật với hồ sơ lưu vĩnh viễn...', 'info');
        await window.electronAPI.launchRealChrome('https://labs.google/fx/tools/flow');
        await sleep(3500);
      }
    }
  } else if (!state.settings.demoMode && state.settings.endpointType === 'ai_studio' && !state.settings.apiKey) {
    showToast('Vui lòng nhập Google API Key trong Cài Đặt hoặc bật Demo Mode!', 'error');
    DOM.btnOpenSettings.click();
    return;
  }

  const pendingScenes = state.project.scenes.filter(s => s.status !== 'completed');
  if (pendingScenes.length === 0) {
    showToast('Tất cả phân cảnh đã hoàn thành! Nếu muốn tạo lại, hãy nhấn "Làm mới" hoặc chỉnh sửa cảnh.', 'info');
    return;
  }

  // Set running state
  state.batch.isRunning = true;
  state.batch.isCancelled = false;
  state.batch.startTime = Date.now();

  DOM.btnStartBatch.style.display = 'none';
  DOM.btnStopBatch.style.display = 'inline-flex';
  DOM.badgeQueueStatus.textContent = 'Đang chạy';
  DOM.badgeQueueStatus.className = 'badge badge-info';

  startTimer();
  logToConsole(`====== BẮT ĐẦU CHẠY TỰ ĐỘNG HÀNG ĐỢI: ${pendingScenes.length} / ${state.project.scenes.length} PHÂN CẢNH TRÊN CHROME ======`, 'info');

  for (let i = 0; i < state.project.scenes.length; i++) {
    if (state.batch.isCancelled) {
      logToConsole('Đã dừng hàng đợi theo yêu cầu của người dùng.', 'warning');
      break;
    }

    const scene = state.project.scenes[i];
    if (scene.status === 'completed') continue;

    // Process this scene automatically
    await processSceneGeneration(scene);

    updateStats();
    renderQueueTable();
    renderScenesGrid();

    // Respect interval between scenes
    if (i < state.project.scenes.length - 1 && !state.batch.isCancelled) {
      await sleep(2500);
    }
  }

  // End batch
  stopTimer();
  state.batch.isRunning = false;
  DOM.btnStartBatch.style.display = 'inline-flex';
  DOM.btnStopBatch.style.display = 'none';
  DOM.badgeQueueStatus.textContent = 'Hoàn thành';
  DOM.badgeQueueStatus.className = 'badge badge-success';

  logToConsole('====== ĐÃ HOÀN TẤT TẠO TOÀN BỘ HÀNG ĐỢI TRÊN GOOGLE CHROME! ======', 'success');
  showToast('✓ Đã tự động tạo toàn bộ phân cảnh trong hàng đợi!', 'success');
  renderScenesGrid();
  renderQueueTable();
  updateStats();
}

function stopBatchGeneration() {
  state.batch.isCancelled = true;
  logToConsole('Yêu cầu dừng hàng đợi đã gửi...', 'warning');
  showToast('Đang dừng hàng đợi...', 'warning');
}

// Single scene execution
async function renderSingleScene(scene) {
  if (state.batch.isRunning) return;
  logToConsole(`Bắt đầu tạo đơn lẻ Cảnh #${scene.number} (${scene.title}) trên Chrome...`, 'info');
  await processSceneGeneration(scene);
  renderScenesGrid();
  renderQueueTable();
  updateStats();
}

// Process single scene generation lifecycle
async function processSceneGeneration(scene) {
  scene.status = 'generating';
  scene.error = null;
  updateSceneStatusUI(scene, 'Đang gửi sang Chrome...');
  logToConsole(`[Cảnh #${scene.number}] Đang chuẩn bị prompt & kiểm tra Google Flow...`, 'info');

  try {
    const isChromeMode = state.settings.endpointType !== 'google_api_key' && state.settings.endpointType !== 'demo';

    if (isChromeMode) {
      // 1. Ensure Chrome is running
      if (window.electronAPI && window.electronAPI.checkChromeAlive) {
        const alive = await window.electronAPI.checkChromeAlive();
        if (!alive) {
          logToConsole('Đang tự động khởi chạy Chrome...', 'info');
          await window.electronAPI.launchRealChrome('https://labs.google/fx/tools/flow');
          await sleep(3500);
        }
      }

      // 2. Prepare full prompt with Character DNA
      const fullPrompt = buildFullScenePrompt(scene);
      const imagePath = scene.referenceImage || state.project.characterProfile.referenceImage || null;

      logToConsole(`[Cảnh #${scene.number}] Tự động điền prompt ${imagePath ? 'và gửi ảnh nhân vật ' : ''}vào Google Flow...`, 'info');
      updateSceneStatusUI(scene, 'Đang điền vào Chrome...');

      let res = null;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        res = await window.electronAPI.injectPromptToChrome({
          prompt: fullPrompt,
          imagePath: imagePath
        });

        if (res && res.injected) {
          break;
        }

        if (res && res.navigating) {
          logToConsole(`[Cảnh #${scene.number}] ${res.reason || 'Đang mở dự án trên Google Flow...'} Đợi 3.5s và thử lại...`, 'info');
          await sleep(3500);
          continue;
        }

        if (attempt < maxRetries) {
          logToConsole(`[Cảnh #${scene.number}] Thử lại kết nối Flow (${attempt}/${maxRetries}): ${res?.reason || 'Đang chờ trang sẵn sàng...'}`, 'warning');
          await sleep(2500);
        }
      }

      if (!res || !res.injected) {
        try { await navigator.clipboard.writeText(fullPrompt); } catch (e) {}
        throw new Error(res?.reason || res?.error || 'Chưa thấy ô nhập prompt trên Chrome. Hãy mở 1 dự án trên Flow (prompt đã được copy vào Clipboard)!');
      }

      logToConsole(`✓ [Cảnh #${scene.number}] ĐÃ BẤM TẠO VIDEO TRÊN GOOGLE FLOW!`, 'success');
      showToast(`✓ Cảnh #${scene.number}: Đã gửi lệnh tạo trên Google Flow!`, 'success');

      // 3. Countdown waiting buffer so Google Flow creates video before sending next
      const waitSeconds = Math.max(12, parseInt(state.settings.batchDelaySeconds) || 15);
      for (let s = 1; s <= waitSeconds; s++) {
        if (state.batch.isCancelled) break;
        updateSceneStatusUI(scene, `Flow đang tạo (${s}/${waitSeconds}s)...`);
        await sleep(1000);
      }

      if (state.batch.isCancelled) {
        scene.status = 'idle';
        updateSceneStatusUI(scene, 'Đã hủy');
        return;
      }

      scene.status = 'completed';
      updateSceneStatusUI(scene, '✓ Đã tạo xong');
      logToConsole(`✓ [Cảnh #${scene.number}] Hoàn thành phân cảnh trên Google Flow!`, 'success');

    } else {
      // Fallback for official API Key or Demo mode
      const submitResult = await window.electronAPI.submitVeoScene({
        scene,
        characterProfile: state.project.characterProfile
      });

      const startTime = Date.now();
      let isDone = submitResult.isDone;
      let videoUrl = submitResult.videoUrl;
      let videoBase64 = submitResult.videoBase64;
      const operationName = submitResult.operationName;

      while (!isDone && !state.batch.isCancelled) {
        await sleep(4000);
        const elapsedMs = Date.now() - startTime;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        updateSceneStatusUI(scene, `Đang xử lý AI (${elapsedSec}s)...`);

        const statusResult = await window.electronAPI.checkVeoStatus({
          operationName,
          elapsedMs,
          isMock: submitResult.isMock
        });

        if (statusResult.done) {
          isDone = true;
          videoUrl = statusResult.videoUrl;
          videoBase64 = statusResult.videoBase64;
          break;
        }
      }

      if (state.batch.isCancelled) {
        scene.status = 'idle';
        updateSceneStatusUI(scene, 'Đã hủy');
        return;
      }

      const cleanTitle = scene.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
      const filename = `Scene_${String(scene.number).padStart(2, '0')}_${cleanTitle}.mp4`;

      const savedPath = await window.electronAPI.saveVeoVideo({
        videoUrl,
        videoBase64,
        outputDir: state.settings.exportDirectory,
        filename
      });

      scene.status = 'completed';
      scene.videoPath = savedPath;
      scene.videoUrl = videoUrl;
      updateSceneStatusUI(scene, 'Hoàn thành');
      logToConsole(`[Cảnh #${scene.number}] ✓ Lưu video thành công: ${savedPath}`, 'success');
    }

  } catch (err) {
    console.error('Generation error:', err);
    scene.status = 'failed';
    scene.error = err.message;
    updateSceneStatusUI(scene, 'Lỗi');
    logToConsole(`[Cảnh #${scene.number}] ✗ THẤT BẠI: ${err.message}`, 'error');
    showToast(`Lỗi Phân cảnh ${scene.number}: ${err.message}`, 'error');
  }
}

function updateSceneStatusUI(scene, label) {
  const pill = document.getElementById(`pill-${scene.id}`);
  if (pill) {
    pill.className = `status-pill ${scene.status}`;
    pill.innerHTML = `${scene.status === 'generating' ? '<span class="pulse-dot"></span>' : ''} ${label}`;
  }
  const tableStatus = document.getElementById(`table-status-${scene.id}`);
  if (tableStatus) {
    let badgeClass = 'badge';
    if (scene.status === 'completed') badgeClass = 'badge badge-success';
    else if (scene.status === 'failed') badgeClass = 'badge badge-danger';
    else if (scene.status === 'generating') badgeClass = 'badge badge-info pulse-dot';
    tableStatus.innerHTML = `<span class="${badgeClass}">${label}</span>`;
  }
}

// ==================== AI SCRIPT GENERATOR LOGIC ==================== //
async function executeAiScriptGeneration() {
  const topic = DOM.aiScriptTopic.value.trim();
  const count = parseInt(DOM.aiScriptCount.value) || 10;
  const engine = DOM.aiScriptEngine.value;

  if (!topic) {
    showToast('Vui lòng nhập chủ đề kịch bản', 'error');
    return;
  }

  DOM.btnExecuteAiScript.disabled = true;
  DOM.btnExecuteAiScript.textContent = 'Đang phân rã kịch bản...';

  try {
    logToConsole(`Đang phân rã kịch bản ${count} phân cảnh cho chủ đề: "${topic}"`, 'info');
    
    const scenes = await window.electronAPI.generateScenes({
      count,
      topic,
      characterProfile: state.project.characterProfile,
      useAi: engine === 'ai',
      model: 'gemini-1.5-flash'
    });

    if (scenes && scenes.length > 0) {
      state.project.scenes = scenes;
      DOM.modalAiScript.style.display = 'none';
      renderScenesGrid();
      renderQueueTable();
      updateStats();
      showToast(`Đã tự động tạo thành công ${scenes.length} phân cảnh!`, 'success');
      logToConsole(`✓ Đã nạp ${scenes.length} phân cảnh vào Storyboard`, 'success');
    }
  } catch (err) {
    showToast(`Lỗi tạo kịch bản: ${err.message}`, 'error');
    logToConsole(`Lỗi tạo kịch bản: ${err.message}`, 'error');
  } finally {
    DOM.btnExecuteAiScript.disabled = false;
    DOM.btnExecuteAiScript.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      Phân Rã & Tạo Phân Cảnh Ngay
    `;
  }
}

// ==================== SETTINGS MANAGEMENT ==================== //
async function checkChromeStatusInUI() {
  if (DOM.chromeStatusBadge && window.electronAPI && window.electronAPI.checkChromeAlive) {
    try {
      const alive = await window.electronAPI.checkChromeAlive();
      if (alive) {
        DOM.chromeStatusBadge.innerHTML = '<span style="color:#10b981; font-weight:600;">✓ Đang chạy & Sẵn sàng (Port 9222)</span>';
      } else {
        DOM.chromeStatusBadge.innerHTML = '<span style="color:#f59e0b;">Chưa mở (Bấm nút bên cạnh để mở)</span>';
      }
    } catch (e) {
      DOM.chromeStatusBadge.innerHTML = '<span style="color:#ef4444;">Lỗi kiểm tra port 9222</span>';
    }
  }
}

function updateSettingsUI() {
  DOM.settingDemoMode.checked = Boolean(state.settings.demoMode);
  const ep = state.settings.endpointType || 'real_chrome';
  DOM.settingEndpointType.value = ep;
  if (state.settings.model === 'veo-2.0-generate-001' || !state.settings.model) {
    state.settings.model = 'veo-3.1-generate-preview';
  }
  DOM.settingModelName.value = state.settings.model;
  DOM.settingApiKey.value = state.settings.apiKey || '';
  if (DOM.settingLabsCookie) DOM.settingLabsCookie.value = state.settings.labsCookie || '';
  DOM.settingExportDir.value = state.settings.exportDirectory || '';
  DOM.settingBatchDelay.value = state.settings.batchDelaySeconds || 15;
  DOM.settingDefaultStyle.value = state.settings.defaultArtStyle || '';
  DOM.settingVertexProject.value = state.settings.vertexProjectId || '';
  DOM.settingVertexLocation.value = state.settings.vertexLocation || 'us-central1';

  if (ep === 'real_chrome' || ep === 'labs_cookie') {
    if (DOM.btnTabChromeMode) DOM.btnTabChromeMode.className = 'btn btn-primary';
    if (DOM.btnTabApiMode) DOM.btnTabApiMode.className = 'btn btn-secondary';
    if (DOM.groupChromeMode) DOM.groupChromeMode.style.display = 'block';
    if (DOM.groupApiKey) DOM.groupApiKey.style.display = 'none';
  } else {
    if (DOM.btnTabApiMode) DOM.btnTabApiMode.className = 'btn btn-primary';
    if (DOM.btnTabChromeMode) DOM.btnTabChromeMode.className = 'btn btn-secondary';
    if (DOM.groupChromeMode) DOM.groupChromeMode.style.display = 'none';
    if (DOM.groupApiKey) DOM.groupApiKey.style.display = 'flex';
  }
  if (DOM.groupVertex) DOM.groupVertex.style.display = ep === 'vertex' ? 'grid' : 'none';

  checkChromeStatusInUI();

  // Mode badge
  if (state.settings.demoMode) {
    DOM.statModeBadge.innerHTML = `<span class="badge badge-warning">Demo Simulation</span>`;
  } else if (ep === 'real_chrome' || ep === 'labs_cookie') {
    DOM.statModeBadge.innerHTML = `<span class="badge badge-success">🚀 Chrome Thật (Tự Động)</span>`;
  } else {
    DOM.statModeBadge.innerHTML = `<span class="badge badge-info">${state.settings.model.split('-')[0].toUpperCase()}</span>`;
  }
}

async function saveSettingsFromUI() {
  state.settings.demoMode = DOM.settingDemoMode.checked;
  state.settings.endpointType = DOM.settingEndpointType.value;
  state.settings.model = DOM.settingModelName.value;
  state.settings.apiKey = DOM.settingApiKey.value.trim();
  state.settings.labsCookie = DOM.settingLabsCookie.value.trim();
  state.settings.exportDirectory = DOM.settingExportDir.value;
  state.settings.batchDelaySeconds = parseInt(DOM.settingBatchDelay.value) || 5;
  state.settings.defaultArtStyle = DOM.settingDefaultStyle.value.trim();
  state.settings.vertexProjectId = DOM.settingVertexProject.value.trim();
  state.settings.vertexLocation = DOM.settingVertexLocation.value.trim();

  if (window.electronAPI) {
    await window.electronAPI.saveSettings(state.settings);
  }

  DOM.modalSettings.style.display = 'none';
  updateSettingsUI();
  showToast('Đã lưu cấu hình Veo 3 Studio!', 'success');
  logToConsole('Đã cập nhật cài đặt Veo 3 API', 'info');
}

// ==================== PROJECT SAVE & LOAD ==================== //
async function saveProjectToFile() {
  if (!window.electronAPI) return;
  saveCharFormToState();
  const projectData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    project: state.project
  };

  const res = await window.electronAPI.saveProject(projectData);
  if (res.success) {
    showToast('Đã lưu dự án thành công!', 'success');
    logToConsole(`Đã lưu dự án vào: ${res.filePath}`, 'success');
  }
}

async function loadProjectFromFile() {
  if (!window.electronAPI) return;
  const res = await window.electronAPI.loadProject();
  if (res.success && res.project?.project) {
    state.project = res.project.project;
    DOM.projectTitleInput.value = state.project.title;
    updateCharacterUI();
    renderScenesGrid();
    renderQueueTable();
    updateStats();
    showToast('Đã mở dự án thành công!', 'success');
    logToConsole(`Đã mở dự án từ: ${res.filePath}`, 'success');
  }
}

// ==================== STATS & HELPERS ==================== //
function updateStats() {
  const total = state.project.scenes.length;
  const completed = state.project.scenes.filter(s => s.status === 'completed').length;
  const active = state.project.scenes.filter(s => s.status === 'generating').length;

  DOM.statTotalScenes.textContent = total;
  DOM.statCompletedScenes.textContent = completed;
  DOM.statActiveScenes.textContent = active;

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  DOM.batchProgressBar.style.width = `${pct}%`;
  DOM.batchProgressCaption.textContent = `Tiến độ: ${completed} / ${total} phân cảnh (${pct}%)`;
}

function startTimer() {
  clearInterval(state.batch.timerInterval);
  state.batch.timerInterval = setInterval(() => {
    if (!state.batch.startTime) return;
    const diff = Math.floor((Date.now() - state.batch.startTime) / 1000);
    const m = String(Math.floor(diff / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    DOM.statElapsedTime.textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(state.batch.timerInterval);
}

function logToConsole(message, type = 'normal') {
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  const time = new Date().toTimeString().slice(0, 8);
  line.textContent = `[${time}] ${message}`;
  DOM.consoleLogs.appendChild(line);
  DOM.consoleLogs.scrollTop = DOM.consoleLogs.scrollHeight;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start application
window.addEventListener('DOMContentLoaded', initApp);
