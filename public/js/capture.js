const token = null; // Not needed — using session cookies

// ===== TAB SWITCHING =====
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`${name}-tab`).classList.add('active');
  btn.classList.add('active');
}

// ===== CAMERA LOGIC =====
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');

let stream = null;
let currentHeading = null;
let model = null;
let zoomLevel = 1.0;

(async function initCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: { ideal: 1280 } } 
    });
    video.srcObject = stream;
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    status.textContent = '✅ Ready. Point camera and capture.';
  } catch (err) {
    status.textContent = 'Camera/Model error: ' + err.message;
  }
})();

// Zoom functionality using CSS transform
function zoom(factor) {
  zoomLevel = Math.min(3.0, Math.max(0.5, zoomLevel * factor));
  document.getElementById('zoom-level').textContent = zoomLevel.toFixed(1) + 'x';
  video.style.transform = `scale(${zoomLevel})`;
}

// Compass
window.addEventListener('deviceorientationabsolute', e => {
  if (e.alpha !== null) currentHeading = e.alpha;
});
window.addEventListener('deviceorientation', e => {
  if (currentHeading === null && e.alpha !== null) currentHeading = e.alpha;
});

function getPosition() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

document.getElementById('captureBtn').addEventListener('click', async () => {
  status.textContent = '📸 Capturing…';

  // Draw video frame to canvas (accounting for zoom)
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  
  // Apply zoom by scaling the drawn image
  const scaledW = canvas.width / zoomLevel;
  const scaledH = canvas.height / zoomLevel;
  const offsetX = (canvas.width - scaledW) / 2;
  const offsetY = (canvas.height - scaledH) / 2;
  ctx.drawImage(video, offsetX, offsetY, scaledW, scaledH, 0, 0, canvas.width, canvas.height);

  // Get metadata
  const pos = await getPosition();
  const metadata = {
    capturedAt: new Date().toISOString(),
    compassHeading: currentHeading,
    ...pos
  };

  // AI classification
  let labels = [];
  if (model) {
    try {
      const preds = await model.classify(canvas, 5);
      labels = preds.map(p => ({ label: p.className, probability: p.probability }));
    } catch {}
  }

  document.getElementById('metadata-input').value = JSON.stringify(metadata);
  document.getElementById('labels-input').value = JSON.stringify(labels);

  // Submit
  canvas.toBlob(blob => {
    const fd = new FormData(document.getElementById('camera-form'));
    fd.append('image', blob, 'capture.jpg');
    fetch('/photos', { method: 'POST', body: fd })
      .then(() => window.location.href = '/photos')
      .catch(err => status.textContent = 'Upload failed: ' + err.message);
  }, 'image/jpeg', 0.9);
});

// ===== UPLOAD TAB LOGIC =====
const fileInput = document.getElementById('image-file');
const preview = document.getElementById('preview');
const uploadStatus = document.getElementById('upload-status');
const uploadPredictions = document.getElementById('upload-predictions');
const uploadSubmit = document.getElementById('upload-submit');

fileInput?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Show preview
  const reader = new FileReader();
  reader.onload = (ev) => {
    preview.src = ev.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);

  uploadStatus.textContent = '🔍 Analyzing image…';

  // AI classification on uploaded image
  const img = new Image();
  img.onload = async () => {
    let labels = [];
    if (model) {
      try {
        const preds = await model.classify(img, 5);
        labels = preds.map(p => ({ label: p.className, probability: p.probability }));
      } catch {}
    }

    document.getElementById('upload-labels').value = JSON.stringify(labels);
    
    // Show predictions
    uploadPredictions.innerHTML = labels.map(l => `
      <div class="pred">
        <span class="pred-label">${l.label}</span>
        <span class="pred-bar"><span style="width:${(l.probability * 100).toFixed(0)}%"></span></span>
        <span class="pred-prob">${(l.probability * 100).toFixed(0)}%</span>
      </div>
    `).join('');

    // Try to extract metadata (compass/GPS may not apply to uploads)
    const pos = await getPosition();
    const metadata = {
      capturedAt: new Date().toISOString(),
      compassHeading: currentHeading,
      ...pos
    };
    document.getElementById('upload-metadata').value = JSON.stringify(metadata);

    uploadSubmit.disabled = false;
    uploadStatus.textContent = '✅ Ready to upload';
  };
  img.src = URL.createObjectURL(file);
});

// Handle upload form submission
document.getElementById('upload-form')?.addEventListener('submit', (e) => {
  // Ensure metadata/labels are set before submit
  if (!document.getElementById('upload-metadata').value) {
    document.getElementById('upload-metadata').value = JSON.stringify({
      capturedAt: new Date().toISOString()
    });
  }
  if (!document.getElementById('upload-labels').value) {
    document.getElementById('upload-labels').value = '[]';
  }
});