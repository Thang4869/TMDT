// Lấy danh sách Loại sản phẩm
async function fetchCategories() {
    try {
        const response = await fetch('http://localhost:3000/api/loaisanpham');
        const categories = await response.json();
        const categoryTableBody = document.getElementById('category-table-body');
        categoryTableBody.innerHTML = '';
        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.MaLoai}</td>
                <td>${category.TenLoai}</td>
                <td>
                    <button onclick="editCategory('${category.MaLoai}')">Sửa</button>
                    <button onclick="deleteCategory('${category.MaLoai}')" class="btn-delete">Xóa</button>
                </td>`;
            categoryTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách loại sản phẩm:', error);
    }
}

// Thêm hoặc Cập nhật loại sản phẩm
document.getElementById('add-category-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        MaLoai: document.getElementById('category-code').value,
        TenLoai: document.getElementById('category-name').value
    };

    const submitButton = document.querySelector('.btn-submit');
    const isEdit = submitButton.textContent === 'Cập nhật loại sản phẩm'; // Kiểm tra xem là sửa hay thêm

    if (isEdit) {
        // Cập nhật loại sản phẩm
        const MaLoai = document.getElementById('category-code').value;
        fetch(`http://localhost:3000/api/loaisanpham/${MaLoai}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchCategories(); // Cập nhật lại danh sách loại sản phẩm
            resetForm(); // Reset form
        })
        .catch(error => {
            console.error('Lỗi khi cập nhật loại sản phẩm:', error);
        });
    } else {
        // Thêm mới loại sản phẩm
        fetch('http://localhost:3000/api/loaisanpham', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchCategories(); // Cập nhật lại danh sách loại sản phẩm
        })
        .catch(error => {
            console.error('Lỗi khi thêm loại sản phẩm:', error);
        });
    }
});

// Sửa loại sản phẩm
function editCategory(MaLoai) {
    // Lấy thông tin loại sản phẩm từ API và điền vào form
    fetch(`http://localhost:3000/api/loaisanpham/${MaLoai}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('category-code').value = data.MaLoai;
            document.getElementById('category-name').value = data.TenLoai;
            
            // Thay đổi nút "Thêm loại sản phẩm" thành "Cập nhật loại sản phẩm"
            const submitButton = document.querySelector('.btn-submit');
            submitButton.textContent = "Cập nhật loại sản phẩm";
        })
        .catch(error => {
            console.error('Lỗi khi lấy dữ liệu loại sản phẩm:', error);
        });
}

// Reset form và thay đổi nút lại thành "Thêm loại sản phẩm"
function resetForm() {
    document.getElementById('add-category-form').reset();
    const submitButton = document.querySelector('.btn-submit');
    submitButton.textContent = "Thêm loại sản phẩm"; // Đổi lại nút sau khi sửa
}

// Xóa loại sản phẩm
function deleteCategory(MaLoai) {
    if (!confirm(`Bạn có chắc chắn muốn xóa loại sản phẩm ${MaLoai} không?`)) return;

    fetch(`http://localhost:3000/api/loaisanpham/${MaLoai}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchCategories(); // Cập nhật lại danh sách loại sản phẩm
    })
    .catch(error => {
        console.error('Lỗi khi xóa loại sản phẩm:', error);
    });
}

// Gọi fetchCategories khi trang được tải
window.onload = fetchCategories;
