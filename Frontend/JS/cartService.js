export function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function addToCart(MaSP, TenSP, Gia) {
  const cart = getCart();
  const existingItem = cart.find(item => item.MaSP === MaSP);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ MaSP, TenSP, Gia, quantity: 1 });
  }
  saveCart(cart);
  updateCartCount();
  alert(`${TenSP} đã được thêm vào giỏ hàng!`);
}

export function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) {
    cartCountEl.textContent = totalItems;
  }
}

// Khởi tạo số lượng hiển thị khi trang load
export function initCartCount() {
  updateCartCount();
}