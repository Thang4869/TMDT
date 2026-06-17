const sql = require('mssql');
const config = {
    user: 'myuser',
    password: 'nagisa4869',
    server: 'WINT4869',
    database: 'TMDT',
    options: { encrypt: false },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000  // Thời gian chờ tối đa của pool
    },
    requestTimeout: 90000  // Tăng thời gian timeout lên 30 giây
};
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => { console.log("Connected to SQL Server"); return pool; })
    .catch(err => console.error("Database Connection Failed:", err));
module.exports = { sql, poolPromise };
