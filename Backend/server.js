// Import các module cần thiết
const express = require('express');
const sql = require('mssql');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

// Kết nối cơ sở dữ liệu
const config = {
    server: 'WINT4869',
    database: 'TMDT',
    user: 'myuser', 
    password: 'nagisa4869',
    options: { encrypt: true, trustServerCertificate: true }
};
sql.connect(config)
    .then(() => { console.log('Kết nối SQL Server thành công'); })
    .catch((err) => { console.error('Lỗi kết nối SQL Server:', err); });

// Khởi động server
app.listen(port, () => { console.log(`Server đang chạy tại http://localhost:${port}`); });

// Trang chủ - Giao diện
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/HTML/TrangChu.html'));
});

// API lấy danh sách sản phẩm
app.get('/api/sanpham', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Lấy tham số trang, mặc định là trang 1
        const pageSize = 10; // Số sản phẩm trên mỗi trang
        const offset = (page - 1) * pageSize;

        const result = await sql.query(`
            SELECT * FROM SanPham
            ORDER BY MaSP
            OFFSET ${offset} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY
        `);

        result.recordset.forEach(sp => {
            if (sp.Hinh && !sp.Hinh.startsWith('http')) {
                sp.Hinh = `http://localhost:3000/uploads/${sp.Hinh}`;
            }
        });
        
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// Kết nối tới thư viện ảnh
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Cấu hình lưu ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '/public/uploads/');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API Thêm sản phẩm
app.post('/api/sanpham', upload.single('Hinh'), async (req, res) => {
    try {
        let { MaLoai, MaThuongHieu, TenSP, Gia, SoLuong, MoTa } = req.body;
        let Hinh = req.file ? `uploads/${req.file.filename}` : null;
        if (!MaLoai || !MaThuongHieu || !TenSP || !Gia || !SoLuong) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        }
        let result = await sql.query(`SELECT TOP 1 MaSP FROM SanPham ORDER BY MaSP DESC`);
        let newMaSP = 'SP001';
        if (result.recordset.length > 0) {
            let lastMaSP = result.recordset[0].MaSP;
            let numberPart = parseInt(lastMaSP.substring(2)) + 1;
            newMaSP = `SP${numberPart.toString().padStart(3, '0')}`;
        }
        console.log(" Mã sản phẩm mới:", newMaSP);
        await sql.query(`
            INSERT INTO SanPham (MaSP, MaLoai, MaThuongHieu, TenSP, Gia, SoLuong, MoTa, Hinh)
            VALUES ('${newMaSP}', '${MaLoai}', '${MaThuongHieu}', N'${TenSP}', ${Gia}, ${SoLuong}, N'${MoTa}', '${Hinh}')
        `);
        res.status(200).json({ message: `Thêm sản phẩm thành công với mã ${newMaSP}` });
    } catch (err) {
        console.error('Lỗi khi thêm sản phẩm:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi thêm sản phẩm', details: err.message });
    }
});

// API Cập nhật sản phẩm
app.put('/api/sanpham/:id', upload.single('Hinh'), async (req, res) => {
    try {
        const { id } = req.params;
        const { MaLoai, MaThuongHieu, TenSP, Gia, SoLuong, MoTa } = req.body;
        let Hinh = req.file ? `uploads/${req.file.filename}` : null;
        if (!MaLoai || !MaThuongHieu || !TenSP || !Gia || !SoLuong) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        }
        let result = await sql.query(`SELECT * FROM SanPham WHERE MaSP = '${id}'`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm để cập nhật' });
        }
        if (!Hinh) {
            Hinh = result.recordset[0].Hinh;
        }
        await sql.query(`
            UPDATE SanPham
            SET MaLoai = '${MaLoai}', MaThuongHieu = '${MaThuongHieu}', TenSP = N'${TenSP}', 
                Gia = ${Gia}, SoLuong = ${SoLuong}, MoTa = N'${MoTa}', Hinh = '${Hinh}'
            WHERE MaSP = '${id}'
        `);
        res.status(200).json({ message: `Cập nhật sản phẩm ${id} thành công!` });
    } catch (err) {
        console.error('Lỗi khi cập nhật sản phẩm:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật sản phẩm', details: err.message });
    }
});

