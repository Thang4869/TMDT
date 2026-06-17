const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../models/db');
const nodemailer = require('nodemailer');

// Cấu hình Nodemailer với App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'vanthang48692109@gmail.com',
        pass: 'cmrkyvvwtqbdwxxx' // App Password đã tạo
    }
});

// Hàm tạo mã đơn hàng (định dạng DHxxx)
const generateOrderId = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT TOP 1 MaDonHang FROM DonHang ORDER BY MaDonHang DESC');

        let newIdNumber = 1;
        if (result.recordset.length > 0) {
            const lastId = result.recordset[0].MaDonHang;
            newIdNumber = parseInt(lastId.replace('DH', '')) + 1;
        }

        return `DH${newIdNumber.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error('❌ Lỗi khi tạo mã đơn hàng:', error);
        throw new Error('Không thể tạo mã đơn hàng.');
    }
};

// Hàm tạo mã chi tiết đơn hàng (định dạng CTDHxxx, tăng dần)
const generateDetailId = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT TOP 1 MaCTDH FROM ChiTietDonHang WITH (NOLOCK) ORDER BY CAST(SUBSTRING(MaCTDH, 5, 3) AS INT) DESC');

        let newIdNumber = 1;
        if (result.recordset.length > 0) {
            const lastId = result.recordset[0].MaCTDH;
            newIdNumber = parseInt(lastId.replace('CTDH', '')) + 1;
        }

        return `CTDH${newIdNumber.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error('❌ Lỗi khi tạo mã chi tiết đơn hàng:', error);
        throw new Error('Không thể tạo mã chi tiết đơn hàng.');
    }
};

