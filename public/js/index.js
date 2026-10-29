function setDate(daysAgo) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - daysAgo);
  
  document.getElementById('dateFrom').value = from.toISOString().split('T')[0];
  document.getElementById('dateTo').value = today.toISOString().split('T')[0];
}