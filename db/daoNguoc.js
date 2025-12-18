function daoNguocChuoi(chuoi) {
    // Khởi tạo một chuỗi rỗng để lưu kết quả
    let chuoiDaoNguoc = '';

    // Duyệt chuỗi từ chỉ số cuối cùng (chuoi.length - 1) về chỉ số đầu tiên (0)
    for (let i = chuoi.length - 1; i >= 0; i--) {
        // Truy cập ký tự tại vị trí i bằng toán tử bracket notation []
        // và dùng toán tử += để nối chuỗi
        chuoiDaoNguoc += chuoi[i];
    }

    return chuoiDaoNguoc;
}

// Ví dụ sử dụng
const input = 'kyanon';
const output = daoNguocChuoi(input);
console.log(output); // Kết quả: nonayk