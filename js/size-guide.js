function openSizeGuide() {
  const modal = document.getElementById('sizeGuideModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  const closeBtn = modal.querySelector('button[aria-label="Close size guide"]') || modal.querySelector('button');
  if (closeBtn) closeBtn.focus();
  document.body.style.overflow = 'hidden';
}

function closeSizeGuide() {
  const modal = document.getElementById('sizeGuideModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  const trigger = document.querySelector('[aria-label="Open size guide"]');
  if (trigger) trigger.focus();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('sizeGuideModal')?.classList.contains('hidden')) {
    closeSizeGuide();
  }
});

window.openSizeGuide = openSizeGuide;
window.closeSizeGuide = closeSizeGuide;


