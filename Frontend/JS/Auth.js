async function register() {
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ HovaTen: name, SDT: phone, Email: email, MatKhau: password })
    });
    const data = await response.json();
    document.getElementById("message").innerText = data.message;
    if (response.ok) {
        alert("Đăng ký thành công!");
        window.location.href = "DangNhap.html";
    }
}
/*
//
//
//
*/
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, MatKhau: password })
    });
    const data = await response.json();
    document.getElementById("message").innerText = data.message;
    if (response.ok) {
        // Lưu thông tin người dùng vào sessionStorage
        sessionStorage.setItem("MaND", data.MaND);
        sessionStorage.setItem("HoTen", data.HoTen);
        alert("Đăng nhập thành công!");
        window.location.href = "TrangChu.html";
    }
}
/*
//
//
//
*/