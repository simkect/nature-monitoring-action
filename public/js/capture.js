// ===== SMARTER LABEL SYSTEM =====
// This maps the 1000 specific MobileNet labels into ~30 broad categories
const LABEL_GROUPS = {
  // People
  person: ['person', 'man', 'woman', 'child', 'boy', 'girl', 'people', 'face', 'human'],
  
  // Animals
  dog: ['dog', 'puppy', 'retriever', 'terrier', 'spaniel', 'poodle', 'husky', 'corgi', 'bulldog', 'shepherd', 'chihuahua', 'dalmatian', 'pug', 'schnauzer', 'collie'],
  cat: ['cat', 'kitten', 'tabby', 'persian', 'siamese', 'egyptian'],
  bird: ['bird', 'eagle', 'hawk', 'owl', 'parrot', 'penguin', 'swan', 'duck', 'goose', 'chicken', 'rooster', 'hen', 'peacock', 'flamingo', 'ostrich', 'toucan', 'hummingbird'],
  fish: ['fish', 'shark', 'salmon', 'trout', 'goldfish', 'stingray', 'eel'],
  insect: ['insect', 'butterfly', 'bee', 'ant', 'spider', 'beetle', 'fly', 'moth', 'dragonfly', 'grasshopper', 'ladybug'],
  wild_animal: ['fox', 'wolf', 'bear', 'lion', 'tiger', 'zebra', 'elephant', 'camel', 'giraffe', 'deer', 'rabbit', 'squirrel', 'monkey', 'gorilla', 'panda', 'koala', 'kangaroo', 'hippo', 'rhino', 'crocodile'],
  farm_animal: ['cow', 'pig', 'sheep', 'goat', 'horse', 'donkey', 'llama'],
  marine_animal: ['whale', 'dolphin', 'seal', 'octopus', 'jellyfish', 'crab', 'lobster'],
  
  // Nature
  tree: ['tree', 'oak', 'pine', 'palm', 'fir', 'willow', 'maple', 'birch', 'cedar', 'cypress', 'conifer', 'eucalyptus', 'baobab', 'bonsai'],
  flower: ['flower', 'rose', 'daisy', 'tulip', 'orchid', 'sunflower', 'daffodil', 'poppy', 'lotus', 'dandelion', 'marigold', 'lavender', 'petunia'],
  plant: ['plant', 'leaf', 'fern', 'moss', 'cactus', 'succulent', 'bush', 'shrub', 'grass', 'vine', 'ivy'],
  mushroom: ['mushroom', 'fungus', 'agaric', 'bolete'],
  landscape: ['mountain', 'hill', 'valley', 'cliff', 'canyon', 'volcano', 'glacier', 'desert', 'forest', 'jungle', 'savanna', 'meadow', 'field', 'park'],
  water: ['water', 'river', 'lake', 'ocean', 'sea', 'waterfall', 'stream', 'pond', 'beach', 'coast', 'waves', 'fountain'],
  sky: ['sky', 'cloud', 'sunset', 'sunrise', 'rainbow', 'sun', 'moon', 'star', 'snow'],
  fire: ['fire', 'flame', 'smoke'],
  
  // Objects
  vehicle: ['car', 'vehicle', 'truck', 'bus', 'train', 'motorcycle', 'bicycle', 'bike', 'airplane', 'helicopter', 'boat', 'ship', 'scooter', 'taxi', 'jeep', 'limousine'],
  food: ['food', 'pizza', 'burger', 'sandwich', 'sushi', 'bread', 'cake', 'apple', 'banana', 'orange', 'grape', 'strawberry', 'cheese', 'hotdog', 'pasta', 'salad', 'soup'],
  drink: ['drink', 'coffee', 'tea', 'wine', 'beer', 'juice', 'milk', 'water bottle', 'cocktail'],
  furniture: ['chair', 'table', 'sofa', 'couch', 'bed', 'desk', 'bench', 'cabinet', 'shelf', 'stool'],
  electronics: ['laptop', 'computer', 'phone', 'cell phone', 'smartphone', 'tablet', 'tv', 'television', 'camera', 'keyboard', 'mouse', 'monitor', 'headphones', 'speaker'],
  building: ['building', 'house', 'tower', 'skyscraper', 'church', 'castle', 'bridge', 'barn', 'hut', 'temple', 'mosque', 'palace'],
  clothing: ['shirt', 'tshirt', 'jacket', 'coat', 'pants', 'jeans', 'dress', 'skirt', 'shoe', 'boot', 'sneaker', 'hat', 'cap', 'scarf', 'glove', 'sock', 'sweater', 'suit', 'tie'],
  tool: ['tool', 'hammer', 'wrench', 'screwdriver', 'saw', 'drill', 'axe', 'shovel', 'rake'],
  
  // Misc
  outdoor_activity: ['park', 'garden', 'playground', 'stadium', 'sports field', 'golf course'],
  indoor_activity: ['classroom', 'kitchen', 'office', 'restaurant', 'library', 'store', 'shop', 'supermarket'],
};

