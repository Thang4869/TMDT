import { CONFIG } from './config.js';

export async function apiRequest(endpoint, body) {
  const url = `${CONFIG.BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Phản hồi từ server không hợp lệ');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra');
  }
  return data;
}