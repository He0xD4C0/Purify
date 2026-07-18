// 404 Not Found page

import { router } from '../core/router.js';

export function render404(container: HTMLElement): void {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;">
      <div style="font-size:72px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">404</div>
      <p style="color:var(--text-secondary);font-size:16px;margin-bottom:24px;">页面不存在</p>
      <button id="btn-404-home" style="padding:10px 28px;background:var(--accent);color:white;border:none;border-radius:var(--radius-pill);font-size:14px;cursor:pointer;">返回首页</button>
    </div>
  `;
  container.querySelector('#btn-404-home')?.addEventListener('click', () => router.navigate('home'));
}
