document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("order-details-table");

    async function fetchOrderDetails() {
        try {
            const response = await fetch("http://localhost:3000/api/order-details");
            if (!response.ok) {
                throw new Error("Lỗi khi lấy danh sách chi tiết đơn hàng!");
            }

            let data = await response.json();
            data.sort((a, b) => {
                return parseInt(a.MaCTDH.replace("CTDH", "")) - parseInt(b.MaCTDH.replace("CTDH", ""));
            });

            tableBody.innerHTML = "";
            data.forEach(detail => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${detail.MaCTDH}</td>
                    <td>${detail.MaDonHang}</td>
                    <td>${detail.MaSP}</td>
                    <td>${detail.SoLuong}</td>
                `;
                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error("❌ Lỗi khi tải danh sách chi tiết đơn hàng:", error);
        }
    }

    fetchOrderDetails();
});
