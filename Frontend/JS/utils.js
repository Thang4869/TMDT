export function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

export function showMessage(message) {
  const msgEl = document.getElementById('message');
  if (msgEl) msgEl.innerText = message;
}

export function saveSession(data) {
  sessionStorage.setItem('MaND', data.MaND);
  sessionStorage.setItem('HoTen', data.HoTen);
}

export function redirectTo(url) {
  window.location.href = url;
}

export function validateRegisterInput(name, phone, email, password) {
  if (!name || !phone || !email || !password) return 'Vui lòng điền đầy đủ thông tin';
  if (!/^\d{10,11}$/.test(phone)) return 'Số điện thoại không hợp lệ';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
  if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return null;
}

export function validateLoginInput(email, password) {
  if (!email || !password) return 'Vui lòng điền email và mật khẩu';
  return null;
}