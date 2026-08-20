// =====================================================
//  Klasifikasi Biji Kopi — Main JavaScript
//  Handles: Upload, Camera, AJAX Prediction, UI
// =====================================================

// ─── State ──────────────────────────────────────────
let currentTab = 'upload';
let cameraStream = null;
let cameraInterval = null;
let isCameraActive = false;
const CAMERA_INTERVAL_MS = 1500; // setiap 1.5 detik kirim frame

// ─── DOM Refs ────────────────────────────────────────
const tabUpload  = document.getElementById('tab-upload');
const tabCamera  = document.getElementById('tab-camera');
const panelUpload= document.getElementById('panel-upload');
const panelCamera= document.getElementById('panel-camera');

const uploadArea       = document.getElementById('upload-area');
const fileInput        = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const previewImage     = document.getElementById('preview-image');
const previewFilename  = document.getElementById('preview-filename');
const btnRemove        = document.getElementById('btn-remove');
const btnClassify      = document.getElementById('btn-classify');
const uploadIcon       = document.getElementById('upload-icon');

const cameraVideo      = document.getElementById('camera-video');
const cameraOverlay    = document.getElementById('camera-overlay');
const btnStartCamera   = document.getElementById('btn-start-camera');
const btnStopCamera    = document.getElementById('btn-stop-camera');
const scanFrame        = document.getElementById('scan-frame');
const cameraResultBadge= document.getElementById('camera-result-badge');
const cameraResultClass= document.getElementById('camera-result-class');
const cameraResultConf = document.getElementById('camera-result-confidence');

const loadingOverlay   = document.getElementById('loading-overlay');

// ─── Splash Screen ───────────────────────────────────
window.addEventListener('load', () => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    if (sessionStorage.getItem('splash_shown')) {
      // Jika sudah pernah muncul di sesi ini, langsung sembunyikan secara instan
      splash.style.display = 'none';
      splash.classList.add('hidden');
    } else {
      // Kunjungan pertama di sesi ini: tampilkan selama 2 detik
      setTimeout(() => {
        splash.classList.add('hidden');
        sessionStorage.setItem('splash_shown', 'true');
      }, 2000);
    }
  }
});

// ─── Tab Switching ───────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  if (tab === 'upload') {
    tabUpload?.classList.add('active');
    tabCamera?.classList.remove('active');
    panelUpload?.classList.remove('hidden');
    panelCamera?.classList.add('hidden');
    stopCamera();
  } else {
    tabCamera?.classList.add('active');
    tabUpload?.classList.remove('active');
    panelCamera?.classList.remove('hidden');
    panelUpload?.classList.add('hidden');
  }
}

tabUpload?.addEventListener('click', () => switchTab('upload'));
tabCamera?.addEventListener('click', () => switchTab('camera'));

// ─── Upload Handlers ─────────────────────────────────
uploadArea?.addEventListener('click', (e) => {
  if (e.target !== btnRemove && !btnRemove?.contains(e.target)) {
    fileInput?.click();
  }
});

uploadArea?.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea?.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea?.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelect(file);
});

fileInput?.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) handleFileSelect(file);
});

btnRemove?.addEventListener('click', (e) => {
  e.stopPropagation();
  clearUpload();
});

function handleFileSelect(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Ukuran file terlalu besar. Maksimal 10MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewFilename.textContent = file.name;
    previewContainer.style.display = 'block';
    uploadArea.classList.add('has-image');
    uploadIcon.textContent = '✅';
    btnClassify.disabled = false;
  };
  reader.readAsDataURL(file);
}

function clearUpload() {
  fileInput.value = '';
  previewImage.src = '';
  previewFilename.textContent = '';
  previewContainer.style.display = 'none';
  uploadArea.classList.remove('has-image');
  uploadIcon.textContent = '📤';
  btnClassify.disabled = true;
}

// ─── Classify Upload ─────────────────────────────────
btnClassify?.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) { showToast('Pilih gambar terlebih dahulu.', 'error'); return; }

  showLoading(true);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/predict', { method: 'POST', body: formData });
    const data = await response.json();

    if (!data.success) {
      showToast(data.error || 'Terjadi kesalahan pada prediksi.', 'error');
      showLoading(false);
      return;
    }

    // Simpan hasil ke sessionStorage & redirect ke result page
    sessionStorage.setItem('prediction_result', JSON.stringify(data));
    window.location.href = '/result';

  } catch (err) {
    showToast('Koneksi ke server gagal.', 'error');
    console.error(err);
  } finally {
    showLoading(false);
  }
});

// ─── Camera Handlers ─────────────────────────────────
btnStartCamera?.addEventListener('click', startCamera);
btnStopCamera?.addEventListener('click', stopCamera);

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    cameraVideo.srcObject = cameraStream;
    await cameraVideo.play();

    cameraOverlay.classList.add('hidden');
    scanFrame?.classList.remove('hidden');
    btnStartCamera?.classList.add('hidden');
    btnStopCamera?.classList.remove('hidden');
    isCameraActive = true;

    // Mulai interval prediksi
    cameraInterval = setInterval(captureAndPredict, CAMERA_INTERVAL_MS);

  } catch (err) {
    console.error('Camera error:', err);
    if (err.name === 'NotAllowedError') {
      showToast('Izin kamera ditolak. Aktifkan izin kamera di browser.', 'error');
    } else {
      showToast('Kamera tidak tersedia.', 'error');
    }
  }
}