// API lấy sản phẩm
app.get('/api/sanpham/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sql.query(`SELECT * FROM SanPham WHERE MaSP = '${id}'`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }
        let product = result.recordset[0];
        if (product.Hinh && !product.Hinh.startsWith('http')) {
            product.Hinh = `http://localhost:3000/${product.Hinh}`;
        }
        res.status(200).json(product);
    } catch (err) {
        console.error('Lỗi khi lấy sản phẩm:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy sản phẩm', details: err.message });
    }
});

// API xóa sản phẩm
app.delete('/api/sanpham/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let result = await sql.query(`SELECT * FROM SanPham WHERE MaSP = '${id}'`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm để xóa' });
        }
        await sql.query(`DELETE FROM SanPham WHERE MaSP = '${id}'`);
        res.status(200).json({ message: `Sản phẩm ${id} đã được xóa thành công` });
    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi xóa sản phẩm', details: err.message });
    }
});

// API lấy danh sách Mã Thương Hiệu
app.get('/api/thuonghieu', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM ThuongHieu');
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi khi lấy dữ liệu thương hiệu:', err);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu thương hiệu', details: err.message });
    }
});

// API Thêm thương hiệu
app.post('/api/thuonghieu', async (req, res) => {
    try {
        const { TenThuongHieu } = req.body;
        if (!TenThuongHieu) {
            return res.status(400).json({ error: 'Tên thương hiệu không được để trống' });
        }
        let result = await sql.query(`SELECT TOP 1 MaThuongHieu FROM ThuongHieu ORDER BY MaThuongHieu DESC`);
        let newMaThuongHieu = 'TH001';
        if (result.recordset.length > 0) {
            let lastMaThuongHieu = result.recordset[0].MaThuongHieu;
            let numberPart = parseInt(lastMaThuongHieu.substring(2)) + 1; 
            newMaThuongHieu = `TH${numberPart.toString().padStart(3, '0')}`;
        }
        console.log("Mã thương hiệu mới:", newMaThuongHieu);
        await sql.query(`
            INSERT INTO ThuongHieu (MaThuongHieu, TenThuongHieu)
            VALUES ('${newMaThuongHieu}', N'${TenThuongHieu}')
        `);
        res.status(200).json({ message: `Thêm thương hiệu thành công với mã ${newMaThuongHieu}` });
    } catch (err) {
        console.error('Lỗi khi thêm thương hiệu:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi thêm thương hiệu', details: err.message });
    }
});

// Cập nhật thông tin thương hiệu
app.put('/api/thuonghieu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { TenThuongHieu } = req.body;
        if (!TenThuongHieu) {
            return res.status(400).json({ error: 'Tên thương hiệu không được để trống' });
        }
        const result = await sql.query(`SELECT * FROM ThuongHieu WHERE MaThuongHieu = '${id}'`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: `Không tìm thấy thương hiệu với mã ${id}` });
        }
        await sql.query(`
            UPDATE ThuongHieu
            SET TenThuongHieu = N'${TenThuongHieu}'
            WHERE MaThuongHieu = '${id}'
        `);
        res.status(200).json({ message: `Cập nhật thương hiệu ${id} thành công!` });
    } catch (err) {
        console.error('Lỗi khi cập nhật thương hiệu:', err);
        res.status(500).json({ error: 'Lỗi khi cập nhật thương hiệu', details: err.message });
    }
});

