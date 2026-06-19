import { CONFIG } from './config.js';
import { getInputValue, showMessage, saveSession, redirectTo, validateRegisterInput, validateLoginInput } from './utils.js';
import { apiRequest } from './apiClient.js';

export async function register() {
  const name = getInputValue('name');
  const phone = getInputValue('phone');
  const email = getInputValue('email');
  const password = getInputValue('password');

  const error = validateRegisterInput(name, phone, email, password);
  if (error) {
    showMessage(error);
    return;
  }

  try {
    const data = await apiRequest(CONFIG.ENDPOINTS.REGISTER, {
      HovaTen: name,
      SDT: phone,
      Email: email,
      MatKhau: password
    });
    showMessage(data.message || 'Đăng ký thành công');
    alert('Đăng ký thành công!');
    redirectTo(CONFIG.REDIRECT.REGISTER_SUCCESS);
  } catch (err) {
    showMessage(err.message);
  }
}

export async function login() {
  const email = getInputValue('email');
  const password = getInputValue('password');

  const error = validateLoginInput(email, password);
  if (error) {
    showMessage(error);
    return;
  }

  try {
    const data = await apiRequest(CONFIG.ENDPOINTS.LOGIN, {
      Email: email,
      MatKhau: password
    });
    showMessage(data.message || 'Đăng nhập thành công');
    saveSession(data);
    alert('Đăng nhập thành công!');
    redirectTo(CONFIG.REDIRECT.LOGIN_SUCCESS);
  } catch (err) {
    showMessage(err.message);
  }
}

// Tự động gán sự kiện cho các form (ví dụ)
function init() {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await register();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await login();
    });
  }
}

// Chạy init khi DOM đã sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}