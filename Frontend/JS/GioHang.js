document.addEventListener("DOMContentLoaded", function () {
    let gioHang = JSON.parse(localStorage.getItem("gioHang")) || [];
    let danhSachGioHang = document.getElementById("danhSachGioHang");
    let tongTienElement = document.getElementById("tongTien");
    let tongTamTinhElement = document.getElementById("tongTamTinh");
    let cartCountElement = document.getElementById("cart-count");

    cartCountElement.textContent = gioHang.length;

    function hienThiGioHang() {
        danhSachGioHang.innerHTML = "";
        let tongTamTinh = 0;

        gioHang.forEach((sp, index) => {
            let thanhTien = sp.gia * sp.soLuong;
            let row = document.createElement("tr");
            row.innerHTML = `
                <td><input type="checkbox" class="chon-san-pham" name="chonSanPham" data-index="${index}"></td>
                <td>${sp.ten}</td>
                <td>${sp.gia.toLocaleString()} VND</td>
                <td>
                    <button class="giam" data-index="${index}">-</button>
                    ${sp.soLuong}
                    <button class="tang" data-index="${index}">+</button>
                </td>
                <td>${thanhTien.toLocaleString()} VND</td>
                <td><button class="xoa" data-index="${index}">Xóa</button></td>
            `;
            danhSachGioHang.appendChild(row);
            tongTamTinh += thanhTien;
        });

        tongTamTinhElement.textContent = tongTamTinh.toLocaleString();
        tongTienElement.textContent = tongTamTinh.toLocaleString();
    }

    hienThiGioHang();

    document.getElementById("chonTatCa").addEventListener("change", function () {
        let checkboxes = document.querySelectorAll(".chon-san-pham");
        checkboxes.forEach(chk => chk.checked = this.checked);
    });

    document.addEventListener("click", function (event) {
        let index = event.target.dataset.index;
        if (event.target.classList.contains("tang")) {
            gioHang[index].soLuong++;
        } else if (event.target.classList.contains("giam")) {
            if (gioHang[index].soLuong > 1) {
                gioHang[index].soLuong--;
            } else {
                gioHang.splice(index, 1);
            }
        } else if (event.target.classList.contains("xoa")) {
            gioHang.splice(index, 1);
        }

        localStorage.setItem("gioHang", JSON.stringify(gioHang));
        cartCountElement.textContent = gioHang.length;
        hienThiGioHang();
    });

    document.getElementById("muaHang").addEventListener("click", function () {
        const MaND = sessionStorage.getItem("MaND");
        if (MaND) {
            checkout(); // Người dùng đăng nhập
        } else {
            document.getElementById("checkoutModal").style.display = "block"; // Khách vãng lai
        }
    });

    document.getElementById("guestCheckoutForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const TenKhach = document.getElementById("guestName").value;
        const SDT = document.getElementById("guestPhone").value;
        const Email = document.getElementById("guestEmail").value;
        const DiaChi = document.getElementById("guestAddress").value;
        const cartItems = gioHang.map(sp => ({
            MaSP: sp.id,
            Gia: sp.gia,
            SoLuong: sp.soLuong
        }));

        try {
            const response = await fetch("http://localhost:3000/api/orders/checkout-guest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ TenKhach, SDT, DiaChi, Email, cartItems })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Đặt hàng thành công! Mã đơn hàng: ${data.MaDonHang}`);
                localStorage.removeItem("gioHang");
                window.location.reload();
            } else {
                alert("Lỗi: " + data.message);
            }
        } catch (error) {
            console.error("Lỗi khi thanh toán:", error);
            alert("Lỗi khi thanh toán! Vui lòng thử lại.");
        }
    });
});

async function checkout() {
    const gioHang = JSON.parse(localStorage.getItem("gioHang")) || [];
    const MaND = sessionStorage.getItem("MaND");
    const TongTien = gioHang.reduce((sum, sp) => sum + (sp.gia * sp.soLuong), 0);
    const cartItems = gioHang.map(sp => ({ MaSP: sp.id, SoLuong: sp.soLuong }));

    try {
        const response = await fetch("http://localhost:3000/api/orders/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ MaND, cartItems, TongTien })
        });
        const data = await response.json();
        if (response.ok) {
            alert("Đặt hàng thành công! Mã đơn hàng: " + data.MaDonHang);
            localStorage.removeItem("gioHang");
            window.location.reload();
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        alert("Lỗi khi thanh toán! Vui lòng thử lại.");
    }
}