// Xóa thương hiệu
app.delete('/api/thuonghieu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sql.query(`SELECT * FROM ThuongHieu WHERE MaThuongHieu = '${id}'`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thương hiệu để xóa' });
        }
        await sql.query(`DELETE FROM ThuongHieu WHERE MaThuongHieu = '${id}'`);
        res.status(200).json({ message: `Xóa thương hiệu ${id} thành công!` });
    } catch (err) {
        console.error('Lỗi khi xóa thương hiệu:', err);
        res.status(500).json({ error: 'Lỗi khi xóa thương hiệu', details: err.message });
    }
});

// API lấy thương hiệu theo MaThuongHieu
app.get('/api/thuonghieu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sql.query(`SELECT * FROM ThuongHieu WHERE MaThuongHieu = '${id}'`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: `Không tìm thấy thương hiệu với mã ${id}` });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Lỗi khi lấy dữ liệu thương hiệu:', err);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu thương hiệu', details: err.message });
    }
});

// API lấy danh sách loại sản phẩm
app.get('/api/loaisanpham', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM LoaiSanPham');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send('Lỗi khi lấy dữ liệu loại sản phẩm');
    }
});

// API thêm loại sản phẩm
app.post('/api/loaisanpham', async (req, res) => {
    const { MaLoai, TenLoai } = req.body;
    try {
        await sql.query(`INSERT INTO LoaiSanPham (MaLoai, TenLoai) VALUES ('${MaLoai}', N'${TenLoai}')`);
        res.status(200).json({ message: 'Thêm loại sản phẩm thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi thêm loại sản phẩm', error: err.message });
    }
});

// API xóa loại sản phẩm
app.delete('/api/loaisanpham/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query(`DELETE FROM LoaiSanPham WHERE MaLoai = '${id}'`);
        res.status(200).json({ message: `Loại sản phẩm ${id} đã được xóa` });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xóa loại sản phẩm', error: err.message });
    }
});

// API lấy thông tin loại sản phẩm
app.get('/api/loaisanpham/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await sql.query(`SELECT * FROM LoaiSanPham WHERE MaLoai = '${id}'`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: `Không tìm thấy loại sản phẩm với mã ${id}` });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Lỗi khi lấy dữ liệu loại sản phẩm:', err);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu loại sản phẩm', details: err.message });
    }
});

// API Cập nhật loại sản phẩm
app.put('/api/loaisanpham/:id', async (req, res) => {
    const { id } = req.params;
    const { TenLoai } = req.body;
    if (!TenLoai) {
        return res.status(400).json({ error: 'Tên loại sản phẩm không được để trống' });
    }
    try {
        const result = await sql.query(`SELECT * FROM LoaiSanPham WHERE MaLoai = '${id}'`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: `Không tìm thấy loại sản phẩm với mã ${id}` });
        }
        await sql.query(`
            UPDATE LoaiSanPham
            SET TenLoai = N'${TenLoai}'
            WHERE MaLoai = '${id}'
        `);
        res.status(200).json({ message: `Cập nhật loại sản phẩm ${id} thành công!` });
    } catch (err) {
        console.error('Lỗi khi cập nhật loại sản phẩm:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật loại sản phẩm', details: err.message });
    }
});

// API đăng ký người dùng
app.post('/api/register', async (req, res) => {
    const { username, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const request = new sql.Request();
        const result = await request.query(`INSERT INTO NguoiDung (username, email, phone, password) VALUES ('${username}', '${email}', '${phone}', '${hashedPassword}')`);
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi đăng ký' });
    }
});

// API đăng nhập người dùng
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const request = new sql.Request();
        const result = await request.query(`SELECT * FROM NguoiDung WHERE email = '${email}'`);
        
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (isMatch) {
                res.status(200).json({ message: 'Đăng nhập thành công' });
            } else {
                res.status(400).json({ message: 'Mật khẩu không đúng' });
            }
        } else {
            res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi đăng nhập' });
    }
});

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const orderController = require('./controllers/orderController');
const orderRoutes = require('./routes/orderRoutes');

// Đăng ký route cho API đơn hàng
app.use('/api', orderRoutes);
app.use('/api/orders/actions', orderController);

