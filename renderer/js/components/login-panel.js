// Login panel: phone + QR code login
import { api } from '../core/api.js';
import { saveCookie, checkLoginStatus } from '../core/app.js';
import { showModal } from './modal.js';
/** Strip Set-Cookie attributes (Max-Age, Expires, Path, etc.), keep only key=value pairs */
function sanitizeCookie(raw) {
    return raw
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.includes('=') && !/^(Max-Age|Expires|Path|Domain|Secure|HttpOnly|SameSite|Priority|__Host-|__Secure-)/i.test(s))
        .join('; ');
}
export function renderLoginPanel(container, onClose) {
    const panel = document.createElement('div');
    panel.className = 'login-panel';
    // Tabs
    const tabsEl = document.createElement('div');
    tabsEl.className = 'login-tabs';
    const tabPhone = document.createElement('button');
    tabPhone.className = 'login-tab active';
    tabPhone.textContent = '手机登录';
    const tabQr = document.createElement('button');
    tabQr.className = 'login-tab';
    tabQr.textContent = '扫码登录';
    tabsEl.appendChild(tabPhone);
    tabsEl.appendChild(tabQr);
    const contentEl = document.createElement('div');
    contentEl.className = 'login-content';
    // ---- Phone form ----
    function renderPhoneForm() {
        contentEl.innerHTML = `
      <div class="form-group">
        <label>手机号</label>
        <input type="tel" id="login-phone" placeholder="请输入手机号">
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="login-password" placeholder="请输入密码">
      </div>
      <button class="btn-primary" id="login-submit">登 录</button>
    `;
        const submitBtn = contentEl.querySelector('#login-submit');
        submitBtn.addEventListener('click', async () => {
            const phone = contentEl.querySelector('#login-phone').value;
            const password = contentEl.querySelector('#login-password').value;
            if (!phone || !password) {
                showModal('提示', '请输入手机号和密码');
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = '登录中...';
            try {
                const res = await api.loginCellphone(phone, password);
                if (res.body?.code === 200 || res.cookie) {
                    const rawCookie = Array.isArray(res.cookie) ? res.cookie.join('; ') : res.cookie || '';
                    saveCookie(sanitizeCookie(rawCookie));
                    await checkLoginStatus();
                    onClose?.();
                }
                else {
                    showModal('登录失败', res.body?.msg || res.body?.message || '未知错误');
                }
            }
            catch (err) {
                showModal('登录失败', err.body?.msg || err.message || '网络错误');
            }
            finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '登 录';
            }
        });
    }
    // ---- QR form ----
    async function renderQrForm() {
        contentEl.innerHTML = `
      <div class="qr-container">
        <div id="qr-canvas"></div>
        <p class="qr-tip">请使用网易云音乐 App 扫描二维码</p>
      </div>
    `;
        try {
            const keyRes = await api.loginQrKey();
            const unikey = keyRes.data?.unikey;
            if (!unikey)
                throw new Error('获取二维码失败');
            const qrRes = await api.loginQrCreate(unikey);
            const qrUrl = qrRes.data?.qrurl;
            if (qrUrl) {
                const qrCanvas = document.getElementById('qr-canvas');
                if (qrCanvas) {
                    // Use QR code image API — no external library needed
                    const img = document.createElement('img');
                    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
                    img.alt = 'QR Code';
                    img.style.cssText = 'width:200px;height:200px;border-radius:var(--radius);';
                    qrCanvas.appendChild(img);
                }
            }
            // Poll for scan
            let attempts = 0;
            const maxAttempts = 200; // ~10 minutes at 3s intervals
            const interval = setInterval(async () => {
                attempts++;
                try {
                    const checkRes = await api.loginQrCheck(unikey);
                    const code = checkRes.body?.code || checkRes.code;
                    if (code === 803) {
                        // Confirmed — login success
                        clearInterval(interval);
                        const rawCookie = Array.isArray(checkRes.cookie) ? checkRes.cookie.join('; ') : checkRes.cookie || '';
                        saveCookie(sanitizeCookie(rawCookie));
                        await checkLoginStatus();
                        onClose?.();
                    }
                    else if (code === 800) {
                        // Expired
                        clearInterval(interval);
                        showModal('提示', '二维码已过期，请刷新重试');
                        renderQrForm();
                    }
                    // 801=waiting for confirm, 802=scanned — keep polling
                }
                catch {
                    // keep polling
                }
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    showModal('提示', '登录超时，请重试');
                }
            }, 3000);
        }
        catch {
            showModal('提示', '获取二维码失败，请稍后重试');
        }
    }
    // Tab switching
    tabPhone.addEventListener('click', () => {
        tabPhone.classList.add('active');
        tabQr.classList.remove('active');
        renderPhoneForm();
    });
    tabQr.addEventListener('click', () => {
        tabQr.classList.add('active');
        tabPhone.classList.remove('active');
        renderQrForm();
    });
    // Initial
    renderPhoneForm();
    panel.appendChild(tabsEl);
    panel.appendChild(contentEl);
    // Close button
    if (onClose) {
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '取消';
        closeBtn.className = 'btn-primary';
        closeBtn.style.cssText = 'margin-top:12px;background:var(--bg-tertiary);';
        closeBtn.addEventListener('click', onClose);
        panel.appendChild(closeBtn);
    }
    container.appendChild(panel);
}
//# sourceMappingURL=login-panel.js.map