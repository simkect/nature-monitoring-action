const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');
const form = document.getElementById('upload-form');

let stream = null;
let currentHeading = null;
let model = null;

(async function init() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    textContent = 'Ready. Point camera and capture.';
  } catch (err) {
    textContent = 'Camera/Model error: ' + err.message;
  }
})();

window.addEventListener('deviceorientationabsolute', e => { if (e.alpha !== null) currentHeading = e.alpha; });

function getPosition() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve({})
    );
  });
}

document.getElementById('captureBtn').addEventListener('click', async () => {
  textContent = 'Processing...';
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
    const preds = await model.classify(canvas, 3);
    labels = preds.map(p => ({ label: p.className, probability: p.probability }));
  }

  document.getElementById('metadata-input').value = JSON.stringify(metadata);
  document.getElementById('labels-input').value = JSON.stringify(labels);

  canvas.toBlob(blob => {
    const fd = new FormData(form);
    fd.append('image', blob, 'capture.jpg');
    
    // Submit manually since we have the blob
    fetch('/photos', { method: 'POST', body: fd })
      .then(res => { window.location.href = '/photos'; })
      .catch(err => status.textContent = 'Upload failed');
  }, 'image/jpeg', 0.9);
});