app.post('/api/danhgia', async (req, res) => {
    try {
        const { MaSP, MaND, DanhGia, NoiDung } = req.body;
        if (!MaSP || !MaND || !DanhGia || !NoiDung) {
            return res.status(400).json({ error: 'Thiếu thông tin đánh giá' });
        }
        let result = await sql.query(`SELECT TOP 1 MaDanhGia FROM DanhGia ORDER BY MaDanhGia DESC`);
        let newMaDanhGia = 'DG001';
        if (result.recordset.length > 0) {
            let lastMa = result.recordset[0].MaDanhGia;
            let numberPart = parseInt(lastMa.substring(2)) + 1;
            newMaDanhGia = `DG${numberPart.toString().padStart(3, '0')}`;
        }
        const ThoiGian = new Date().toISOString().split('T')[0];
        await sql.query(`
            INSERT INTO DanhGia (MaDanhGia, MaSP, MaND, DanhGia, NoiDung, ThoiGian)
            VALUES ('${newMaDanhGia}', '${MaSP}', '${MaND}', ${DanhGia}, N'${NoiDung}', '${ThoiGian}')
        `);
        res.status(200).json({ message: 'Thêm đánh giá thành công!' });
    } catch (err) {
        console.error('Lỗi khi thêm đánh giá:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi thêm đánh giá', details: err.message });
    }
});

