// Lấy danh sách Mã Loại từ API
fetch('http://localhost:3000/api/loaisanpham')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('product-category');
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.MaLoai;
            option.textContent = item.TenLoai;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Lỗi khi lấy danh sách loại sản phẩm:', error);
    });
/*
//
//
//
*/
// Lấy danh sách Mã Thương Hiệu từ API
fetch('http://localhost:3000/api/thuonghieu')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('product-brand');
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.MaThuongHieu;
            option.textContent = item.TenThuongHieu;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Lỗi khi lấy danh sách thương hiệu:', error);
    });
/*
//
//
//
*/
// Thêm sản phẩm
document.getElementById('add-product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let formData = new FormData();
    formData.append('MaLoai', document.getElementById('product-category').value);
    formData.append('MaThuongHieu', document.getElementById('product-brand').value);
    formData.append('TenSP', document.getElementById('product-name').value);
    formData.append('Gia', document.getElementById('product-price').value);
    formData.append('SoLuong', document.getElementById('product-quantity').value);
    formData.append('MoTa', document.getElementById('product-description').value);
    const fileInput = document.getElementById('product-image');
    if (fileInput.files.length > 0) {
        formData.append('Hinh', fileInput.files[0]);
    }
    fetch('http://localhost:3000/api/sanpham', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchProducts();
    })
    .catch(error => {
        console.error('Lỗi khi thêm sản phẩm:', error);
        alert('Đã xảy ra lỗi khi thêm sản phẩm');
    });
});
/*
//
//
//
*/
//Danh sách sản phẩm
let currentPage = 1;
const itemsPerPage = 10;
let productsData = []; // lưu toàn bộ sản phẩm lấy từ API
let totalPages = 1;

// Lấy tất cả sản phẩm 1 lần duy nhất khi load trang
async function fetchAllProducts() {
    try {
        const response = await fetch(`http://localhost:3000/api/sanpham`);
        if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu sản phẩm');
        productsData = await response.json();
        
        // Đảo ngược để sản phẩm mới nhất đầu tiên
        productsData.reverse();

        totalPages = Math.ceil(productsData.length / itemsPerPage);
        renderProductsByPage(currentPage);
        renderPagination();
    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
    }
}

// Hàm hiển thị sản phẩm theo trang
function renderProductsByPage(page = 1) {
    currentPage = page;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentItems = productsData.slice(start, end);

    const productTableBody = document.getElementById('product-table-body');
    productTableBody.innerHTML = '';

    if (currentItems.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="9">Không có sản phẩm nào.</td></tr>';
        return;
    }

    currentItems.forEach((product) => {
        const row = document.createElement('tr');
        const imageUrl = product.Hinh || '/Frontend/IMAGE/default.jpg';
        row.innerHTML = `
            <td>${product.MaSP}</td>
            <td>${product.MaLoai}</td>
            <td>${product.MaThuongHieu}</td>
            <td>${product.TenSP}</td>
            <td>${product.Gia.toLocaleString()} VND</td>
            <td>${product.SoLuong}</td>
            <td>${product.MoTa}</td>
            <td><img src="${imageUrl}" alt="${product.TenSP}" width="90"></td>
            <td>
                <button onclick="editProduct('${product.MaSP}')">Sửa</button>
                <button onclick="deleteProduct('${product.MaSP}')" class="btn-delete">Xóa</button>
            </td>`;
        productTableBody.appendChild(row);
    });
}

// Render pagination với animation
function renderPagination() {
    const pageNumbersContainer = document.getElementById('page-numbers');
    pageNumbersContainer.innerHTML = '';

    for (let i = totalPages; i >= 1; i--) {
        const pageNumElem = document.createElement('span');
        pageNumElem.classList.add('page-number');
        if (i === currentPage) pageNumElem.classList.add('active');
        pageNumElem.textContent = i;
        pageNumElem.onclick = () => handlePageChange(i);
        pageNumbersContainer.appendChild(pageNumElem);
    }
}

// Xử lý chuyển trang
function handlePageChange(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;

    currentPage = pageNumber;

    // Animation chuyển trang mượt mà
    const tableContainer = document.querySelector('.table-container');
    tableContainer.style.opacity = 0;
    tableContainer.style.transform = 'translateY(10px)';

    setTimeout(() => {
        renderProductsByPage(currentPage);
        renderPagination();

        tableContainer.style.opacity = 1;
        tableContainer.style.transform = 'translateY(0)';
    }, 250);
}

// Event listeners cho nút trang trước và sau
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage < totalPages) {
        handlePageChange(currentPage + 1);
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage > 1) {
        handlePageChange(currentPage - 1);
    }
});

// Load dữ liệu ngay khi trang tải lần đầu
window.onload = () => fetchAllProducts();
/*
//
//
//
*/
// Hàm khi nhấn nút "Sửa"
function editProduct(MaSP) {
    fetch(`http://localhost:3000/api/sanpham/${MaSP}`)
    .then(response => response.json())
    .then(product => {
        document.getElementById('product-code').value = product.MaSP;
        document.getElementById('product-category').value = product.MaLoai;
        document.getElementById('product-brand').value = product.MaThuongHieu;
        document.getElementById('product-name').value = product.TenSP;
        document.getElementById('product-price').value = product.Gia;
        document.getElementById('product-quantity').value = product.SoLuong;
        document.getElementById('product-description').value = product.MoTa;
        if (product.Hinh) {
            document.getElementById('preview-image').src = product.Hinh;
            document.getElementById('preview-image').style.display = 'block';
        }
        let submitButton = document.querySelector('.btn-submit');
        submitButton.textContent = "Cập nhật sản phẩm";
        submitButton.onclick = function(event) {
            event.preventDefault();
            updateProduct(MaSP);
        };
    })
    .catch(error => {
        console.error('❌ Lỗi khi lấy dữ liệu sản phẩm:', error);
        alert('Không thể tải dữ liệu sản phẩm.');
    });
}
/*
//
//
//
*/
// Hàm cập nhật sản phẩm
function updateProduct(MaSP) {
    let formData = new FormData();
    formData.append('MaLoai', document.getElementById('product-category').value);
    formData.append('MaThuongHieu', document.getElementById('product-brand').value);
    formData.append('TenSP', document.getElementById('product-name').value);
    formData.append('Gia', document.getElementById('product-price').value);
    formData.append('SoLuong', document.getElementById('product-quantity').value);
    formData.append('MoTa', document.getElementById('product-description').value);
    const fileInput = document.getElementById('product-image');
    if (fileInput.files.length > 0) {
        formData.append('Hinh', fileInput.files[0]);
    }
    fetch(`http://localhost:3000/api/sanpham/${MaSP}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);

        resetForm();
    })
    .catch(error => {
        console.error('❌ Lỗi khi cập nhật sản phẩm:', error);
        alert('Đã xảy ra lỗi khi cập nhật sản phẩm');
    });
}
/*
//
//
//
*/
// reset form thêm sản phẩm
function resetForm() {
    document.getElementById('add-product-form').reset();
    document.getElementById('preview-image').style.display = 'none';
    let submitButton = document.querySelector('.btn-submit');
    submitButton.textContent = "Thêm sản phẩm";
    submitButton.onclick = function(event) {
        event.preventDefault();
        submitNewProduct();
    };
}
/*
//
//
//
*/
// Xóa sản phẩm
function deleteProduct(MaSP) {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm ${MaSP} không?`)) return;
    fetch(`http://localhost:3000/api/sanpham/${MaSP}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchProducts();
    })
    .catch(error => {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Đã xảy ra lỗi khi xóa sản phẩm');
    });
}
