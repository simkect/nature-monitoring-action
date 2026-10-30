const photos = JSON.parse(document.getElementById('photos-data').textContent);

// ===== TILE SOURCES =====
const SOURCES = {
  osm: new ol.source.OSM(),
  
  google: new ol.source.XYZ({
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attributions: '© Google Maps'
  }),
  
  dark: new ol.source.XYZ({
    // CartoDB Dark Matter — a free dark basemap
    url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attributions: '© OpenStreetMap © CARTO'
  }),
  
  esri: new ol.source.XYZ({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions: '© Esri'
  })
};

// ===== BUILD MAP =====
const vectorSource = new ol.source.Vector();

const baseLayer = new ol.layer.Tile({ source: SOURCES.osm });
const markerLayer = new ol.layer.Vector({
  source: vectorSource,
  style: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 8,
      fill: new ol.style.Fill({ color: 'rgba(197,33,40,0.9)' }),
      stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
    })
  })
});

const map = new ol.Map({
  target: 'map',
  layers: [baseLayer, markerLayer],
  view: new ol.View({
    center: ol.proj.fromLonLat([19.26, 42.44]), // Montenegro
    zoom: 7
  })
});

// ===== LAYER SWITCHER =====
function changeLayer(key, displayName) {
  if (!SOURCES[key]) return;
  
  // Update the tile source on the base layer
  baseLayer.setSource(SOURCES[key]);
  
  // Update button label
  document.getElementById('current-layer-name').textContent = displayName;
  
  // Close the menu
  document.getElementById('layerMenu').classList.remove('active');
}

function toggleLayerMenu() {
  document.getElementById('layerMenu').classList.toggle('active');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('layerMenu');
  const btn = document.getElementById('layerBtn');
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// ===== POPUP =====
const popupEl = document.createElement('div');
popupEl.className = 'ol-popup';
document.body.appendChild(popupEl);
const overlay = new ol.Overlay({
  element: popupEl,
  autoPan: true,
  positioning: 'bottom-center'
});
map.addOverlay(overlay);

map.on('singleclick', evt => {
  const feature = map.forEachFeatureAtPixel(evt.pixel, f => f);
  if (!feature) {
    overlay.setPosition(undefined);
    return;
  }
  const p = feature.getProperties();
  popupEl.innerHTML = `
    <img src="/photos/image/${p.filename}" style="max-width:180px;border-radius:4px" />
    <div style="font-size:12px;margin-top:4px">
      <strong>${p.caption}</strong>
      <div>📅 ${p.capturedAt ? new Date(p.capturedAt).toLocaleString() : '—'}</div>
      <div>🧭 ${p.compassHeading != null ? p.compassHeading.toFixed(1) + '°' : '—'}</div>
    </div>
  `;
  overlay.setPosition(evt.coordinate);
});

// ===== PLOT MARKERS =====
photos.forEach(photo => {
  if (photo.latitude == null || photo.longitude == null) return;
  const feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([photo.longitude, photo.latitude]))
  });
  feature.setProperties({
    filename: photo.filename,
    caption: photo.caption,
    capturedAt: photo.capturedAt,
    compassHeading: photo.compassHeading
  });
  vectorSource.addFeature(feature);
});

if (vectorSource.getFeatures().length) {
  map.getView().fit(vectorSource.getExtent(), {
    padding: [60, 60, 60, 60],
    maxZoom: 15
  });
}