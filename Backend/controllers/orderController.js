const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../models/db');

router.post('/checkout', async (req, res) => {
    try {
        console.log("Dữ liệu nhận từ frontend:", req.body);

        let { MaND, cartItems, TongTien } = req.body;
        
        // Giữ nguyên MaND dạng chuỗi vì database lưu CHAR(5)
        const MaND_String = String(MaND);

        // Chuyển đổi MaSP về chuỗi, SoLuong về số
        const cartItemsValidated = cartItems.map(item => ({
            MaSP: String(item.MaSP), // Giữ nguyên kiểu chuỗi
            SoLuong: parseInt(item.SoLuong)
        }));

        // Kiểm tra xem có sản phẩm nào bị lỗi không
        if (cartItemsValidated.some(item => !item.MaSP || isNaN(item.SoLuong))) {
            return res.status(400).json({ message: 'Dữ liệu sản phẩm không hợp lệ!' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Lấy mã đơn hàng mới từ database
            const result = await pool.request().query("SELECT MAX(MaDonHang) as lastOrder FROM DonHang");
            let lastOrder = result.recordset[0].lastOrder || "DH000";
            let newOrderNumber = parseInt(lastOrder.replace("DH", "")) + 1;
            const MaDonHang = "DH" + newOrderNumber.toString().padStart(3, "0");

            const NgayDat = new Date().toISOString();

            // Lưu đơn hàng
            await pool.request()
                .input('MaDonHang', sql.Char(5), MaDonHang)
                .input('MaND', sql.Char(5), MaND_String)  
                .input('TongTien', sql.Float, TongTien)
                .input('TrangThai', sql.NVarChar(20), "Chờ xử lý")  // Thêm trạng thái
                .input('NgayDat', sql.DateTime, NgayDat)
                .query(`INSERT INTO DonHang (MaDonHang, MaND, TongTien, TrangThai, NgayDat) 
                        VALUES (@MaDonHang, @MaND, @TongTien, @TrangThai, @NgayDat)`);

            // Lưu chi tiết đơn hàng
            for (const item of cartItemsValidated) {
                console.log("Thêm sản phẩm vào đơn hàng:", item);
                
                // Lấy mã CTDH mới
                const resultCTDH = await pool.request().query("SELECT MAX(MaCTDH) as lastDetail FROM ChiTietDonHang");
                let lastDetail = resultCTDH.recordset[0].lastDetail || "CTDH000";
                let newDetailNumber = parseInt(lastDetail.replace("CTDH", "")) + 1;
                const MaCTDH = "CTDH" + newDetailNumber.toString().padStart(3, "0");

                await pool.request()
                    .input('MaCTDH', sql.Char(7), MaCTDH)
                    .input('MaDonHang', sql.Char(5), MaDonHang)
                    .input('MaSP', sql.Char(5), item.MaSP) 
                    .input('SoLuong', sql.Int, item.SoLuong)
                    .query(`INSERT INTO ChiTietDonHang (MaCTDH, MaDonHang, MaSP, SoLuong) VALUES (@MaCTDH, @MaDonHang, @MaSP, @SoLuong)`);
            }

            await transaction.commit();
            res.status(200).json({ message: 'Đơn hàng đã được tạo!', MaDonHang });
        } catch (error) {
            await transaction.rollback();
            console.error("Lỗi SQL:", error);
            res.status(500).json({ message: 'Lỗi khi xử lý đơn hàng!', error: error.message });
        }
    } catch (error) {
        console.error("Lỗi server:", error);
        res.status(500).json({ message: 'Lỗi server!', error: error.message });
    }
});




module.exports = router;