app.get('/api/danhgia/:MaSP', async (req, res) => {
    try {
        const { MaSP } = req.params;
        const result = await sql.query(`SELECT * FROM DanhGia WHERE MaSP = '${MaSP}' ORDER BY ThoiGian DESC`);
        if (result.recordset.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Lỗi khi lấy đánh giá:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy đánh giá', details: err.message });
    }
});

app.get('/api/danhgia/trungbinh/:MaSP', async (req, res) => {
    try {
        const { MaSP } = req.params;
        const result = await sql.query(`
            SELECT AVG(DanhGia) AS TrungBinhSao, COUNT(*) AS SoDanhGia
            FROM DanhGia WHERE MaSP = '${MaSP}'
        `);
        if (result.recordset.length === 0 || result.recordset[0].SoDanhGia === 0) {
            return res.json({ TrungBinhSao: 0, SoDanhGia: 0 });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
    }
});

app.delete('/api/danhgia/:MaDanhGia', async (req, res) => {
    try {
        const { MaDanhGia } = req.params;
        await sql.query(`DELETE FROM DanhGia WHERE MaDanhGia = '${MaDanhGia}'`);
        res.json({ message: 'Xóa đánh giá thành công!' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi máy chủ khi xóa đánh giá', details: err.message });
    }
});

app.put('/api/danhgia/:MaDanhGia', async (req, res) => {
    try {
        const { MaDanhGia } = req.params;
        const { DanhGia, NoiDung } = req.body;
        await sql.query(`
            UPDATE DanhGia SET DanhGia = ${DanhGia}, NoiDung = N'${NoiDung}'
            WHERE MaDanhGia = '${MaDanhGia}'
        `);
        res.json({ message: 'Chỉnh sửa đánh giá thành công!' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi máy chủ khi chỉnh sửa đánh giá', details: err.message });
    }
});

// API lấy thống kê doanh thu theo tháng
app.get('/api/thongke/doanhthu', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Định dạng ngày không hợp lệ' });
            }

            if (start > end) {
                return res.status(400).json({ error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
            }
        }

        let query = `
            SELECT FORMAT(NgayDat, 'yyyy-MM') AS Thang, 
                   CAST(SUM(CAST(TongTien AS BIGINT)) AS BIGINT) AS TongDoanhThu,
                   COUNT(*) AS TongSoHang
            FROM DonHang
            WHERE TrangThai = N'Đã giao'
        `;

        const request = new sql.Request();

        if (startDate && endDate) {
            const start = new Date(startDate).toISOString().slice(0, 19).replace('T', ' ');
            const end = new Date(endDate).toISOString().slice(0, 19).replace('T', ' ');
            query += ` AND NgayDat BETWEEN @start AND @end`;
            request.input('start', sql.DateTime, new Date(start));
            request.input('end', sql.DateTime, new Date(end));
        }

        query += ` GROUP BY FORMAT(NgayDat, 'yyyy-MM') ORDER BY Thang ASC`;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi khi lấy thống kê doanh thu:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy dữ liệu doanh thu', details: err.message });
    }
});

// API lấy thống kê doanh thu theo ngày
app.get('/api/thongke/doanhthu/ngay', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Định dạng ngày không hợp lệ' });
            }

            if (start > end) {
                return res.status(400).json({ error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
            }
        }

        let query = `
            SELECT CONVERT(varchar, NgayDat, 120) AS Ngay, 
                   CAST(SUM(CAST(TongTien AS BIGINT)) AS BIGINT) AS TongDoanhThu,
                   COUNT(*) AS TongSoHang
            FROM DonHang
            WHERE TrangThai = N'Đã giao'
        `;

        const request = new sql.Request();

        if (startDate && endDate) {
            const start = new Date(startDate).toISOString().slice(0, 19).replace('T', ' ');
            const end = new Date(endDate).toISOString().slice(0, 19).replace('T', ' ');
            query += ` AND NgayDat BETWEEN @start AND @end`;
            request.input('start', sql.DateTime, new Date(start));
            request.input('end', sql.DateTime, new Date(end));
        }

        query += ` GROUP BY CONVERT(varchar, NgayDat, 120) ORDER BY Ngay ASC`;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi khi lấy thống kê doanh thu theo ngày:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy dữ liệu doanh thu theo ngày', details: err.message });
    }
});

// API lấy danh sách đơn hàng theo tháng
app.get('/api/thongke/donhang/:thang', async (req, res) => {
    try {
        const { thang } = req.params;

        const thangRegex = /^\d{4}-\d{2}$/;
        if (!thangRegex.test(thang)) {
            return res.status(400).json({ error: 'Định dạng tháng không hợp lệ (yyyy-MM)' });
        }

        const request = new sql.Request();
        request.input('thang', sql.NVarChar, thang);
        const result = await request.query(`
            SELECT MaDonHang, MaND, TongTien, TrangThai, CONVERT(varchar, NgayDat, 120) AS NgayDat
            FROM DonHang
            WHERE TrangThai = N'Đã giao' AND FORMAT(NgayDat, 'yyyy-MM') = @thang
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách đơn hàng', details: err.message });
    }
});

// API chi tiết doanh thu theo tháng
app.get('/api/thongke/chitietdoanhthu', async (req, res) => {
    try {
        const { ngay } = req.query;

        const thangRegex = /^\d{4}-\d{2}$/;
        if (!thangRegex.test(ngay)) {
            return res.status(400).json({ error: 'Định dạng tháng không hợp lệ (yyyy-MM)' });
        }

        const request = new sql.Request();
        request.input('thang', sql.NVarChar, ngay);
        const result = await request.query(`
            SELECT SP.TenSP, SUM(CT.SoLuong) AS SoLuong, SP.Gia
            FROM DonHang DH
            JOIN ChiTietDonHang CT ON DH.MaDonHang = CT.MaDonHang
            JOIN SanPham SP ON CT.MaSP = SP.MaSP
            WHERE DH.TrangThai = N'Đã giao' 
            AND FORMAT(DH.NgayDat, 'yyyy-MM') = @thang
            GROUP BY SP.TenSP, SP.Gia
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi khi lấy chi tiết doanh thu:', err);
        res.status(500).json({ error: 'Lỗi máy chủ khi lấy chi tiết doanh thu', details: err.message });
    }
});

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'vanthang48692109@gmail.com',
        pass: 'cmrkyvvwtqbdwxxx'
    }
});