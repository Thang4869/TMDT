// Khai báo biến toàn cục
const slides = document.querySelectorAll('.slide');
const brandSlider = document.getElementById('brandSlider');
const searchBox = document.getElementById('searchBox');
let currentSlide = 0;
let brandIndex = 0;

// Dữ liệu giả (mock data) để hiển thị khi API không hoạt động
const mockProducts = [
    {
        MaSP: "SP001",
        TenSP: "Laptop Gaming ASUS",
        Gia: 25000000,
        Hinh: "/Frontend/IMAGE/laptop1.jpg"
    },
    {
        MaSP: "SP002",
        TenSP: "PC Văn Phòng Dell",
        Gia: 15000000,
        Hinh: "/Frontend/IMAGE/pc1.jpg"
    },
    {
        MaSP: "SP003",
        TenSP: "Màn Hình Samsung 27 inch",
        Gia: 5000000,
        Hinh: "/Frontend/IMAGE/monitor1.jpg"
    },
    {
        MaSP: "SP004",
        TenSP: "Bàn Phím Cơ Logitech",
        Gia: 2000000,
        Hinh: "/Frontend/IMAGE/keyboard1.jpg"
    }
];

// Hiển thị sản phẩm từ API hoặc mock data
async function fetchProducts(page = 1) {
    const productList = document.getElementById('productList');
    if (!productList) {
        console.error('Không tìm thấy element #productList trong DOM');
        return;
    }

    try {
        console.log('Bắt đầu gọi API với page:', page);
        const response = await fetch(`http://localhost:3000/api/sanpham?page=${page}`);
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
        const products = await response.json();
        console.log('Dữ liệu từ API:', products);

        if (!Array.isArray(products)) {
            console.error('Dữ liệu từ API không phải là mảng:', products);
            throw new Error('Dữ liệu không hợp lệ từ API');
        }

        // Nếu API trả về dữ liệu hợp lệ, sử dụng dữ liệu từ API
        renderProducts(products);
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        // Nếu API thất bại, sử dụng mock data
        console.warn('Sử dụng mock data để hiển thị danh sách sản phẩm');
        renderProducts(mockProducts);
        productList.dataset.source = 'mock'; // Đánh dấu là dùng mock data
    }
}

// Hàm render danh sách sản phẩm
function renderProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = products
        .map((product, index) => `
            <div class="product" style="animation-delay: ${index * 0.1}s;">
                <a href="/Frontend/HTML/ChiTietSanPham.html?MaSP=${product.MaSP}">
                    <img src="${product.Hinh || '/Frontend/IMAGE/default.jpg'}" alt="${product.TenSP}">
                    <h3>${product.TenSP || 'Tên không xác định'}</h3>
                    <p><strong>Giá:</strong> ${product.Gia ? product.Gia.toLocaleString() : '0'} VND</p>
                </a>
                <button onclick="addToCart('${product.MaSP}', '${product.TenSP || ''}', ${product.Gia || 0})">🛒 Thêm vào giỏ</button>
            </div>
        `)
        .join('');
}

// Giỏ hàng và thông báo
function initCartAndNotifications() {
    const gioHang = JSON.parse(localStorage.getItem('gioHang')) || [];
    document.getElementById('cart-count').textContent = gioHang.length;

    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const unreadCount = notifications.filter(n => !n.read).length;
    document.getElementById('notification-count').textContent = unreadCount;
    renderNotifications(notifications);
}

function addToCart(productId, productName, productPrice) {
    let gioHang = JSON.parse(localStorage.getItem('gioHang')) || [];
    const spDaCo = gioHang.find(sp => sp.id === productId);
    if (spDaCo) {
        spDaCo.soLuong++;
    } else {
        gioHang.push({ id: productId, ten: productName, gia: productPrice, soLuong: 1 });
    }
    localStorage.setItem('gioHang', JSON.stringify(gioHang));
    document.getElementById('cart-count').textContent = gioHang.length;

    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const newNotification = { message: `Đã thêm ${productName} vào giỏ hàng!`, read: false, timestamp: Date.now() };
    notifications.unshift(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));

    const unreadCount = notifications.filter(n => !n.read).length;
    document.getElementById('notification-count').textContent = unreadCount;
    renderNotifications(notifications);
    showNotification(newNotification.message);
}

// Hiển thị thông báo tạm thời
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 1500);
}

