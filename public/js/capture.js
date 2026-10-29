// ===== CAMERA LOGIC =====
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');

let stream = null;
let currentHeading = null;
let model = null;
let track = null;

// Zoom tracking variables
let currentZoom = 1.0;
let minZoom = 1.0;
let maxZoom = 1.0;
let supportsHardwareZoom = false;

(async function initCamera() {
  try {
    // Request camera with ideal resolution
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: { ideal: 1920 } } 
    });
    video.srcObject = stream;

    // Get the video track to manipulate zoom
    track = stream.getVideoTracks()[0];
    
    // Check if the device supports hardware zoom
    const capabilities = track.getCapabilities();
    if (capabilities.zoom) {
      supportsHardwareZoom = true;
      minZoom = capabilities.zoom.min || 1;
      maxZoom = capabilities.zoom.max || 5;
      currentZoom = minZoom;
      updateZoomUI();
    } else {
      // Fallback for devices without hardware zoom (e.g., older laptops)
      document.getElementById('zoom-controls').style.display = 'none';
    }

    // Load the AI model
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    status.textContent = '✅ Ready. Point camera and capture.';
  } catch (err) {
    status.textContent = 'Camera/Model error: ' + err.message;
  }
})();

// Apply the zoom level to the hardware
async function applyHardwareZoom(newZoom) {
  if (!supportsHardwareZoom) return;
  
  // Clamp the zoom between min and max
  newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
  currentZoom = newZoom;
  
  try {
    await track.applyConstraints({
      advanced: [{ zoom: currentZoom }]
    });
    updateZoomUI();
  } catch (err) {
    console.warn('Failed to apply zoom:', err);
  }
}

// Update the +/- display text
function updateZoomUI() {
  const display = document.getElementById('zoom-level');
  if (display) display.textContent = currentZoom.toFixed(1) + 'x';
}

// Button zoom (for desktop/no touch)
function zoom(factor) {
  if (!supportsHardwareZoom) return;
  applyHardwareZoom(currentZoom * factor);
}

// Pinch-to-zoom (for touch devices)
let initialPinchDistance = null;
let initialZoomAtPinch = null;

video.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    initialPinchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    initialZoomAtPinch = currentZoom;
  }
}, { passive: true });

video.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && initialPinchDistance !== null) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    
    const factor = currentDistance / initialPinchDistance;
    const newZoom = initialZoomAtPinch * factor;
    
    applyHardwareZoom(newZoom);
  }
}, { passive: true });

video.addEventListener('touchend', () => {
  initialPinchDistance = null;
  initialZoomAtPinch = null;
}, { passive: true });

// ===== METADATA =====
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

// ===== CAPTURE =====
document.getElementById('captureBtn').addEventListener('click', async () => {
  status.textContent = '📸 Capturing…';

  // Draw exactly what the camera sees (hardware zoom is already applied to the stream)
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  const pos = await getPosition();
  const metadata = {
    capturedAt: new Date().toISOString(),
    compassHeading: currentHeading,
    ...pos
  };

  let labels = [];
  if (model) {
    try {
      const preds = await model.classify(canvas, 5);
      labels = preds.map(p => ({ label: p.className, probability: p.probability }));
    } catch {}
  }

  document.getElementById('metadata-input').value = JSON.stringify(metadata);
  document.getElementById('labels-input').value = JSON.stringify(labels);

  canvas.toBlob(blob => {
    const fd = new FormData(document.getElementById('camera-form'));
    fd.append('image', blob, 'capture.jpg');
    fetch('/photos', { method: 'POST', body: fd })
      .then(() => window.location.href = '/photos')
      .catch(err => status.textContent = 'Upload failed: ' + err.message);
  }, 'image/jpeg', 0.9);
});