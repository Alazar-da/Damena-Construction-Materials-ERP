// Preload script running in isolated context
window.addEventListener('DOMContentLoaded', () => {
  // Mark running inside native Damena Desktop app
  document.documentElement.setAttribute('data-desktop-app', 'electron');
});
