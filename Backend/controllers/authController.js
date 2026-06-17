const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../models/db');

module.exports = { registerUser, loginUser };

async function loginUser(req, res) {
    try {
        const { Email, MatKhau } = req.body;
        const pool = await poolPromise;

        const userResult = await pool.request()
            .input('Email', sql.VarChar, Email)
            .query('SELECT MaND, HovaTen, MatKhau FROM NguoiDung WHERE Email = @Email');

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ message: "Email không tồn tại!" });
        }

        const user = userResult.recordset[0];
        
        // Kiểm tra mật khẩu đã mã hóa
        const isPasswordValid = await bcrypt.compare(MatKhau, user.MatKhau);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Mật khẩu không chính xác!" });
        }

        // Trả về thông tin người dùng
        res.json({ 
            message: "Đăng nhập thành công!", 
            MaND: user.MaND,
            HoTen: user.HovaTen
        });

    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
}
//
//
//
//
//
async function registerUser(req, res) {
    try {
        console.log("Dữ liệu nhận được từ frontend:", req.body);

        const { HovaTen, SDT, Email, MatKhau } = req.body;
        if (!HovaTen || !SDT || !Email || !MatKhau) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
        }

        const pool = await poolPromise;
        const checkUser = await pool.request()
            .input('Email', sql.VarChar, Email)
            .query('SELECT * FROM NguoiDung WHERE Email = @Email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: "Email đã tồn tại!" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(MatKhau, 10);
        console.log("Mật khẩu đã mã hóa:", hashedPassword);

        // Tạo mã người dùng tự động
        const getLastUser = await pool.request()
            .query("SELECT TOP 1 MaND FROM NguoiDung ORDER BY MaND DESC");

        let newUserId = 'ND001';
        if (getLastUser.recordset.length > 0) {
            let lastId = parseInt(getLastUser.recordset[0].MaND.replace('ND', '')) + 1;
            newUserId = 'ND' + lastId.toString().padStart(3, '0');
        }

        console.log("Mã người dùng mới:", newUserId);

        // Lưu vào database
        await pool.request()
            .input('MaND', sql.Char(5), newUserId)
            .input('MaPhanQuyen', sql.Char(5), 'PQ002')
            .input('HovaTen', sql.NVarChar, HovaTen)
            .input('SDT', sql.VarChar, SDT)
            .input('Email', sql.VarChar, Email)
            .input('MatKhau', sql.VarChar, hashedPassword)
            .input('DiaChi', sql.NVarChar, 'Chưa có địa chỉ') 
            .query(
                `INSERT INTO NguoiDung (MaND, MaPhanQuyen, HovaTen, SDT, Email, MatKhau, DiaChi) 
                 VALUES (@MaND, @MaPhanQuyen, @HovaTen, @SDT, @Email, @MatKhau, @DiaChi)`
            );

        console.log("Đăng ký thành công!");
        res.status(201).json({ message: "Đăng ký thành công!" });
    } catch (error) {
        console.error("Lỗi khi đăng ký:", error);
        res.status(500).json({ message: "Lỗi server, vui lòng thử lại!" });
    }
}


