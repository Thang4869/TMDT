import { CONFIG } from './config.js';
import { apiRequest } from './apiClient.js';
import { createElement } from './utils.js';
import { addToCart, initCartCount } from './cartService.js';
import { loadReviews, loadAverageRating } from './reviewService.js';

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const MaSP = urlParams.get('MaSP');

  const productDetailEl = document.getElementById('productDetail');
  if (!productDetailEl) return;

  if (!MaSP) {
    productDetailEl.innerHTML = '<p>Không tìm thấy sản phẩm.</p>';
    return;
  }

  try {
    const product = await apiRequest(CONFIG.ENDPOINTS.PRODUCT_DETAIL(MaSP));
    renderProduct(product, productDetailEl);
    
    // Gắn sự kiện cho nút "Thêm vào giỏ hàng" (được tạo trong render)
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        addToCart(product.MaSP, product.TenSP, product.Gia);
      });
    }

    // Tải đánh giá và điểm trung bình
    await loadReviews(MaSP);
    await loadAverageRating(MaSP);
  } catch (error) {
    console.error('Lỗi khi tải chi tiết sản phẩm:', error);
    productDetailEl.innerHTML = '<p>Lỗi khi tải sản phẩm.</p>';
  }
}

function renderProduct(product, container) {
  // Xóa nội dung cũ
  container.innerHTML = '';

  // Tạo các phần tử an toàn
  const title = createElement('h2', {}, product.TenSP);
  
  const img = createElement('img', {
    src: product.Hinh,
    alt: product.TenSP,
    width: '300'
  });
  img.addEventListener('error', () => {
    img.src = CONFIG.DEFAULT_IMAGE;
  });

  const price = createElement('p', {}, `Giá: ${product.Gia.toLocaleString()} VND`);
  const description = createElement('p', {}, `Mô tả: ${product.MoTa}`);

  const button = createElement('button', { id: 'addToCartBtn' }, '🛒 Thêm vào giỏ hàng');

  container.appendChild(title);
  container.appendChild(img);
  container.appendChild(price);
  container.appendChild(description);
  container.appendChild(button);
}

// Khởi động khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initCartCount();
  init();
});