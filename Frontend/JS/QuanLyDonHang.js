// QuanLyDonHang.js
document.addEventListener("DOMContentLoaded", () => {
    const orderTableBody = document.getElementById("order-table-body");
    const userId = sessionStorage.getItem("MaND");
    const reviewModal = document.getElementById("reviewModal");
    const reviewForm = document.getElementById("reviewForm");

    // Hàm hiển thị danh sách đơn hàng (toàn cục)
    function renderOrders(orders) {
        orderTableBody.innerHTML = "";
        if (!Array.isArray(orders) || orders.length === 0) {
            orderTableBody.innerHTML = "<tr><td colspan='6'>Không có đơn hàng nào!</td></tr>";
            return;
        }

        orders.forEach(order => {
            const row = document.createElement("tr");
            const guestInfo = order.guestInfo || {}; // Hỗ trợ cả khách vãng lai
            row.innerHTML = `
                <td>${order.MaDonHang}</td>
                <td>${order.TongTien?.toLocaleString() || 'N/A'} VND</td>
                <td>${order.NgayDat || 'N/A'}</td>
                <td>${order.TrangThai || 'N/A'}</td>
                <td>
                    <button class="cancel-btn" data-id="${order.MaDonHang}" ${order.TrangThai !== "Chưa giao" ? "disabled" : ""}>
                        Hủy đơn
                    </button>
                </td>
                <td>
                    <button class="review-btn" data-id="${order.MaDonHang}" ${order.TrangThai !== "Đã giao" ? "disabled" : ""}>
                        Đánh giá
                    </button>
                </td>
            `;
            orderTableBody.appendChild(row);
        });
        attachCancelEvents();
        attachReviewEvents();
    }

    // Lấy danh sách đơn hàng của người dùng đăng nhập
    async function fetchUserOrders() {
        try {
            const response = await fetch(`http://localhost:3000/api/user/orders/${userId}`);
            if (!response.ok) throw new Error(`Lỗi HTTP! Status: ${response.status}`);
            const orders = await response.json();
            renderOrders(orders);
        } catch (error) {
            console.error("Lỗi khi tải đơn hàng của người dùng:", error);
            orderTableBody.innerHTML = "<tr><td colspan='6'>Lỗi khi tải đơn hàng!</td></tr>";
        }
    }

    // Tra cứu đơn hàng khách vãng lai
    async function fetchGuestOrder() {
        const maDonHang = document.getElementById("guestOrderId").value.trim();
        if (!maDonHang) {
            alert("Vui lòng nhập mã đơn hàng!");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/guest/orders/${maDonHang}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Lỗi HTTP! Status: ${response.status} - ${errorText}`);
            }
            const order = await response.json();
            renderOrders([order]); // Chuyển thành mảng để tương thích với renderOrders
        } catch (error) {
            console.error("Lỗi khi tra cứu đơn hàng khách vãng lai:", error);
            alert("Không tìm thấy đơn hàng hoặc đã hết hạn! Chi tiết: " + error.message);
            renderOrders([]); // Xóa bảng nếu lỗi
        }
    }

    // Gắn sự kiện hủy đơn
    function attachCancelEvents() {
        document.querySelectorAll(".cancel-btn").forEach(button => {
            button.addEventListener("click", async () => {
                const orderId = button.getAttribute("data-id");
                if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/user/orders/${orderId}/cancel`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" }
                        });
                        if (!response.ok) throw new Error(`Lỗi HTTP! Status: ${response.status}`);
                        alert("Đơn hàng đã được hủy!");
                        userId ? fetchUserOrders() : fetchGuestOrder();
                    } catch (error) {
                        console.error("Lỗi khi hủy đơn hàng:", error);
                        alert("Lỗi khi hủy đơn hàng: " + error.message);
                    }
                }
            });
        });
    }

    // Gắn sự kiện đánh giá
    function attachReviewEvents() {
        document.querySelectorAll(".review-btn").forEach(button => {
            button.addEventListener("click", async () => {
                const orderId = button.getAttribute("data-id");
                try {
                    const response = await fetch(`http://localhost:3000/api/order-details?MaDonHang=${orderId}`);
                    if (!response.ok) throw new Error(`Lỗi HTTP! Status: ${response.status}`);
                    const items = await response.json();
                    if (items.length === 0) {
                        alert("Không có sản phẩm nào trong đơn hàng này để đánh giá!");
                        return;
                    }
                    document.getElementById("reviewOrderId").textContent = orderId;
                    const reviewItems = document.getElementById("reviewItems");
                    reviewItems.innerHTML = `
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Nội dung đánh giá chung:</label>
                            <textarea id="reviewContent" placeholder="Nhập nội dung đánh giá chung cho tất cả sản phẩm" style="width: 100%; height: 100px; padding: 5px;"></textarea>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px;">Đánh giá số sao cho từng sản phẩm:</label>
                            ${items.map(item => `
                                <div style="margin: 10px 0;">
                                    <p>${item.TenSP}</p>
                                    <input type="number" min="1" max="5" placeholder="Số sao (1-5)" data-masp="${item.MaSP}" style="width: 100%; padding: 5px;">
                                </div>
                            `).join('')}
                        </div>
                    `;
                    reviewModal.style.display = "block";
                } catch (error) {
                    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
                    alert("Lỗi khi tải thông tin đánh giá: " + error.message);
                }
            });
        });
    }

    // Xử lý gửi đánh giá
    reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const MaDonHang = document.getElementById("reviewOrderId").textContent;
        const Email = userId ? "" : prompt("Nhập email của bạn để xác nhận:");
        if (!userId && !Email) {
            alert("Vui lòng nhập email!");
            return;
        }

        const NoiDung = document.getElementById("reviewContent").value.trim();
        if (!NoiDung) {
            alert("Vui lòng nhập nội dung đánh giá!");
            return;
        }

        const inputs = document.querySelectorAll("#reviewItems input[type='number']");
        const danhGiaList = [];
        inputs.forEach(input => {
            const maSP = input.getAttribute("data-masp");
            const danhGia = parseInt(input.value);
            if (input.value && danhGia >= 1 && danhGia <= 5) {
                danhGiaList.push({ MaSP: maSP, DanhGia: danhGia });
            }
        });

        if (danhGiaList.length === 0) {
            alert("Vui lòng nhập số sao cho ít nhất một sản phẩm!");
            return;
        }

        try {
            const url = userId ? `http://localhost:3000/api/orders/review` : `http://localhost:3000/api/guest/danhgia`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ MaDonHang, Email, NoiDung, danhGiaList })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Đánh giá thành công!");
                reviewModal.style.display = "none";
                userId ? fetchUserOrders() : fetchGuestOrder();
            } else {
                alert("Lỗi: " + data.message);
            }
        } catch (error) {
            console.error("Lỗi khi gửi đánh giá:", error);
            alert("Lỗi khi gửi đánh giá: " + error.message);
        }
    });

    // Khởi tạo
    if (userId) {
        fetchUserOrders();
    }

    // Gắn sự kiện tra cứu khách vãng lai
    document.querySelector("button[onclick='fetchGuestOrder()']").addEventListener("click", fetchGuestOrder);
});