function stopCamera() {
  if (cameraInterval) { clearInterval(cameraInterval); cameraInterval = null; }
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  if (cameraVideo) { cameraVideo.srcObject = null; }
  isCameraActive = false;
  cameraOverlay?.classList.remove('hidden');
  scanFrame?.classList.add('hidden');
  btnStartCamera?.classList.remove('hidden');
  btnStopCamera?.classList.add('hidden');
  if (cameraResultBadge) cameraResultBadge.style.display = 'none';
}

async function captureAndPredict() {
  if (!isCameraActive || !cameraVideo.videoWidth) return;

  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cameraVideo, 0, 0);
  const base64Image = canvas.toDataURL('image/jpeg', 0.8);

  try {
    const response = await fetch('/predict_camera', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    });
    const data = await response.json();

    if (data.success && cameraResultBadge) {
      cameraResultBadge.style.display = 'block';
      if (data.is_recognized) {
        cameraResultClass.textContent = data.class_name;
        cameraResultConf.textContent = `${data.confidence}% — ${data.confidence_level.label}`;
        cameraResultBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      } else {
        cameraResultClass.textContent = 'Tidak Dikenali';
        cameraResultConf.textContent = 'Arahkan kamera ke biji kopi';
        cameraResultBadge.style.borderColor = 'rgba(107, 114, 128, 0.4)';
      }
    }
  } catch (err) {
    // Silent fail for camera stream
  }
}

// ─── Result Page ─────────────────────────────────────
function initResultPage() {
  const dataRaw = sessionStorage.getItem('prediction_result');
  if (!dataRaw) {
    // Jika tidak ada data, kembali ke halaman klasifikasi
    window.location.href = '/klasifikasi';
    return;
  }

  const data = JSON.parse(dataRaw);
  sessionStorage.removeItem('prediction_result');

  // Set class name
  const elClass = document.getElementById('result-class-name');
  const elIcon  = document.getElementById('result-icon');
  const elLatin = document.getElementById('result-latin');
  const elConfValue = document.getElementById('confidence-value');
  const elConfBar   = document.getElementById('confidence-bar');
  const elConfLevel = document.getElementById('confidence-level-badge');
  const elDescription = document.getElementById('result-description');
  const elPreviewImg  = document.getElementById('result-preview-img');

  if (elClass) elClass.textContent = data.class_name;
  if (elConfValue) elConfValue.textContent = data.confidence + '%';

  // Set icon & latin based on class
  const icons = { 'Arabika': '☕', 'Liberika': '🌿', 'Robusta': '⚡', 'Tidak Dikenali': '🚫' };
  const latins = {
    'Arabika': 'Coffea arabica',
    'Liberika': 'Coffea liberica',
    'Robusta': 'Coffea canephora',
    'Tidak Dikenali': 'Objek tidak teridentifikasi sebagai biji kopi'
  };
  if (elIcon) elIcon.textContent = icons[data.class_name] || '❓';
  if (elLatin) elLatin.textContent = latins[data.class_name] || '';

  // Confidence bar animation
  if (elConfBar) {
    setTimeout(() => {
      elConfBar.style.width = data.confidence + '%';
    }, 300);
  }

  // Confidence level badge
  if (elConfLevel && data.confidence_level) {
    elConfLevel.textContent = data.confidence_level.icon + ' ' + data.confidence_level.label;
    elConfLevel.style.background = hexToRgba(data.confidence_level.color, 0.15);
    elConfLevel.style.color = data.confidence_level.color;
    elConfLevel.style.border = `1px solid ${hexToRgba(data.confidence_level.color, 0.3)}`;
  }

  // Probability bars
  if (data.all_probabilities) {
    const colors = { 'Arabika': '#f59e0b', 'Liberika': '#22c55e', 'Robusta': '#8b5cf6' };
    Object.entries(data.all_probabilities).forEach(([cls, prob]) => {
      const fillEl = document.getElementById(`prob-${cls.toLowerCase()}`);
      const valEl  = document.getElementById(`prob-val-${cls.toLowerCase()}`);
      if (fillEl) {
        fillEl.style.background = colors[cls] || '#f59e0b';
        setTimeout(() => { fillEl.style.width = prob + '%'; }, 400);
      }
      if (valEl) valEl.textContent = prob.toFixed(1) + '%';
    });
  }

  // Coffee info
  if (data.coffee_info) {
    const info = data.coffee_info;
    if (elDescription) elDescription.textContent = info.description;

    const fields = ['origin', 'kafein', 'aroma', 'rasa', 'keasaman', 'body', 'seduh'];
    fields.forEach(field => {
      const el = document.getElementById(`info-${field}`);
      if (el && info[field]) el.textContent = info[field];
    });
  }

  // Preview image
  if (data.image_url && elPreviewImg) {
    elPreviewImg.src = data.image_url + '?t=' + Date.now();
    elPreviewImg.style.display = 'block';
  }
}

// ─── Utility Functions ───────────────────────────────
function showLoading(show) {
  if (!loadingOverlay) return;
  if (show) loadingOverlay.classList.add('active');
  else loadingOverlay.classList.remove('active');
}

function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Init ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Check model status
  fetch('/model_status')
    .then(r => r.json())
    .then(data => {
      const banner = document.getElementById('model-status-banner');
      if (banner) {
        if (!data.model_loaded) {
          banner.classList.remove('hidden');
        }
      }
    })
    .catch(() => {});

  // Result page init
  if (document.getElementById('result-class-name')) {
    initResultPage();
  }

  // Animate confidence bar on result page (triggered by initResultPage)
});

// Stop camera when leaving page
window.addEventListener('beforeunload', stopCamera);
window.addEventListener('visibilitychange', () => {
  if (document.hidden && isCameraActive) stopCamera();
});
