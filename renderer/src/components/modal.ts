// Simple modal overlay

export function showModal(title: string, content: string | HTMLElement): void {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  overlay.innerHTML = '';
  overlay.classList.remove('hidden');

  const box = document.createElement('div');
  box.className = 'modal-box';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

  const titleEl = document.createElement('h2');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;

  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }

  box.appendChild(closeBtn);
  box.appendChild(titleEl);
  box.appendChild(body);
  overlay.appendChild(box);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
}

export function hideModal(): void {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}
