function setDate(daysAgo) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - daysAgo);
  
  document.getElementById('dateFrom').value = from.toISOString().split('T')[0];
  document.getElementById('dateTo').value = today.toISOString().split('T')[0];
}

// Toggle the filter panel
function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  const btn = document.getElementById('filterToggle');
  panel.classList.toggle('open');
  btn.classList.toggle('open');
}

// Set date range from quick buttons
function setDate(daysAgo) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - daysAgo);
  
  document.getElementById('dateFrom').value = from.toISOString().split('T')[0];
  document.getElementById('dateTo').value = today.toISOString().split('T')[0];
}

// Auto-open the filter panel if any filter is active
document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('filterPanel');
  const btn = document.getElementById('filterToggle');
  
  // If the URL has filter params, show the panel
  const hasFilters = window.location.search.length > 1;
  if (hasFilters && panel && btn) {
    panel.classList.add('open');
    btn.classList.add('open');
  }
});