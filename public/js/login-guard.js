document.addEventListener('DOMContentLoaded', () => {
  // 1. Wipe out the forward history stack
  // This replaces the current history state and pushes a dummy state on top of it.
  // It physically breaks the browser's "Forward" button.
  window.history.pushState(null, "", window.location.href);
  window.history.replaceState(null, "", window.location.href);

  // 2. Trap any further history navigation attempts (Back or Forward)
  window.addEventListener('popstate', function() {
    // Every time the user clicks back/forward, force them back to the login page
    window.history.pushState(null, "", window.location.href);
    window.location.reload(); 
  });
});