// Hiển thị danh sách thông báo trong dropdown
function renderNotifications(notifications) {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.innerHTML = `
        ${notifications.length === 0 
            ? '<p>Không có thông báo</p>' 
            : '<ul>' + notifications.map((n, index) => `
                <li class="${n.read ? '' : 'unread'}" data-index="${index}">${n.message}</li>
            `).join('') + '</ul>'}
        <hr>
        <div class="buttons">
            <button id="markAllRead">Đã đọc</button>
            <button id="deleteAll" class="delete">Xóa</button>
        </div>
    `;

    document.getElementById('markAllRead').addEventListener('click', () => {
        const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        document.getElementById('notification-count').textContent = 0;
        renderNotifications(updatedNotifications);
    });

    document.getElementById('deleteAll').addEventListener('click', () => {
        localStorage.setItem('notifications', JSON.stringify([]));
        document.getElementById('notification-count').textContent = 0;
        renderNotifications([]);
    });
}

// Tìm kiếm sản phẩm
function setupSearch() {
    searchBox.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        document.querySelectorAll('.product').forEach(product => {
            const productName = product.querySelector('h3').textContent.toLowerCase();
            product.style.display = productName.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

// Slider chính
function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
}

// Brand Slider
function updateBrandSlide() {
    const slides = document.querySelectorAll('.brand-slide');
    const slideWidth = slides[0].offsetWidth + 20;
    brandSlider.style.transform = `translateX(${-brandIndex * slideWidth}px)`;
}

function nextBrandSlide() {
    const slides = document.querySelectorAll('.brand-slide');
    if (brandIndex < slides.length - 5) {
        brandIndex++;
        updateBrandSlide();
    }
}

function prevBrandSlide() {
    if (brandIndex > 0) {
        brandIndex--;
        updateBrandSlide();
    }
}

// Lấy danh sách thương hiệu từ API
async function fetchBrands() {
    try {
        const response = await fetch('http://localhost:3000/api/thuonghieu');
        if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu thương hiệu');
        const brands = await response.json();
        return brands;
    } catch (error) {
        console.error('Lỗi khi gọi API thương hiệu:', error);
        return [];
    }
}

// Hiển thị danh sách thương hiệu trong form (với tiêu đề, biểu tượng, flex-wrap)
async function renderBrandForm() {
    const form = document.getElementById('brandForm');
    const brands = await fetchBrands();
    form.innerHTML = `
        <div class="form-title">Danh sách thương hiệu</div>
        ${brands.length === 0 
            ? '<p>Không có thương hiệu</p>' 
            : '<div class="form-content">' + brands.map(brand => `
                <div class="form-item">
                    <span class="icon">🏷️</span>
                    <span class="name">${brand.TenThuongHieu}</span>
                </div>
            `).join('') + '</div>'
        }
    `;
}

// Thiết lập sự kiện hover cho mục Thương hiệu trong nav
function setupBrandForm() {
    const brandItem = document.querySelector('.brand-item');
    const brandForm = document.getElementById('brandForm');
    let timeoutId;

    function showForm() {
        clearTimeout(timeoutId);
        renderBrandForm();
        brandForm.classList.add('show');
    }

    function hideForm() {
        timeoutId = setTimeout(() => {
            brandForm.classList.remove('show');
        }, 200);
    }

    brandItem.addEventListener('mouseenter', showForm);
    brandItem.addEventListener('mouseleave', hideForm);
    brandForm.addEventListener('mouseenter', showForm);
    brandForm.addEventListener('mouseleave', hideForm);
}

// Lấy danh sách loại sản phẩm từ API
async function fetchProductTypes() {
    try {
        const response = await fetch('http://localhost:3000/api/loaisanpham');
        if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu loại sản phẩm');
        const productTypes = await response.json();
        return productTypes;
    } catch (error) {
        console.error('Lỗi khi gọi API loại sản phẩm:', error);
        return [];
    }
}

// Hiển thị danh sách loại sản phẩm trong form (với tiêu đề, biểu tượng, flex-wrap)
async function renderProductTypeForm() {
    const form = document.getElementById('producttypeform');
    const productTypes = await fetchProductTypes();
    form.innerHTML = `
        <div class="form-title">Danh sách loại sản phẩm</div>
        ${productTypes.length === 0 
            ? '<p>Không có loại sản phẩm</p>' 
            : '<div class="form-content">' + productTypes.map(type => `
                <div class="form-item">
                    <span class="icon">📦</span>
                    <span class="name">${type.TenLoai}</span>
                </div>
            `).join('') + '</div>'
        }
    `;
}

// Thiết lập sự kiện hover cho mục Phân loại sản phẩm trong nav
function setupProductTypeForm() {
    const productTypeItem = document.querySelector('.product-type');
    const productTypeForm = document.getElementById('producttypeform');
    let timeoutId;

    function showForm() {
        clearTimeout(timeoutId);
        renderProductTypeForm();
        productTypeForm.classList.add('show');
    }

    function hideForm() {
        timeoutId = setTimeout(() => {
            productTypeForm.classList.remove('show');
        }, 200);
    }

    productTypeItem.addEventListener('mouseenter', showForm);
    productTypeItem.addEventListener('mouseleave', hideForm);
    productTypeForm.addEventListener('mouseenter', showForm);
    productTypeForm.addEventListener('mouseleave', hideForm);
}

// Dropdown Menu
function setupDropdowns() {
    document.querySelectorAll('.dropdown').forEach(menu => {
        const dropdown = menu.querySelector('.dropdown-menu');
        menu.addEventListener('mouseover', () => (dropdown.style.display = 'block'));
        menu.addEventListener('mouseleave', () => (dropdown.style.display = 'none'));
    });
}

// User Dropdown
function setupUserMenu() {
    const userNameElement = document.querySelector('.user');
    const hoTen = sessionStorage.getItem('HoTen');
    if (hoTen) {
        userNameElement.innerHTML = `👤 ${hoTen} ▼`;
        userNameElement.style.cursor = 'pointer';

        const userMenu = document.createElement('div');
        userMenu.classList.add('user-dropdown-menu');
        userMenu.innerHTML = `
            <ul>
                <li><a href="ThongTinCaNhan.html">Xem thông tin cá nhân</a></li>
                <li><a href="ChamSocKhachHang.html">Chăm sóc khách hàng</a></li>
                <li id="logout">Đăng xuất</li>
            </ul>
        `;
        document.body.appendChild(userMenu);

        function updateMenuPosition() {
            const rect = userNameElement.getBoundingClientRect();
            userMenu.style.top = `${rect.bottom + window.scrollY + 5}px`;
            userMenu.style.left = `${rect.left + window.scrollX}px`;
        }

        userNameElement.addEventListener('click', event => {
            event.stopPropagation();
            updateMenuPosition();
            userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', event => {
            if (!userMenu.contains(event.target) && !userNameElement.contains(event.target)) {
                userMenu.style.display = 'none';
            }
        });

        document.getElementById('logout').addEventListener('click', () => {
            sessionStorage.clear();
            alert('Bạn đã đăng xuất thành công!');
            window.location.href = 'DangNhap.html';
        });
    } else {
        userNameElement.innerHTML = `<a href="DangNhap.html">Đăng nhập</a>`;
    }
}

// Thiết lập thông báo dropdown
function setupNotificationDropdown() {
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationDropdown = document.getElementById('notificationDropdown');
    let timeoutId;

    function showDropdown() {
        clearTimeout(timeoutId);
        notificationDropdown.classList.add('show');
    }

    function hideDropdown() {
        timeoutId = setTimeout(() => {
            notificationDropdown.classList.remove('show');
        }, 200);
    }

    notificationIcon.addEventListener('mouseenter', showDropdown);
    notificationIcon.addEventListener('mouseleave', hideDropdown);
    notificationDropdown.addEventListener('mouseenter', showDropdown);
    notificationDropdown.addEventListener('mouseleave', hideDropdown);

    notificationDropdown.addEventListener('click', (event) => {
        const li = event.target.closest('li');
        if (li && li.classList.contains('unread')) {
            const index = li.getAttribute('data-index');
            const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
            notifications[index].read = true;
            localStorage.setItem('notifications', JSON.stringify(notifications));

            const unreadCount = notifications.filter(n => !n.read).length;
            document.getElementById('notification-count').textContent = unreadCount;
            renderNotifications(notifications);
        }
    });
}

// Thiết lập sự kiện cho logo
function setupLogo() {
    const logo = document.querySelector('.logo');
    logo.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    initCartAndNotifications();
    setupSearch();
    setupDropdowns();
    setupUserMenu();
    setupNotificationDropdown();
    setupLogo();
    setupBrandForm();
    setupProductTypeForm();
    fetchProducts();
    showSlide(currentSlide);
    setInterval(nextSlide, 4000);
});