const photos = JSON.parse(document.getElementById('photos-data').textContent);
const source = new ol.source.Vector();

const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({ source: new ol.source.OSM() }),
    new ol.layer.Vector({
      source,
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({ color: 'rgba(197,33,40,0.9)' }),
          stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
        })
      })
    })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([19.26, 42.44]), // Montenegro
    zoom: 7
  })
});

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
  source.addFeature(feature);
});

if (source.getFeatures().length) {
  map.getView().fit(source.getExtent(), {
    padding: [60, 60, 60, 60],
    maxZoom: 15
  });
}