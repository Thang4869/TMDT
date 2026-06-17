document.addEventListener("DOMContentLoaded", async () => {
    const orderTableBody = document.getElementById("order-table-body");
    async function fetchOrders() {
        try {
            const response = await fetch("http://localhost:3000/api/orders");
            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Status: ${response.status}`);
            }
            const orders = await response.json();
            console.log("Dữ liệu đơn hàng:", orders);
            orderTableBody.innerHTML = "";
            orders.forEach(order => {
                const isCancelled = order.TrangThai === "Đã hủy";
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${order.MaDonHang}</td>
                    <td>${order.MaND}</td>
                    <td>${order.TongTien.toLocaleString()} VND</td>
                    <td>${order.NgayDat}</td>
                    <td>
                        <select class="order-status" data-id="${order.MaDonHang}" ${isCancelled ? "disabled" : ""}>
                            <option  value="Chưa giao" ${order.TrangThai === "Chưa giao" ? "selected" : "" }>Chưa giao</option>
                            <option  value="Đã giao" ${order.TrangThai === "Đã giao" ? "selected" : ""}>Đã giao</option>
                        </select>
                    </td>
                    <td>
                        ${isCancelled 
                            ? "<span style='color: red; font-weight: bold;'>Đã hủy</span>"
                            : `<button  class="update-btn" data-id="${order.MaDonHang}">Cập nhật</button>`
                        }
                    </td>
                `;
                orderTableBody.appendChild(row);
            });
            attachUpdateEvents();
        } catch (error) {
            console.error("Lỗi khi tải đơn hàng:", error);
        }
    }
    /*
    //
    //
    //
    */
    // Gán sự kiện cập nhật trạng thái
    function attachUpdateEvents() {
        document.querySelectorAll(".update-btn").forEach(button => {
            button.addEventListener("click", async () => {
                const orderId = button.getAttribute("data-id");
                const statusSelect = document.querySelector(`.order-status[data-id='${orderId}']`);
                const newStatus = statusSelect.value;
                try {
                    const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ TrangThai: newStatus })
                    });
                    if (!response.ok) {
                        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
                    }
                    alert("Cập nhật thành công!");
                    fetchOrders();
                } catch (error) {
                    console.error("Lỗi khi cập nhật trạng thái", error);
                    alert("Cập nhật thất bại!");
                }
            });
        });
    }
    fetchOrders();
});
/*
//
//
//
*/
