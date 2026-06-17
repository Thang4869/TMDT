document.addEventListener("DOMContentLoaded", async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const MaSP = urlParams.get("MaSP");

    if (!MaSP) {
        document.getElementById("productDetail").innerHTML = "<p>Không tìm thấy sản phẩm.</p>";
        return;
    }

    try {
        // Lấy chi tiết sản phẩm
        const response = await fetch(`http://localhost:3000/api/sanpham/${MaSP}`);
        if (!response.ok) throw new Error("Không tìm thấy sản phẩm");
        const product = await response.json();

        document.getElementById("productDetail").innerHTML = `
            <h2>${product.TenSP}</h2>
            <img src="${product.Hinh}" 
                 onerror="this.onerror=null; this.src='/Frontend/IMAGE/default.jpg';" 
                 alt="${product.TenSP}" 
                 width="300">
            <p><strong>Giá:</strong> ${product.Gia.toLocaleString()} VND</p>
            <p><strong>Mô tả:</strong> ${product.MoTa}</p>
            <button onclick="addToCart('${product.MaSP}', '${product.TenSP}', ${product.Gia}')">
                🛒 Thêm vào giỏ hàng
            </button>
        `;

        // Lấy và hiển thị đánh giá
        await loadReviews(MaSP);
        await loadAverageRating(MaSP);

    } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        document.getElementById("productDetail").innerHTML = "<p>Lỗi khi tải sản phẩm.</p>";
    }
});

// Hàm gọi API và hiển thị đánh giá
async function loadReviews(MaSP) {
    try {
        const response = await fetch(`http://localhost:3000/api/danhgia/${MaSP}`);
        const reviews = await response.json();
        const reviewList = document.getElementById("reviewList");

        if (reviews.length === 0) {
            reviewList.innerHTML = "<p>Chưa có đánh giá nào.</p>";
            return;
        }

        reviewList.innerHTML = reviews.map(review => `
            <div class="review">
                <p><strong>⭐ ${review.DanhGia}/5</strong></p>
                <p>${review.NoiDung}</p>
                <p><em>Ngày đánh giá: ${new Date(review.ThoiGian).toLocaleDateString()}</em></p>
            </div>
        `).join('');
    } catch (error) {
        console.error("Lỗi khi tải đánh giá:", error);
        document.getElementById("reviewList").innerHTML = "<p>Lỗi khi tải đánh giá.</p>";
    }
}

// Hàm lấy và hiển thị điểm đánh giá trung bình
async function loadAverageRating(MaSP) {
    try {
        const response = await fetch(`http://localhost:3000/api/danhgia/trungbinh/${MaSP}`);
        const data = await response.json();

        document.getElementById("averageRating").innerHTML = `
            <p><strong>⭐ ${data.TrungBinhSao.toFixed(1)}/5</strong> (${data.SoDanhGia} đánh giá)</p>
        `;
    } catch (error) {
        console.error("Lỗi khi tải điểm trung bình:", error);
        document.getElementById("averageRating").innerHTML = "<p>Không thể lấy dữ liệu đánh giá.</p>";
    }
}

// Hàm thêm vào giỏ hàng (giữ nguyên từ code cũ)
function addToCart(MaSP, TenSP, Gia) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => item.MaSP === MaSP);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ MaSP, TenSP, Gia, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert(`${TenSP} đã được thêm vào giỏ hàng!`);
}

// Hàm cập nhật số lượng giỏ hàng trên giao diện
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").textContent = totalItems;
}

// Cập nhật số lượng giỏ hàng khi tải trang
updateCartCount();