// Hàm tạo mã đánh giá (định dạng DGxxx)
const generateReviewId = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT TOP 1 MaDanhGia FROM DanhGia ORDER BY MaDanhGia DESC');

        let newIdNumber = 1;
        if (result.recordset.length > 0) {
            const lastId = result.recordset[0].MaDanhGia;
            newIdNumber = parseInt(lastId.replace('DG', '')) + 1;
        }

        return `DG${newIdNumber.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error('❌ Lỗi khi tạo mã đánh giá:', error);
        throw new Error('Không thể tạo mã đánh giá.');
    }
};

// ---------------------------
// API QUẢN LÝ ĐƠN HÀNG (Admin)
// ---------------------------

// Lấy danh sách tất cả đơn hàng
router.get('/orders', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM DonHang');
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Lỗi khi lấy danh sách đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi khi lấy đơn hàng', error: err.message });
    }
});

// Cập nhật trạng thái đơn hàng
router.put('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { TrangThai } = req.body;

        console.log('📌 Nhận yêu cầu cập nhật đơn hàng:', { id, TrangThai });

        if (!TrangThai) {
            return res.status(400).json({ message: 'Trạng thái không được để trống!' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('TrangThai', sql.NVarChar(20), TrangThai)
            .input('MaDonHang', sql.Char(5), id)
            .query('UPDATE DonHang SET TrangThai = @TrangThai WHERE MaDonHang = @MaDonHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }

        res.json({ message: 'Cập nhật trạng thái thành công!' });
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật trạng thái đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// Xóa đơn hàng
router.delete('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📌 Nhận yêu cầu xóa đơn hàng:', id);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaDonHang', sql.Char(5), id)
            .query('DELETE FROM DonHang WHERE MaDonHang = @MaDonHang');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }

        res.json({ message: 'Đơn hàng đã được xóa!' });
    } catch (err) {
        console.error('❌ Lỗi khi xóa đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi khi xóa đơn hàng', error: err.message });
    }
});

// Lấy danh sách chi tiết đơn hàng (phiên bản cũ)
router.get('/order-details', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT CT.MaCTDH, CT.MaDonHang, CT.MaSP, SP.TenSP, CT.SoLuong, SP.Gia
                FROM ChiTietDonHang CT
                JOIN SanPham SP ON CT.MaSP = SP.MaSP
                ORDER BY CT.MaCTDH ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Lỗi khi lấy danh sách chi tiết đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// Thêm chi tiết đơn hàng
router.post('/order-details', async (req, res) => {
    try {
        const { MaDonHang, MaSP, SoLuong } = req.body;
        console.log('📌 Nhận yêu cầu thêm chi tiết đơn hàng:', { MaDonHang, MaSP, SoLuong });

        if (!MaDonHang || !MaSP || !SoLuong || SoLuong <= 0) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
        }

        const newMaCTDH = await generateDetailId();
        const pool = await poolPromise;
        await pool.request()
            .input('MaCTDH', sql.Char(7), newMaCTDH)
            .input('MaDonHang', sql.Char(5), MaDonHang)
            .input('MaSP', sql.Char(5), MaSP)
            .input('SoLuong', sql.Int, SoLuong)
            .query(`
                INSERT INTO ChiTietDonHang (MaCTDH, MaDonHang, MaSP, SoLuong)
                VALUES (@MaCTDH, @MaDonHang, @MaSP, @SoLuong)
            `);

        res.json({ message: 'Thêm chi tiết đơn hàng thành công!', MaCTDH: newMaCTDH });
    } catch (err) {
        console.error('❌ Lỗi khi thêm chi tiết đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ---------------------------
// API CHO NGƯỜI DÙNG ĐĂNG NHẬP
// ---------------------------

// Thanh toán (Người dùng đăng nhập)
router.post('/orders/checkout', async (req, res) => {
    try {
        const { MaND, cartItems, TongTien } = req.body;
        console.log('📌 Nhận yêu cầu checkout (Người dùng):', { MaND, cartItems, TongTien });

        if (!MaND || !cartItems?.length || !TongTien) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            const newOrderId = await generateOrderId();
            await transaction.request()
                .input('MaDonHang', sql.Char(5), newOrderId)
                .input('MaND', sql.Char(5), MaND)
                .input('TongTien', sql.Int, TongTien)
                .input('TrangThai', sql.NVarChar(20), 'Chưa giao')
                .query(`
                    INSERT INTO DonHang (MaDonHang, MaND, TongTien, TrangThai, NgayDat)
                    VALUES (@MaDonHang, @MaND, @TongTien, @TrangThai, GETDATE())
                `);

            for (const item of cartItems) {
                const newDetailId = await generateDetailId();
                await transaction.request()
                    .input('MaCTDH', sql.Char(7), newDetailId)
                    .input('MaDonHang', sql.Char(5), newOrderId)
                    .input('MaSP', sql.Char(5), item.MaSP)
                    .input('SoLuong', sql.Int, item.SoLuong)
                    .query(`
                        INSERT INTO ChiTietDonHang (MaCTDH, MaDonHang, MaSP, SoLuong)
                        VALUES (@MaCTDH, @MaDonHang, @MaSP, @SoLuong)
                    `);
            }

            await transaction.commit();
            res.json({ message: 'Đặt hàng thành công!', MaDonHang: newOrderId });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('❌ Lỗi khi checkout (Người dùng):', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// Lấy danh sách đơn hàng của người dùng
router.get('/user/orders/:MaND', async (req, res) => {
    try {
        const { MaND } = req.params;
        console.log('📌 Nhận yêu cầu lấy đơn hàng cho người dùng:', MaND);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaND', sql.Char(5), MaND)
            .query('SELECT * FROM DonHang WHERE MaND = @MaND');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không có đơn hàng nào cho người dùng này!' });
        }

        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Lỗi khi lấy đơn hàng của người dùng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// Hủy đơn hàng (Người dùng đăng nhập)
router.put('/user/orders/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📌 Nhận yêu cầu hủy đơn hàng:', id);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaDonHang', sql.Char(5), id)
            .query(`
                UPDATE DonHang 
                SET TrangThai = N'Đã hủy' 
                WHERE MaDonHang = @MaDonHang AND TrangThai = N'Chưa giao'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không thể hủy đơn hàng này!' });
        }

        res.json({ message: 'Đơn hàng đã bị hủy!' });
    } catch (err) {
        console.error('❌ Lỗi khi hủy đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ---------------------------
// API CHO KHÁCH VÃNG LAI
// ---------------------------

// Thanh toán (Khách vãng lai)
router.post('/orders/checkout-guest', async (req, res) => {
    try {
        const { TenKhach, SDT, DiaChi, Email, cartItems } = req.body;
        console.log('📌 Nhận yêu cầu checkout (Khách vãng lai):', { TenKhach, SDT, DiaChi, Email, cartItems });

        if (!TenKhach || !SDT || !DiaChi || !Email || !cartItems?.length) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            const newOrderId = await generateOrderId();
            const TongTien = cartItems.reduce((sum, item) => sum + item.Gia * item.SoLuong, 0);

            // Lưu đơn hàng
            await transaction.request()
                .input('MaDonHang', sql.Char(5), newOrderId)
                .input('MaND', sql.Char(5), 'GUEST')
                .input('TongTien', sql.Int, TongTien)
                .input('TrangThai', sql.NVarChar(20), 'Chưa giao')
                .query(`
                    INSERT INTO DonHang (MaDonHang, MaND, TongTien, TrangThai, NgayDat)
                    VALUES (@MaDonHang, @MaND, @TongTien, @TrangThai, GETDATE())
                `);

            // Lưu chi tiết đơn hàng
            for (const item of cartItems) {
                const newDetailId = await generateDetailId();
                await transaction.request()
                    .input('MaCTDH', sql.Char(7), newDetailId)
                    .input('MaDonHang', sql.Char(5), newOrderId)
                    .input('MaSP', sql.Char(5), item.MaSP)
                    .input('SoLuong', sql.Int, item.SoLuong)
                    .query(`
                        INSERT INTO ChiTietDonHang (MaCTDH, MaDonHang, MaSP, SoLuong)
                        VALUES (@MaCTDH, @MaDonHang, @MaSP, @SoLuong)
                    `);
            }

            // Lưu thông tin khách
            await transaction.request()
                .input('MaDonHang', sql.Char(5), newOrderId)
                .input('TenKhach', sql.NVarChar(50), TenKhach)
                .input('SDT', sql.Char(10), SDT)
                .input('DiaChi', sql.NVarChar(200), DiaChi)
                .input('Email', sql.NVarChar(50), Email)
                .input('ThoiGianHetHan', sql.DateTime, new Date(Date.now() + 72 * 60 * 60 * 1000))
                .query(`
                    INSERT INTO GuestInfo (MaDonHang, TenKhach, SDT, DiaChi, Email, ThoiGianHetHan)
                    VALUES (@MaDonHang, @TenKhach, @SDT, @DiaChi, @Email, @ThoiGianHetHan)
                `);

            await transaction.commit();

            // Gửi email xác nhận
            const mailOptions = {
                from: 'vanthang48692109@gmail.com',
                to: Email,
                subject: `Xác nhận đơn hàng #${newOrderId}`,
                html: `
                    <h2>Đơn hàng #${newOrderId}</h2>
                    <p>Tổng tiền: ${TongTien.toLocaleString()} VND</p>
                    <p>Trạng thái: Chưa giao</p>
                    <p>Thông tin sẽ hết hạn sau 72 giờ.</p>
                `
            };
            await transporter.sendMail(mailOptions);

            res.json({ message: 'Đặt hàng thành công!', MaDonHang: newOrderId });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('❌ Lỗi khi checkout (Khách vãng lai):', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// Tra cứu đơn hàng khách vãng lai
router.get('/guest/orders/:maDonHang', async (req, res) => {
    try {
        const { maDonHang } = req.params;
        console.log('📌 Nhận yêu cầu tra cứu đơn hàng khách vãng lai:', maDonHang);

        const pool = await poolPromise;
        const orderResult = await pool.request()
            .input('MaDonHang', sql.Char(5), maDonHang)
            .query(`SELECT * FROM DonHang WHERE MaDonHang = @MaDonHang AND MaND = 'GUEST'`);

        console.log('📌 Kết quả từ DonHang:', orderResult.recordset);

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }

        const guestResult = await pool.request()
            .input('MaDonHang', sql.Char(5), maDonHang)
            .query(`SELECT * FROM GuestInfo WHERE MaDonHang = @MaDonHang`);

        console.log('📌 Kết quả từ GuestInfo:', guestResult.recordset);

        if (guestResult.recordset.length === 0) {
            return res.status(410).json({ message: 'Thông tin khách đã hết hạn hoặc không tồn tại!' });
        }

        const order = orderResult.recordset[0];
        const guestInfo = guestResult.recordset[0];
        res.json({ ...order, guestInfo });
    } catch (err) {
        console.error('❌ Lỗi khi tra cứu đơn hàng khách vãng lai:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// Đánh giá đơn hàng khách vãng lai
router.post('/guest/danhgia', async (req, res) => {
    try {
        const { MaDonHang, Email, NoiDung, danhGiaList } = req.body;
        console.log('📌 Nhận yêu cầu đánh giá đơn hàng:', { MaDonHang, Email, NoiDung, danhGiaList });

        // Kiểm tra dữ liệu đầu vào
        if (!MaDonHang || !Email || !danhGiaList?.length || !NoiDung) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ! Vui lòng nhập đầy đủ nội dung và số sao.' });
        }

        const pool = await poolPromise;

        // Kiểm tra đơn hàng hợp lệ
        const orderResult = await pool.request()
            .input('MaDonHang', sql.Char(5), MaDonHang)
            .query(`SELECT * FROM DonHang WHERE MaDonHang = @MaDonHang AND MaND = 'GUEST' AND TrangThai = N'Đã giao'`);

        if (orderResult.recordset.length === 0) {
            return res.status(403).json({ message: 'Đơn hàng không hợp lệ hoặc chưa giao!' });
        }

        // Kiểm tra quyền đánh giá
        const guestResult = await pool.request()
            .input('MaDonHang', sql.Char(5), MaDonHang)
            .query(`SELECT Email FROM GuestInfo WHERE MaDonHang = @MaDonHang`);

        if (guestResult.recordset.length === 0 || guestResult.recordset[0].Email !== Email) {
            return res.status(403).json({ message: 'Không có quyền đánh giá đơn hàng này!' });
        }

        // Lưu đánh giá cho từng sản phẩm
        for (const dg of danhGiaList) {
            if (!dg.MaSP || !dg.DanhGia || dg.DanhGia < 1 || dg.DanhGia > 5) {
                return res.status(400).json({ message: 'Số sao không hợp lệ! Phải từ 1 đến 5.' });
            }

            const newMaDanhGia = await generateReviewId();
            await pool.request()
                .input('MaDanhGia', sql.Char(5), newMaDanhGia)
                .input('MaSP', sql.Char(5), dg.MaSP)
                .input('MaND', sql.Char(5), 'GUEST')
                .input('DanhGia', sql.Int, dg.DanhGia)
                .input('NoiDung', sql.NVarChar(200), NoiDung || '')
                .query(`
                    INSERT INTO DanhGia (MaDanhGia, MaSP, MaND, DanhGia, NoiDung, ThoiGian)
                    VALUES (@MaDanhGia, @MaSP, @MaND, @DanhGia, @NoiDung, GETDATE())
                `);
        }

        res.json({ message: 'Đánh giá thành công!' });
    } catch (err) {
        console.error('❌ Lỗi khi đánh giá đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// API tạo đơn hàng (Không dùng transaction - Cũ)
router.post('/orders', async (req, res) => {
    try {
        const { MaND, cartItems } = req.body;
        console.log('📌 Nhận yêu cầu tạo đơn hàng (Không transaction):', { MaND, cartItems });

        if (!MaND || !cartItems?.length) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
        }

        const pool = await poolPromise;
        const newOrderId = await generateOrderId();
        const TongTien = cartItems.reduce((sum, item) => sum + item.Gia * item.SoLuong, 0);

        await pool.request()
            .input('MaDonHang', sql.Char(5), newOrderId)
            .input('MaND', sql.Char(5), MaND)
            .input('TongTien', sql.Int, TongTien)
            .input('TrangThai', sql.NVarChar(50), 'Chưa giao')
            .input('NgayDat', sql.Date, new Date())
            .query(`
                INSERT INTO DonHang (MaDonHang, MaND, TongTien, TrangThai, NgayDat)
                VALUES (@MaDonHang, @MaND, @TongTien, @TrangThai, @NgayDat)
            `);

        for (const item of cartItems) {
            const newDetailId = await generateDetailId();
            await pool.request()
                .input('MaCTDH', sql.Char(7), newDetailId)
                .input('MaDonHang', sql.Char(5), newOrderId)
                .input('MaSP', sql.Char(5), item.MaSP)
                .input('SoLuong', sql.Int, item.SoLuong)
                .query(`
                    INSERT INTO ChiTietDonHang (MaCTDH, MaDonHang, MaSP, SoLuong)
                    VALUES (@MaCTDH, @MaDonHang, @MaSP, @SoLuong)
                `);
        }

        res.json({ message: 'Đặt hàng thành công!', MaDonHang: newOrderId });
    } catch (err) {
        console.error('❌ Lỗi khi tạo đơn hàng (Không transaction):', err);
        res.status(500).json({ message: 'Lỗi server, không thể tạo đơn hàng!', error: err.message });
    }
});

module.exports = router;