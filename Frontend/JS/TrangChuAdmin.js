document.addEventListener("DOMContentLoaded", function () {
    // Chức năng logout
    const logoutButton = document.querySelector(".user-menu button");
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        window.location.href = "/Frontend/HTML/DangNhap.html";
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const barCtx = document.getElementById("barChart").getContext("2d");
    const pieCtx = document.getElementById("pieChart").getContext("2d");
    const lineCtx = document.getElementById("lineChart").getContext("2d");
    const revenueTableBody = document.getElementById("revenueTableBody");
    const modal = document.getElementById("orderDetailsModal");
    const closeBtn = document.querySelector(".close");
    const orderDetailsBody = document.getElementById("orderDetailsTable").getElementsByTagName("tbody")[0];

    // Biến để lưu các instance của biểu đồ
    let barChartInstance = null;
    let pieChartInstance = null;
    let lineChartInstance = null;

    async function fetchRevenueDataByDay(startDate = null, endDate = null) {
        try {
            let url = "http://localhost:3000/api/thongke/doanhthu/ngay"; // Sử dụng API mới
            if (startDate && endDate) {
                url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [data];
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu doanh thu theo ngày:", error);
            return [];
        }
    }

    async function fetchRevenueDataByMonth(startDate = null, endDate = null) {
        try {
            let url = "http://localhost:3000/api/thongke/doanhthu";
            if (startDate && endDate) {
                url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [data];
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu doanh thu theo tháng:", error);
            return [];
        }
    }

    function createCharts(dayLabels, dayValues, monthLabels, monthValues) {
        if (barChartInstance) barChartInstance.destroy();
        if (pieChartInstance) pieChartInstance.destroy();
        if (lineChartInstance) lineChartInstance.destroy();

        // Biểu đồ cột (theo ngày)
        barChartInstance = new Chart(barCtx, {
            type: "bar",
            data: {
                labels: dayLabels,
                datasets: [{
                    label: "Doanh thu (VND)",
                    data: dayValues,
                    backgroundColor: "#3498db"
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 16 } }, title: { display: true, text: 'Doanh thu (VND)', font: { size: 18 } } },
                    x: { ticks: { font: { size: 16 } }, title: { display: true, text: 'Ngày', font: { size: 18 } } }
                },
                plugins: {
                    legend: { labels: { font: { size: 16 } } },
                    title: { display: true, text: 'Doanh thu theo ngày', font: { size: 20 } }
                }
            }
        });

        // Biểu đồ đường (theo ngày)
        lineChartInstance = new Chart(lineCtx, {
            type: "line",
            data: {
                labels: dayLabels,
                datasets: [{
                    label: "Doanh thu theo ngày (VND)",
                    data: dayValues,
                    borderColor: "#ff6384",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 16 } }, title: { display: true, text: 'Doanh thu (VND)', font: { size: 18 } } },
                    x: { ticks: { font: { size: 16 } }, title: { display: true, text: 'Ngày', font: { size: 18 } } }
                },
                plugins: {
                    legend: { labels: { font: { size: 16 } } },
                    title: { display: true, text: 'Xu hướng doanh thu theo ngày', font: { size: 20 } }
                }
            }
        });

        // Biểu đồ tròn (theo tháng)
        pieChartInstance = new Chart(pieCtx, {
            type: "pie",
            data: {
                labels: monthLabels,
                datasets: [{
                    label: "Doanh thu",
                    data: monthValues,
                    backgroundColor: ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"]
                }]
            },
            options: {
                plugins: {
                    legend: { labels: { font: { size: 16 } } },
                    title: { display: true, text: 'Phân bổ doanh thu theo tháng', font: { size: 20 } },
                    tooltip: { bodyFont: { size: 16 }, titleFont: { size: 18 } }
                }
            }
        });
    }

    function renderRevenueTable(data) {
        revenueTableBody.innerHTML = "";
        data.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.Thang}</td>
                <td>${item.TongDoanhThu.toLocaleString()} VND</td>
                <td>${item.TongSoHang}</td>
                <td><button class="action-btn">Xem chi tiết</button></td>
            `;
            const btn = row.querySelector(".action-btn");
            btn.addEventListener("click", () => showOrderDetailsModal(item.Thang));
            revenueTableBody.appendChild(row);
        });
    }

    async function showOrderDetailsModal(thang) {
        try {
            const response = await fetch(`http://localhost:3000/api/thongke/chitietdoanhthu?ngay=${encodeURIComponent(thang)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const details = await response.json();
            orderDetailsBody.innerHTML = details.map((d, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${d.TenSP || 'N/A'}</td>
                    <td>${(d.Gia * d.SoLuong || 0).toLocaleString()} VND</td>
                    <td>${d.SoLuong || 0}</td>
                </tr>
            `).join("");
            modal.style.display = "block";
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết doanh thu:", error);
            alert("Không thể tải chi tiết doanh thu. Vui lòng thử lại!");
        }
    }

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    window.fetchRevenueData = async () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        if (startDate && endDate) {
            const dayData = await fetchRevenueDataByDay(startDate, endDate);
            const monthData = await fetchRevenueDataByMonth(startDate, endDate);
            const dayLabels = dayData.map(item => new Date(item.Ngay).toLocaleDateString());
            const dayValues = dayData.map(item => item.TongDoanhThu || 0);
            const monthLabels = monthData.map(item => item.Thang);
            const monthValues = monthData.map(item => item.TongDoanhThu || 0);
            createCharts(dayLabels, dayValues, monthLabels, monthValues);
            renderRevenueTable(monthData);
        } else {
            alert("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc!");
        }
    };

    // Khởi tạo dữ liệu khi trang chạy
    Promise.all([fetchRevenueDataByDay(), fetchRevenueDataByMonth()]).then(([dayData, monthData]) => {
        const dayLabels = dayData.map(item => new Date(item.Ngay).toLocaleDateString());
        const dayValues = dayData.map(item => item.TongDoanhThu || 0);
        const monthLabels = monthData.map(item => item.Thang);
        const monthValues = monthData.map(item => item.TongDoanhThu || 0);
        createCharts(dayLabels, dayValues, monthLabels, monthValues);
        renderRevenueTable(monthData);
    });
});