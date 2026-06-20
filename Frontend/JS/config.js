export const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINTS: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PRODUCT_DETAIL: (id) => `/api/sanpham/${id}`,
    REVIEWS: (id) => `/api/danhgia/${id}`,
    AVERAGE_RATING: (id) => `/api/danhgia/trungbinh/${id}`
  },
  REDIRECT: {
    REGISTER_SUCCESS: 'DangNhap.html',
    LOGIN_SUCCESS: 'TrangChu.html'
  },
  DEFAULT_IMAGE: '/Frontend/IMAGE/default.jpg'
};