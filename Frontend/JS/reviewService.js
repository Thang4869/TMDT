import { CONFIG } from './config.js';
import { apiRequest } from './apiClient.js';

export async function loadReviews(MaSP, containerId = 'reviewList') {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const reviews = await apiRequest(CONFIG.ENDPOINTS.REVIEWS(MaSP));
    if (!Array.isArray(reviews) || reviews.length === 0) {
      container.innerHTML = '<p>Chưa có đánh giá nào.</p>';
      return;
    }

    container.innerHTML = reviews.map(review => `
      <div class="review">
        <p><strong>⭐ ${review.DanhGia}/5</strong></p>
        <p>${review.NoiDung}</p>
        <p><em>Ngày đánh giá: ${new Date(review.ThoiGian).toLocaleDateString()}</em></p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Lỗi khi tải đánh giá:', error);
    container.innerHTML = '<p>Không thể tải đánh giá.</p>';
  }
}

export async function loadAverageRating(MaSP, containerId = 'averageRating') {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const data = await apiRequest(CONFIG.ENDPOINTS.AVERAGE_RATING(MaSP));
    container.innerHTML = `
      <p><strong>⭐ ${Number(data.TrungBinhSao).toFixed(1)}/5</strong> (${data.SoDanhGia} đánh giá)</p>
    `;
  } catch (error) {
    console.error('Lỗi khi tải điểm trung bình:', error);
    container.innerHTML = '<p>Không thể lấy dữ liệu đánh giá.</p>';
  }
}