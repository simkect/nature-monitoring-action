window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

function toggleMenu() {
  const btn = document.getElementById("menuBtn");
  const panel = document.getElementById("navPanel");

  btn.classList.toggle("active");
  panel.classList.toggle("active");
}

document.addEventListener("click", function (event) {
  const panel = document.getElementById("navPanel");
  const btn = document.getElementById("menuBtn");

  if (
    panel &&
    btn &&
    !panel.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    panel.classList.remove("active");
    btn.classList.remove("active");
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