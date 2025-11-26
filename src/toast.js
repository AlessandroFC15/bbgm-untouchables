/**
 * Toast notification system for BBGM Untradables extension
 */

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '9999';
  toast.style.minWidth = '300px';
  toast.style.animation = 'fadeInOut 3s ease-in-out forwards';

  // Add animation to page if not already present
  if (!document.getElementById('bbgm-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'bbgm-toast-styles';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Remove from DOM after animation completes
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
