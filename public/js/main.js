// Force reload if the page is restored from cache (Back/Forward)
window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

// Detect when a tab is restored after browser restart
// and force a session check
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    // Check if our session is still valid by pinging the server
    fetch('/auth/check', { method: 'GET', credentials: 'same-origin' })
      .then(res => {
        if (res.status === 401) {
          // Session is gone — force redirect to login
          window.location.href = '/login';
        }
      })
      .catch(() => {
        // If fetch fails (offline), don't do anything
      });
  }
});

// Toggle the mobile navigation menu
function toggleMenu() {
  const btn = document.getElementById('menuBtn');
  const panel = document.getElementById('navPanel');
  if (btn && panel) {
    btn.classList.toggle('active');
    panel.classList.toggle('active');
  }
}

// Close menu when clicking outside of it
document.addEventListener('click', function(event) {
  const panel = document.getElementById('navPanel');
  const btn = document.getElementById('menuBtn');
  if (panel && btn && !panel.contains(event.target) && !btn.contains(event.target)) {
    panel.classList.remove('active');
    btn.classList.remove('active');
  }
});

async function logout() {
  try {
    // Send the logout request
    const response = await fetch('/logout', { method: 'POST' });
    if (response.ok) {
      // Redirect to login WITHOUT adding to history
      window.location.replace('/login');
    }
  } catch (err) {
    console.error('Logout failed', err);
  }
}