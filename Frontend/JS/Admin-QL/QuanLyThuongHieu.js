// Lấy danh sách Thương Hiệu từ API
fetch('http://localhost:3000/api/thuonghieu')
.then(response => {
    if (!response.ok) {
        throw new Error('API không phản hồi đúng');
    }
    return response.json();
})
.then(data => {
    const brandTableBody = document.getElementById('brand-table-body');
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.MaThuongHieu}</td>
            <td>${item.TenThuongHieu}</td>
            <td>
                <button onclick="editBrand('${item.MaThuongHieu}')">Sửa</button>
                <button onclick="deleteBrand('${item.MaThuongHieu}')" class="btn-delete">Xóa</button>
            </td>`;
        brandTableBody.appendChild(row);
    });
})
.catch(error => {
    console.error('Lỗi khi lấy danh sách thương hiệu:', error);
    alert('Lỗi khi lấy dữ liệu từ API');
});
/*
//
//
//
*/
// Thêm thương hiệu
function addBrand() {
    const brandName = document.getElementById('brand-name').value;
    if (!brandName) {
        alert('Tên thương hiệu không được để trống');
        return;
    }
    const data = { TenThuongHieu: brandName };
    fetch('http://localhost:3000/api/thuonghieu', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        location.reload();
    })
    .catch(error => {
        console.error('Lỗi khi thêm thương hiệu:', error);
        alert('Đã xảy ra lỗi khi thêm thương hiệu');
    });
}
/*
//
//
//
*/
// Sửa thương hiệu
function editBrand(MaThuongHieu) {
    fetch(`http://localhost:3000/api/thuonghieu/${MaThuongHieu}`)
    .then(response => {
    if (!response.ok) {
        throw new Error(`Không tìm thấy thương hiệu với mã ${MaThuongHieu}`);
    }
        return response.json();
    })
    .then(brand => {
        document.getElementById('brand-code').value = brand.MaThuongHieu;
        document.getElementById('brand-name').value = brand.TenThuongHieu;
        let submitButton = document.querySelector('.btn-submit');
        submitButton.textContent = "Cập nhật thương hiệu";
        submitButton.onclick = function(event) {
            event.preventDefault();
            updateBrand(MaThuongHieu);
        };
    })
    .catch(error => {
        console.error('Lỗi khi lấy dữ liệu thương hiệu:', error);
        alert('Không thể tải dữ liệu thương hiệu.');
    });
}
/*
//
//
//
*/
// Cập nhật thương hiệu
function updateBrand(MaThuongHieu) {
    const brandName = document.getElementById('brand-name').value;
    if (!brandName) {
        alert('Tên thương hiệu không được để trống');
        return;
    }
    const data = { TenThuongHieu: brandName };
    fetch(`http://localhost:3000/api/thuonghieu/${MaThuongHieu}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        location.reload();
    })
    .catch(error => {
        console.error('Lỗi khi cập nhật thương hiệu:', error);
        alert('Đã xảy ra lỗi khi cập nhật thương hiệu');
    });
}
/*
//
//
//
*/
// Xóa thương hiệu
function deleteBrand(MaThuongHieu) {
    if (!confirm(`Bạn có chắc chắn muốn xóa thương hiệu ${MaThuongHieu} không?`)) return;
    fetch(`http://localhost:3000/api/thuonghieu/${MaThuongHieu}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        location.reload();
    })
    .catch(error => {
        console.error('Lỗi khi xóa thương hiệu:', error);
        alert('Đã xảy ra lỗi khi xóa thương hiệu');
    });
}
/*
//
//
//
*/

  