// Reverse lookup: "labrador retriever" -> "dog"
const LABEL_LOOKUP = {};
for (const [group, labels] of Object.entries(LABEL_GROUPS)) {
  for (const l of labels) {
    LABEL_LOOKUP[l.toLowerCase()] = group;
  }
}

// ===== EXIF DATE READER =====
// Reads the "DateTimeOriginal" tag from JPEG EXIF data
function getExifDate(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target.result);
        // Check for JPEG magic bytes (0xFFD8)
        if (view.getUint16(0, false) !== 0xFFD8) return resolve(null);
        
        let offset = 2;
        const length = view.byteLength;
        
        while (offset < length) {
          // Each EXIF block starts with 0xFFE1 (APP1 marker)
          if (view.getUint16(offset, false) === 0xFFE1) {
            // Skip the marker and the length bytes
            const exifStart = offset + 4;
            
            // Check for "Exif" header (0x45786966)
            if (view.getUint32(exifStart, false) !== 0x45786966) {
              offset += 2 + view.getUint16(offset + 2, false);
              continue;
            }
            
            // Read the date from the EXIF data
            // The date is stored as "YYYY:MM:DD HH:MM:SS"
            const exifData = e.target.result;
            const dateMatch = exifData.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
            
            if (dateMatch) {
              const [_, y, m, d, hh, mm, ss] = dateMatch;
              return resolve(new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`));
            }
            
            return resolve(null);
          }
          offset += 2 + view.getUint16(offset + 2, false);
        }
        resolve(null);
      } catch (err) {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    // Only read the first 128KB (EXIF is always at the start)
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024));
  });
}

// ===== SMART DATE FORMATTER =====
// Converts any Date object into a structured metadata object
function formatDate(date) {
  return {
    capturedAt: date.toISOString(),
    capturedDate: date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    capturedTime: date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    capturedDay: date.toISOString().split('T')[0],  // "2026-10-29" — for grouping/filtering
    capturedYear: date.getFullYear(),
    capturedMonth: date.getMonth() + 1
  };
}

// ===== FUNCTIONS =====

// Group raw MobileNet predictions into broader categories
function groupPredictions(predictions, threshold = 0.05) {
  const grouped = {};
  
  predictions.forEach(p => {
    if (p.probability < threshold) return;
    
    // MobileNet often returns multi-word labels like "Labrador retriever"
    const raw = p.className.toLowerCase();
    
    // Check if any known keyword is inside this label
    let matchedGroup = null;
    for (const [keyword, group] of Object.entries(LABEL_LOOKUP)) {
      if (raw.includes(keyword)) {
        matchedGroup = group;
        break;
      }
    }
    
    // If no group matched, use the raw label (fallback)
    const finalLabel = matchedGroup || raw;
    
    if (!grouped[finalLabel] || grouped[finalLabel].probability < p.probability) {
      grouped[finalLabel] = { 
        label: finalLabel, 
        probability: p.probability 
      };
    }
  });
  
  return Object.values(grouped)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3); // Top 3 groups
}

// Build a single readable sentence from the groups
function buildSummarySentence(groups) {
  if (!groups || groups.length === 0) return "Unknown";
  
  const top = groups[0];
  const confidence = Math.round(top.probability * 100);
  
  // Format based on confidence
  if (confidence >= 75) {
    return `The image clearly shows ${top.label}.`;
  } else if (confidence >= 40) {
    return `The image likely shows ${top.label}.`;
  } else {
    return `The image may contain ${top.label}.`;
  }
}

// ===== CAMERA LOGIC =====
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');

let stream = null;
let currentHeading = null;
let model = null;
let track = null;
let currentZoom = 1.0;
let minZoom = 1.0;
let maxZoom = 1.0;
let supportsHardwareZoom = false;

(async function initCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: { ideal: 1920 } } 
    });
    video.srcObject = stream;
    track = stream.getVideoTracks()[0];
    
    const capabilities = track.getCapabilities();
    if (capabilities.zoom) {
      supportsHardwareZoom = true;
      minZoom = capabilities.zoom.min || 1;
      maxZoom = capabilities.zoom.max || 5;
      currentZoom = minZoom;
      updateZoomUI();
    } else {
      document.getElementById('zoom-controls').style.display = 'none';
    }

    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    textContent = '✅ Ready. Point camera and capture.';
  } catch (err) {
    textContent = 'Camera/Model error: ' + err.message;
  }
})();

async function applyHardwareZoom(newZoom) {
  if (!supportsHardwareZoom) return;
  newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
  currentZoom = newZoom;
  try {
    await track.applyConstraints({ advanced: [{ zoom: currentZoom }] });
    updateZoomUI();
  } catch (err) { console.warn('Failed to apply zoom:', err); }
}

function updateZoomUI() {
  const display = document.getElementById('zoom-level');
  if (display) display.textContent = currentZoom.toFixed(1) + 'x';
}

function zoom(factor) {
  if (!supportsHardwareZoom) return;
  applyHardwareZoom(currentZoom * factor);
}

// Pinch-to-zoom
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
    applyHardwareZoom(initialZoomAtPinch * factor);
  }
}, { passive: true });

video.addEventListener('touchend', () => {
  initialPinchDistance = null;
  initialZoomAtPinch = null;
}, { passive: true });

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

// ===== CAPTURE =====
document.getElementById('captureBtn').addEventListener('click', async () => {
  textContent = '📸 Capturing…';

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  const pos = await getPosition();
  
  // Use the same formatDate() helper — the camera always uses "now"
  const dateData = formatDate(new Date());
  
  const metadata = {
    ...dateData,
    compassHeading: currentHeading,
    ...pos
  };

  // ===== SMART CLASSIFICATION =====
  let labels = [];
  let summary = "Unknown";
  
  if (model) {
    try {
      // Get top 10 raw predictions from MobileNet (more data = better grouping)
      const rawPreds = await model.classify(canvas, 10);
      
      // Group them into broad categories
      labels = groupPredictions(rawPreds, 0.03);
      
      // Build the summary sentence
      summary = buildSummarySentence(labels);
    } catch (err) {
      console.warn('Classification failed:', err);
    }
  }

  // Prepend the summary as the first label (used for captioning and filtering)
  const finalLabels = [{ label: summary, probability: labels[0]?.probability || 0 }, ...labels];

  document.getElementById('metadata-input').value = JSON.stringify(metadata);
  document.getElementById('labels-input').value = JSON.stringify(finalLabels);

  // Show the summary to the user
  textContent = '🔍 ' + summary;

  canvas.toBlob(blob => {
    const fd = new FormData(document.getElementById('camera-form'));
    fd.append('image', blob, 'capture.jpg');
    fetch('/photos', { method: 'POST', body: fd })
      .then(() => window.location.href = '/photos')
      .catch(err => textContent = 'Upload failed: ' + err.message);
  }, 'image/jpeg', 0.9);
});

// ===== TAB SWITCHING =====
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`${name}-tab`).classList.add('active');
  btn.classList.add('active');
}

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

  // ===== STEP 1: Detect the date =====
  let photoDate = new Date(); // Default to now
  let dateSource = 'current'; // Track where the date came from

  try {
    const exifDate = await getExifDate(file);
    if (exifDate && !isNaN(exifDate.getTime())) {
      photoDate = exifDate;
      dateSource = 'exif';
    }
  } catch (err) {
    console.warn('EXIF read failed:', err);
  }

  // Format the date with the same logic as camera captures
  const dateData = formatDate(photoDate);

  // ===== STEP 2: AI Classification =====
  const img = new Image();
  img.onload = async () => {
    let labels = [];
    let summary = "Unknown";

    if (model) {
      try {
        const rawPreds = await model.classify(img, 10);
        labels = groupPredictions(rawPreds, 0.03);
        summary = buildSummarySentence(labels);
      } catch (err) {
        console.warn('Classification failed:', err);
      }
    }

    const finalLabels = [{ label: summary, probability: labels[0]?.probability || 0 }, ...labels];
    document.getElementById('upload-labels').value = JSON.stringify(finalLabels);

    // ===== STEP 3: Build metadata with the detected date =====
    const pos = await getPosition();
    
    // Combine date data with GPS/compass
    const metadata = {
      ...dateData,
      compassHeading: currentHeading,
      ...pos
    };

    document.getElementById('upload-metadata').value = JSON.stringify(metadata);

    // ===== STEP 4: Show predictions + date source =====
    uploadPredictions.innerHTML = finalLabels.slice(1).map(l => `
      <div class="pred">
        <span class="pred-label">${l.label}</span>
        <span class="pred-bar"><span style="width:${(l.probability * 100).toFixed(0)}%"></span></span>
        <span class="pred-prob">${(l.probability * 100).toFixed(0)}%</span>
      </div>
    `).join('');

    // Show date info
    const dateLabel = dateSource === 'exif' ? '📅 From photo (EXIF)' : '📅 Current date (no EXIF data)';
    uploadStatus.innerHTML = `✅ ${summary}<br><small>${dateLabel}: ${dateData.capturedDate} at ${dateData.capturedTime}</small>`;

    uploadSubmit.disabled = false;
  };
  img.src = URL.createObjectURL(file);
});

  const img = new Image();
  img.onload = async () => {
    let labels = [];
    let summary = "Unknown";

    if (model) {
      try {
        const rawPreds = await model.classify(img, 10);
        labels = groupPredictions(rawPreds, 0.03);
        summary = buildSummarySentence(labels);
      } catch {}
    }

    const finalLabels = [{ label: summary, probability: labels[0]?.probability || 0 }, ...labels];
    document.getElementById('upload-labels').value = JSON.stringify(finalLabels);

    // Show predictions
    uploadPredictions.innerHTML = finalLabels.slice(1).map(l => `
      <div class="pred">
        <span class="pred-label">${l.label}</span>
        <span class="pred-bar"><span style="width:${(l.probability * 100).toFixed(0)}%"></span></span>
        <span class="pred-prob">${(l.probability * 100).toFixed(0)}%</span>
      </div>
    `).join('');

    const pos = await getPosition();
    const metadata = {
      capturedAt: new Date().toISOString(),
      compassHeading: currentHeading,
      ...pos
    };
    document.getElementById('upload-metadata').value = JSON.stringify(metadata);

    uploadSubmit.disabled = false;
    uploadStatus.textContent = '✅ ' + summary;
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById('upload-form')?.addEventListener('submit', (e) => {
  if (!document.getElementById('upload-metadata').value) {
    document.getElementById('upload-metadata').value = JSON.stringify({
      capturedAt: new Date().toISOString()
    });
  }
  if (!document.getElementById('upload-labels').value) {
    document.getElementById('upload-labels').value = '[]';
  }
});