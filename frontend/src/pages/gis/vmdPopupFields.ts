const VMD_POPUP_ROWS = [

  { kcht: '27', key: 'ma', label: 'Mã cảng cạn' },
  { kcht: '27', key: 'ten', label: 'Tên cảng cạn' },
  { kcht: '1', key: 'ma', label: 'Mã cảng biển' },
  { kcht: '1', key: 'ten', label: 'Tên cảng biển' },
  { kcht: '2', key: 'ma', label: 'Mã bến cảng' },
  { kcht: '2', key: 'ten', label: 'Tên bến cảng' },
  { kcht: '3', key: 'ma', label: 'Mã cầu cảng' },
  { kcht: '3', key: 'ten', label: 'Tên cầu cảng' },
  { kcht: '4', key: 'ma', label: 'Mã bến phao' },
  { kcht: '4', key: 'ten', label: 'Tên bến phao' },
  { kcht: '5', key: 'ma', label: 'Mã khu tránh, trú bão' },
  { kcht: '5', key: 'ten', label: 'Tên khu tránh, trú bão' },
  { kcht: '6', key: 'ma', label: 'Mã khu chuyển tải' },
  { kcht: '6', key: 'ten', label: 'Tên khu chuyển tải' },
  { kcht: '7', key: 'ma', label: 'Mã khu neo đậu' },
  { kcht: '7', key: 'ten', label: 'Tên khu neo đậu' },
  { kcht: '8', key: 'ma', label: 'Mã cơ sở sửa chữa, đóng tàu' },
  { kcht: '8', key: 'ten', label: 'Tên cơ sở sửa chữa, đóng tàu' },
  { kcht: '9', key: 'ma', label: 'Mã đèn biển' },
  { kcht: '9', key: 'ten', label: 'Tên đèn biển' },
  { kcht: '10', key: 'ma', label: 'Mã nhà trạm' },
  { kcht: '10', key: 'ten', label: 'Tên nhà trạm' },
  { kcht: '28', key: 'ma', label: 'Mã phao, tiêu' },
  { kcht: '28', key: 'ten', label: 'Tên phao, tiêu' },
  { kcht: '11', key: 'ma', label: 'Mã hệ thống VTS' },
  { kcht: '11', key: 'ten', label: 'Tên hệ thống VTS' },
  { kcht: '12', key: 'ma', label: 'Mã trung tâm điều hành VTS' },
  { kcht: '12', key: 'ten', label: 'Tên trung tâm điều hành VTS' },
  { kcht: '13', key: 'ma', label: 'Mã radar' },
  { kcht: '13', key: 'ten', label: 'Tên radar' },
  { kcht: '14,15,16,17,18,19', key: 'ma', label: 'Mã thiết bị' },
  { kcht: '14,15,16,17,18,19', key: 'ten', label: 'Tên thiết bị' },
  { kcht: '21', key: 'ma', label: 'Mã luồng hàng hải' },
  { kcht: '21', key: 'ten', label: 'Tên luồng hàng hải' },
  { kcht: '20', key: 'ma', label: 'Mã đê kè' },
  { kcht: '20', key: 'ten', label: 'Tên đê kè' },
  { kcht: '22,23,24,25,26', key: 'ma', label: 'Mã đài' },
  { kcht: '22,23,24,25,26', key: 'ten', label: 'Tên đài' },
  {
    kcht: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28',
    key: 'fkDonViQl',
    label: 'Đơn vị quản lý',
    type: 'maTen'
  },
  {
    kcht: '1,2,3,4,5,6,7,8,10,12,13,20,22,23,24,25,26,27',
    key: 'zobjDataSub.diaDiemText',
    label: 'Địa điểm (Tỉnh/ Thành phố)'
  },
  {
    kcht: '1,2,3,4,5,6,7,8,10,12,13,20,22,23,24,25,26,27',
    key: 'diaDiemChiTiet',
    label: 'Địa điểm chi tiết'
  },
  { kcht: '1', key: 'zobjDataSub.phanCapText', label: 'Phân cấp cảng biển' },
  {
    kcht: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28',
    key: 'updatedDate',
    label: 'Ngày cập nhật',
    type: 'dateTime'
  },
  {
    kcht: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28',
    key: 'updatedUser',
    label: 'Cán bộ cập nhật',
    type: 'maTen'
  },
  { kcht: '1', key: 'zobjDataSub.phamViVungNuocCangBien', label: 'Phạm vi vùng nước cảng biển' },
  { kcht: '1', key: 'zobjDataSub.tongSoBenCang', label: 'Tổng số bến cảng' },
  { kcht: '1', key: 'zobjDataSub.tongSoKhuNeoDauKhuChuyenTai', label: 'Tổng số khu neo đậu, khu chuyển tải' },
  { kcht: '1', key: 'zobjDataSub.tongSoTuyenLuongHangHaiCongCong', label: 'Tổng số tuyến luồng hàng hải công cộng' },
  { kcht: '1', key: 'zobjDataSub.tongSoTuyenLuongHangHaiChuyeDung', label: 'Tổng số tuyến luồng hàng hải chuyên dùng' },
  {
    kcht: '1',
    key: 'zobjDataSub.tongSoChieuDaiTuyenLuongHangHaiCongCong',
    label: 'Tổng số chiều dài tuyến luồng hàng hải công cộng (km)'
  },
  {
    kcht: '1',
    key: 'zobjDataSub.tongSochieuDaiTuyenLuongHangHaiChuyenDung',
    label: 'Tổng số chiều dài tuyến luồng hàng hải chuyên dùng (km)'
  },
  {
    kcht: '1',
    key: 'zobjDataSub.tongSoPhaoTieuBaoHieuHangHaiTrenLuong',
    label: 'Tổng số phao tiêu, báo hiệu hàng hải trên luồng'
  },
  { kcht: '1', key: 'zobjDataSub.tongSoDeKe', label: 'Tổng số đê, kè' },
  { kcht: '1', key: 'zobjDataSub.tongChieuDaiHeThongDeKe', label: 'Tổng chiều dài hệ thống đê, kè (km)' },
  { kcht: '1', key: 'zobjDataSub.tongSoDenBienDangTieuDocLap', label: 'Tổng số đèn biển, đăng, tiêu độc lập' },
  { kcht: '1', key: 'zobjDataSub.soLuongBenPhao', label: 'Số lượng bến phao' },
  { kcht: '1', key: 'zobjDataSub.soLuongKhuNeoDau', label: 'Số lượng khu neo đậu' },
  { kcht: '1', key: 'zobjDataSub.soLuongKhuChuyenTai', label: 'Số lượng khu chuyển tải' },
  { kcht: '1', key: 'zobjDataSub.cacKhuNuocVungNuocKhac', label: 'Các khu nước vùng nước khác' },
  {
    kcht: '1,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27',
    key: 'zobjDataSub.ghiChu',
    label: 'Ghi chú'
  },
  { kcht: '2,3,4,5,6,7,8,9,10,20,21', key: 'fkCangBien', label: 'Thuộc cảng biển', type: 'maTen' },
  { kcht: '2,3,4,5,7,10', key: 'fkLuongHh', label: 'Thuộc luồng hàng hải', type: 'maTen' },

  { kcht: '2,3', key: 'zobjDataSub.loaiKetCauText', label: 'Loại kết cấu cầu cảng' },
  { kcht: '2,3,6', key: 'zobjDataSub.congNangKhaiThacText', label: 'Công năng khai thác' },
  {
    kcht: '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28',
    key: 'zobjDataSub.tinhTrangText',
    label: 'Tình trạng'
  },
  {
    kcht: '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28',
    key: 'zobjDataSub.statusText',
    label: 'Trạng thái'
  },
  {
    kcht: '2,4,14',
    key: 'zobjDataSub.donViKhaiThac',
    label: 'Đơn vị khai thác',
    type: 'maTen'
  },

  {
    kcht: '10,13,15,16,17,18,19,22,23,24,25,26',
    key: 'fkDonViKt',
    label: 'Đơn vị khai thác',
    type: 'maTen'
  },
  { kcht: '2', key: 'zobjDataSub.tongDienTich', label: 'Tổng diện tích (ha)' },
  { kcht: '2,4', key: 'zobjDataSub.nangLucThongQuaThietKe', label: 'Năng lực thông qua thiết kế' },
  { kcht: '2', key: 'zobjDataSub.nangLucThongQuaHienTrang', label: 'Năng lực thông qua hiện trạng (tấn/ năm)' },
  {
    kcht: '2',
    key: 'zobjDataSub.coTauTiepNhanLonNhatTheoQuyHoach',
    label: 'Cỡ tàu tiếp nhận lớn nhất theo quy hoạch (DWT)'
  },
  { kcht: '2', key: 'zobjDataSub.quyHoachNangLucThongQua', label: 'Quy hoạch năng lực thông qua (tấn/ năm)' },
  {
    kcht: '2',
    key: 'zobjDataSub.sanLuongHangHoaThucTeThongQuaTrongNamGanNhat',
    label: 'Sản lượng hàng hóa thực tế thông qua trong năm gần nhất'
  },
  {
    kcht: '2,3,4',
    key: 'zobjDataSub.thoiDiemCongBoMoDuaVaoSuDung',
    label: 'Thời điểm công bố mở, đưa vào sử dụng',
    type: 'date'
  },
  {
    kcht: '5,6,7',
    key: 'zobjDataSub.thoiDiemCongBo',
    label: 'Thời điểm công bố mở, đưa vào sử dụng',
    type: 'date'
  },
  {
    kcht: '2,3,4',
    key: 'zobjDataSub.quyetDinhCongBoVanBanChoPhepKhaiThac',
    label: 'Quyết định công bố/ Văn bản cho phép khai thác'
  },
  {
    kcht: '5,6,7',
    key: 'zobjDataSub.quyetDinhVanBanChoPhepKhaiThac',
    label: 'Quyết định công bố/ Văn bản cho phép khai thác'
  },
  { kcht: '2,3,4', key: 'zobjDataSub.vanBanThoaThuanDauTuXayDung', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
  { kcht: '5,6,7', key: 'zobjDataSub.vanBanThoaThuan', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
  { kcht: '3', key: 'zobjDataSub.fkBenCang', label: 'Thuộc bến cảng', type: 'maTen' },

  { kcht: '3,4', key: 'zobjDataSub.phanCapText', label: 'Phân cấp công trình' },
  { kcht: '3', key: 'zobjDataSub.chieuDai', label: 'Chiều dài (m)' },
  { kcht: '3', key: 'zobjDataSub.chieuRong', label: 'Chiều rộng (m)' },
  {
    kcht: '3',
    key: 'zobjDataSub.thoiDiemPheDuyetQuyTrinhBaoTriCongTrinh',
    label: 'Thời điểm phê duyệt quy trình bảo trì công trình',
    type: 'date'
  },
  {
    kcht: '3',
    key: 'zobjDataSub.thoiDiemDuocChapThuanHoSoBaoCaoDanhGiaAnToanCongTrinh',
    label: 'Thời điểm được chấp thuận hồ sơ báo cáo đánh giá an toàn công trình (gần nhất)',
    type: 'date'
  },
  { kcht: '3', key: 'zobjDataSub.thoiDiemKiemDinhGanNhat', label: 'Thời điểm kiểm định gần nhất', type: 'date' },
  { kcht: '3', key: 'zobjDataSub.soLuongCauCangDangKhaiThac', label: 'Số lượng cầu cảng đang khai thác' },
  { kcht: '3', key: 'zobjDataSub.soLuongCauCangDaCongBo', label: 'Số lượng cầu cảng đã công bố' },
  {
    kcht: '3',
    key: 'zobjDataSub.soLuongCauCangDangDuocThoaThuanDauTuXayDung',
    label: 'Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng'
  },
  { kcht: '3,4', key: 'zobjDataSub.sanLuongHangThongQua', label: 'Sản lượng hàng thông qua' },
  {
    kcht: '3',
    key: 'zobjDataSub.tiepNhanTauCoTrongTaiLonHonThongSoTaiQuyetDinhCongBoText',
    label: 'Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố'
  },
  { kcht: '3', key: 'zobjDataSub.soVanBan', label: 'Số văn bản' },
  { kcht: '3', key: 'ngayVanBan', label: 'Ngày văn bản', type: 'date' },
  { kcht: '3,4', key: 'zobjDataSub.phamViKhuNuocNeoBuocTau', label: 'Phạm vi khu nước neo buộc tàu' },

  {
    kcht: '4,5,6,7',
    key: 'zobjDataSub.doSauKhuNuocHienTai',
    label: 'Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)'
  },
  { kcht: '4,5,6,7', key: 'zobjDataSub.caoDoDayBenThietKe', label: 'Cao độ đáy bến thiết kế' },
  { kcht: '4,6', key: 'zobjDataSub.coTauKhaiThacTheoCongBo', label: 'Cỡ tàu khai thác theo công bố (DWT)' },
  { kcht: '7', key: 'zobjDataSub.coTauKhaiThacTheoCongBoDwt', label: 'Cỡ tàu khai thác theo công bố (DWT)' },
  { kcht: '4', key: 'zobjDataSub.coTauKhaiThacTheoQuyHoach', label: 'Cỡ tàu khai thác theo quy hoạch' },
  {
    kcht: '4',
    key: 'zobjDataSub.thoiDiemDaDangKiemGanNhat',
    label: 'Thời điểm đã đăng kiểm gần nhất',
    type: 'monthYear'
  },
  { kcht: '4', key: 'zobjDataSub.thoiHanDangKiemTiepTheo', label: 'Thời hạn đăng kiểm tiếp theo', type: 'date' },
  { kcht: '4', key: 'zobjDataSub.thoiHanKhaiThac', label: 'Thời hạn khai thác', type: 'date' },
  { kcht: '4', key: 'zobjDataSub.soLuongBenPhaoDangKhaiThac', label: 'Số lượng bến phao đang khai thác' },
  { kcht: '4', key: 'zobjDataSub.soLuongBenPhaoDaCongBo', label: 'Số lượng bến phao đã công bố' },
  {
    kcht: '4',
    key: 'zobjDataSub.soLuongBenPhaoDangDuocThoanDauTuXayDung',
    label: 'Số lượng bến phao đang được thỏa thuận đầu tư xây dựng'
  },
  { kcht: '5,7', key: 'fkBenPhao', label: 'Thuộc bến phao', type: 'maTen' },

  { kcht: '28', key: 'zobjDataSub.phanLoaiText', label: 'Phân loại' },
  { kcht: '5', key: 'zobjDataSub.phanCapText', label: 'Phân loại' },
  { kcht: '5,6,7,9', key: 'zobjDataSub.hinhDang', label: 'Hình dạng' },
  { kcht: '5,6,7', key: 'zobjDataSub.dienTich', label: 'Diện tích (ha)' },
  {
    kcht: '5',
    key: 'zobjDataSub.soLuongKhuTranhTruBaoDangKhaiThac',
    label: 'Số lượng khu tránh, trú bão đang khai thác'
  },
  { kcht: '5', key: 'zobjDataSub.soLuongKhuTranhTruBaoDaCongBo', label: 'Số lượng khu tránh, trú bão đã công bố' },
  {
    kcht: '5',
    key: 'zobjDataSub.soLuongKhuTranhTruBaoDangThoaThuan',
    label: 'Số lượng khu tránh, trú bão đang được thỏa thuận đầu tư xây dựng'
  },

  { kcht: '6,7', key: 'zobjDataSub.doSauKhuNuocTheoThietKe', label: 'Độ sâu khu nước theo thiết kế (m)' },
  { kcht: '6', key: 'zobjDataSub.soLuongKhuChuyenTaiDangKhaiThac', label: 'Số lượng khu chuyển tải đang khai thác' },
  { kcht: '6', key: 'zobjDataSub.soLuongKhuChuyenTaiDaCongBo', label: 'Số lượng khu chuyển tải đã công bố' },
  {
    kcht: '6',
    key: 'zobjDataSub.soLuongKhuChuyenTaiDangThoaThuan',
    label: 'Số lượng khu chuyển tải đang được thỏa thuận đầu tư xây dựng'
  },
  { kcht: '6', key: 'zobjDataSub.thoiGianHoatDongTuNgay', label: 'Thời gian hoạt động (Từ ngày)', type: 'date' },
  { kcht: '6', key: 'zobjDataSub.thoiGianHoatDongDenNgay', label: 'Thời gian hoạt động (Đến ngày)', type: 'date' },

  { kcht: '7', key: 'zobjDataSub.soLuongKhuNeoDauDangKhaiThac', label: 'Số lượng khu neo đậu đang khai thác' },
  { kcht: '7', key: 'zobjDataSub.soLuongKhuNeoDauDaCongBo', label: 'Số lượng khu neo đậu đã công bố' },
  {
    kcht: '7',
    key: 'zobjDataSub.soLuongKhuNeoDauDangThoaThuan',
    label: 'Số lượng khu neo đậu đang được thỏa thuận đầu tư xây dựng'
  },
  { kcht: '8', key: 'fkCauCang', label: 'Thuộc cầu cảng', type: 'maTen' },

  { kcht: '8', key: 'zobjDataSub.congNangSuDungText', label: 'Công năng sử dụng' },
  { kcht: '8', key: 'zobjDataSub.dienTichNhaXuongKhoBai', label: 'Diện tích nhà xưởng, kho bãi' },
  { kcht: '8', key: 'zobjDataSub.loaiTauDongMoiSuaChuaText', label: 'Loại tàu đóng mới, sửa chữa' },
  { kcht: '8', key: 'zobjDataSub.coTau', label: 'Cỡ tàu' },
  { kcht: '8', key: 'zobjDataSub.loaiHinhDoanhNghiepText', label: 'Loại hình doanh nghiệp' },
  { kcht: '8', key: 'zobjDataSub.hoatDongText', label: 'Hoạt động' },
  { kcht: '8', key: 'zobjDataSub.soLuongTrienDa', label: 'Số lượng triền đà' },
  { kcht: '9,11,20', key: 'fkDonViVh', label: 'Đơn vị vận hành', type: 'maTen' },

  { kcht: '9', key: 'chungLoaiDenChinh', label: 'Chủng loại đèn chính' },
  { kcht: '9', key: 'chungLoaiDenDuPhong', label: 'Chủng loại đèn dự phòng' },
  { kcht: '9,28', key: 'ngayBd', label: 'Thời điểm đưa vào sử dụng', type: 'date' },
  { kcht: '9,28', key: 'ngaySc', label: 'Thời điểm sửa chữa gần nhất', type: 'date' },
  { kcht: '9', key: 'zobjDataSub.capTramDenText', label: 'Cấp trạm đèn' },
  { kcht: '9', key: 'zobjDataSub.diaBan', label: 'Địa bàn' },
  { kcht: '9', key: 'zobjDataSub.diaDiemDatTramDen', label: 'Địa điểm đặt trạm đèn' },
  { kcht: '9', key: 'zobjDataSub.dacDiemNhanDang', label: 'Đặc điểm nhận dạng' },
  { kcht: '9,28', key: 'zobjDataSub.ketCau', label: 'Kết cấu' },
  { kcht: '9,28', key: 'zobjDataSub.dienTich', label: 'Diện tích (m2)' },
  { kcht: '9', key: 'zobjDataSub.chieuCaoThapDen', label: 'Chiều cao tháp đèn (m)' },
  { kcht: '9', key: 'zobjDataSub.chieuCaoTamSang', label: 'Chiều cao tâm sáng (hải đồ) (m)' },
  { kcht: '28', key: 'zobjDataSub.chieuCaoTamSang', label: 'Chiều cao tâm sáng (hải đồ)' },
  { kcht: '9', key: 'zobjDataSub.tamHieuLucDiaLy', label: 'Tầm hiệu lực địa lý' },
  { kcht: '9', key: 'zobjDataSub.tamHieuLucAnhSang', label: 'Tầm hiệu lực ánh sáng' },
  { kcht: '9,28', key: 'zobjDataSub.mauSacBenNgoaiCuaThapDen', label: 'Màu sắc bên ngoài của tháp đèn' },
  { kcht: '9,28', key: 'zobjDataSub.nguonCungCapNangLuongChoDen', label: 'Nguồn cung cấp năng lượng cho đèn' },
  { kcht: '9,10', key: 'zobjDataSub.soLuongNhanSuBoTri', label: 'Số lượng nhân sự bố trí' },
  { kcht: '9', key: 'zobjDataSub.dienTichSuDungTram', label: 'Diện tích sử dụng trạm đèn (m2)' },
  { kcht: '10', key: 'fkLuongHhTuyen', label: 'Tuyến luồng hàng hải' },

  { kcht: '20', key: 'ngayBd', label: 'Thời điểm xây dựng', type: 'date' },
  { kcht: '10', key: 'zobjDataSub.thoiDiemXayDung', label: 'Thời điểm xây dựng', type: 'date' },
  { kcht: '10', key: 'zobjDataSub.tongDienTich', label: 'Tổng diện tích (m2)' },
  { kcht: '10', key: 'dienTichSuDung', label: 'Diện tích sử dụng (m2)' },
  { kcht: '10,20', key: 'zobjDataSub.namBaoTriGanNhat', label: 'Năm bảo trì gần nhất' },
  { kcht: '28', key: 'fkNhaTram', label: 'Thuộc nhà trạm quản lý vận hành phao, tiêu', type: 'maTen' }, // map lại
  { kcht: '28', key: 'zobjDataSub.phanLoaiPhaoText', label: 'Phân loại phao' },
  { kcht: '28', key: 'zobjDataSub.phanLoaiTieuText', label: 'Phân loại tiêu' },

  { kcht: '28', key: 'zobjDataSub.hinhDang', label: 'Hình dáng' },
  { kcht: '28', key: 'zobjDataSub.chieuCaoThanPhao', label: 'Chiều cao thân phao (m)' },
  { kcht: '28', key: 'zobjDataSub.denBienText', label: 'Đèn biển' },
  { kcht: '28', key: 'zobjDataSub.chieuCaoThapDen', label: 'Chiều cao tháp đèn' },
  // { kcht: '10', key: 'chungLoaiDen', label: 'Chủng loại đèn' },
  { kcht: '28', key: 'zobjDataSub.phamViChieuSang', label: 'Phạm vi chiếu sáng' },
  { kcht: '28', key: 'mauSac', label: 'Màu sắc' },
  { kcht: '28', key: 'kieuChop', label: 'Kiểu chớp' },
  { kcht: '11', key: 'fkDonViKt', label: 'Đơn vị chủ quản', type: 'maTen' }, // map lại

  { kcht: '11', key: 'ngayBd', label: 'Thời gian bắt dầu hoạt động', type: 'date' }, // format
  { kcht: '11', key: 'zobjDataSub.phamViApDung', label: 'Phạm vi áp dụng' },
  { kcht: '11', key: 'zobjDataSub.thongBaoHangHai', label: 'Thông báo hàng hải' },
  { kcht: '12,13', key: 'fkHtVts', label: 'Thuộc hệ thống VTS', type: 'maTen' }, // map lại ma-ten

  { kcht: '12,22,23,24,25', key: 'zobjDataSub.vungPhuSong', label: 'Vùng phủ sóng' },
  { kcht: '13,14,15,16,17,18', key: 'fkTtDhVts', label: 'Thuộc trung tâm điều hành VTS', type: 'maTen' }, // map lại ma-ten

  { kcht: '13,14,15,16,17,18,19', key: 'zobjDataSub.donViTinhText', label: 'Đơn vị tính' },
  { kcht: '13,14,15,16,17,18,19', key: 'soLuong', label: 'Số lượng' },
  { kcht: '13', key: 'zobjDataSub.chieuCaoThapRadar', label: 'Chiều cao tháp radar' },
  { kcht: '13', key: 'zobjDataSub.tamHieuLucRadar', label: 'Tầm hiệu lực tháp radar' },

  { kcht: '14,15,16,17,18,19', key: 'namDuaVaoSuDung', label: 'Năm đưa vào sử dụng' },
  { kcht: '14,15,17,16,18,19', key: 'model', label: 'Model' },
  { kcht: '14,15,16,17,18,19', key: 'zobjDataSub.thongSoKyThuat', label: 'Thông số kỹ thuật' },
  { kcht: '14,15,16,17,18,19', key: 'hangSanXuat', label: 'Hãng sản xuất' },
  { kcht: '14,15,16,17,18,19', key: 'zobjDataSub.thongTinBaoTri', label: 'Thông tin bảo trì' },
  // { kcht: '16', key: 'benPhao', label: 'Ngày gửi phê duyệt' },
  // { kcht: '16', key: 'benPhao', label: 'Cán bộ gửi phê duyệt' },
  // { kcht: '16', key: 'benPhao', label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục' },
  // { kcht: '16', key: 'benPhao', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục' },
  // { kcht: '16', key: 'benPhao', label: 'Ngày phê duyệt cấp Cục' },
  // { kcht: '16', key: 'benPhao', label: 'Cán bộ phê duyệt cấp Cục' },

  { kcht: '20', key: 'zobjDataSub.loaiKetCauCongTrinhText', label: 'Loại kết cấu công trình' },
  { kcht: '20', key: 'namDuaVaoSuDung', label: 'Thời điểm đưa vào khai thác' },
  { kcht: '20', key: 'zobjDataSub.chieuDai', label: 'Chiều dài' },
  { kcht: '20', key: 'zobjDataSub.chieuCao', label: 'Chiều cao' },
  { kcht: '20', key: 'zobjDataSub.caoTrinhDinh', label: 'Cao trình đỉnh' },

  { kcht: '21', key: 'zobjDataSub.tramQuanLyLuong', label: 'Trạm quản lý luồng' },
  { kcht: '21', key: 'zobjDataSub.soLuongTram', label: 'Số lượng trạm' },
  { kcht: '21', key: 'zobjDataSub.dienTich', label: 'Diện tích trạm (m2)' },
  {
    kcht: '21',
    key: 'zobjDataSub.thoiDiemSuaChuaTramGanNhat',
    label: 'Thời điểm sửa chữa trạm gần nhất',
    type: 'monthYear'
  },
  { kcht: '21', key: 'zobjDataSub.soLuongNhanSuTaiTram', label: 'Số lượng nhân sự tại trạm' },
  { kcht: '21,27', key: 'zobjDataSub.quyetDinhCongBoSo', label: 'Quyết định công bố số' },
  { kcht: '21,27', key: 'zobjDataSub.ngayRaQuyetDinhCongBo', label: 'Ngày ra quyết định công bố', type: 'date' }, // format
  { kcht: '21,27', key: 'zobjDataSub.donViRaQuyetDinhCongBo', label: 'Đơn vị ra quyết định công bố' },
  { kcht: '22', key: 'zobjDataSub.phanLoaiDaiText', label: 'Phân loại đài' },

  { kcht: '22,23,24,25,26', key: 'zobjDataSub.dichVuCungCapText', label: 'Dịch vụ cung cấp' },
  { kcht: '23,24', key: 'tanSoLienLac', label: 'Tần số liên lạc' },

  { kcht: '27', key: 'zobjDataSub.congSuatKhaiThac', label: 'Công suất khai thác' },
  { kcht: '27', key: 'zobjDataSub.tongDienTichCang', label: 'Tổng diện tích cảng (m2)' },
  { kcht: '27', key: 'zobjDataSub.dienTichKho', label: 'Diện tích kho (m2)' },
  { kcht: '27', key: 'zobjDataSub.dienTichBai', label: 'Diện tích bãi (m2)' },
  { kcht: '27', key: 'zobjDataSub.phuongThucKetNoiGiaoThongVoiCang', label: 'Phương thức kết nối giao thông với cảng' },
  { kcht: '28', key: 'zobjDataSub.duongKinhPhao', label: 'Đường kính phao (m)' }, // map
  { kcht: '28', key: 'zobjDataSub.chungLoaiDen', label: 'Chủng loại đèn (Thiết bị báo hiệu)' }, // map
  { kcht: '28', key: 'zobjDataSub.chuKy', label: 'Chu kỳ' } // map
] as const;

export type VmdPopupField = {
  key: string;
  label: string;
  type?: 'date' | 'dateTime' | 'maTen' | 'monthYear';
};

const VMD_TYPE_ID_BY_INFRASTRUCTURE_TYPE: Record<string, string> = {
  SEAPORT: '1',
  PORT_TERMINAL: '2',
  PIER: '3',
  BUOY_BERTH: '4',
  STORM_SHELTER_AREA: '5',
  TRANSSHIPMENT_AREA: '6',
  ANCHORAGE_AREA: '7',
  SHIP_REPAIR_FACILITY: '8',
  SHIP_REPAIR_YARD: '8',
  LIGHTHOUSE: '9',
  BUOY_STATION: '10',
  VTS_SYSTEM: '11',
  VTS_OPERATION_CENTER: '12',
  RADAR_STATION: '13',
  RADAR_STATION_LEGACY: '13',
  AIS_SYSTEM: '14',
  CCTV: '15',
  SCADA: '16',
  TRANSMISSION: '18',
  VTS_ASSIST: '19',
  DIKE_REVETMENT: '20',
  NAVIGATION_CHANNEL: '21',
  DAI_TTDH: '22',
  COASTAL_RADIO_STATION: '22',
  INMARSAT_STATION: '23',
  COSPAS_SARSAT_STATION: '24',
  LRIT_STATION: '25',
  HANOI_STATION: '26',
  DRY_PORT: '27',
  BUOY: '28',
};

export const getVmdPopupFields = (infrastructureType: string): VmdPopupField[] => {
  const legacyTypeId = VMD_TYPE_ID_BY_INFRASTRUCTURE_TYPE[infrastructureType];
  if (!legacyTypeId) return [];
  return VMD_POPUP_ROWS.filter((row) => row.kcht.split(',').map((item) => item.trim()).includes(legacyTypeId));
};

export const getOrderedKeysAndLabels = (type: string): { key: string; label: string }[] => {
  const normType = type.trim();

  if (normType === 'Cảng biển') {
    return [
      { key: 'portCode', label: 'Mã cảng biển' },
      { key: 'portName', label: 'Tên cảng biển' },
      { key: 'portGroup', label: 'Nhóm cảng biển' },
      { key: 'province', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'area', label: 'Diện tích (ha)' },
      { key: 'maxVesselCapacity', label: 'Khả năng tiếp nhận tàu lớn nhất' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' },
      { key: 'waterAreaScope', label: 'Phạm vi vùng nước' },
      { key: 'totalBerths', label: 'Tổng số bến cảng' },
      { key: 'totalAnchoragesTransshipment', label: 'Tổng số khu neo đậu, chuyển tải' },
      { key: 'totalPublicChannels', label: 'Tổng số tuyến luồng hàng hải công cộng' },
      { key: 'totalDedicatedChannels', label: 'Tổng số tuyến luồng hàng hải chuyên dùng' },
      { key: 'totalPublicChannelLength', label: 'Tổng chiều dài tuyến luồng hàng hải công cộng (km)' },
      { key: 'totalDedicatedChannelLength', label: 'Tổng số chiều dài tuyến luồng hàng hải chuyên dùng (km)' },
      { key: 'totalBuoysBeacons', label: 'Tổng số phao tiêu, báo hiệu hàng hải trên luồng' },
      { key: 'totalDikes', label: 'Tổng số đê, kè' },
      { key: 'totalDikeLength', label: 'Tổng chiều dài hệ thống đê, kè (km)' },
      { key: 'totalLighthouses', label: 'Tổng số đèn biển, đăng tiêu độc lập' },
      { key: 'buoyBerthCount', label: 'Số lượng bến phao' },
      { key: 'anchorageCount', label: 'Số lượng khu neo đậu' },
      { key: 'transshipmentCount', label: 'Số lượng khu chuyển tải' },
      { key: 'otherWaterAreas', label: 'Các khu nước vùng nước khác' },
      { key: 'remarks', label: 'Ghi chú' }
    ];
  }

  if (normType === 'Bến cảng') {
    return [
      { key: 'berthCode', label: 'Mã bến cảng' },
      { key: 'berthName', label: 'Tên bến cảng' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'provinceId', label: 'Địa điểm (Tỉnh/Thành phố)' },
      { key: 'detailedLocation', label: 'Địa điểm chi tiết' },
      { key: 'updatedAt', label: 'Ngày cập nhật' },
      { key: 'updatedBy', label: 'Cán bộ cập nhật' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'waterway', label: 'Thuộc luồng hàng hải' },
      { key: 'structureType', label: 'Loại kết cấu cầu cảng' },
      { key: 'operationalFunction', label: 'Công năng khai thác' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'operator', label: 'Đơn vị khai thác' },
      { key: 'totalArea', label: 'Tổng diện tích (ha)' },
      { key: 'designThroughput', label: 'Năng lực thông qua thiết kế' },
      { key: 'currentThroughput', label: 'Năng lực thông qua hiện trạng (tấn/năm)' },
      { key: 'maxVesselSize', label: 'Cỡ tàu tiếp nhận lớn nhất theo quy hoạch (DWT)' },
      { key: 'plannedThroughput', label: 'Quy hoạch năng lực thông qua (tấn/năm)' },
      { key: 'latestCargoVolume', label: 'Sản lượng hàng hóa thực tế thông qua trong năm gần nhất' },
      { key: 'openingAnnouncementDate', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'openingDecision', label: 'Quyết định công bố/ Văn bản cho phép khai thác' },
      { key: 'investmentAgreement', label: 'Văn bản thỏa thuận đầu tư xây dựng' }
    ];
  }

  if (normType === 'Cầu cảng') {
    return [
      { key: 'pierCode', label: 'Mã cầu cảng' },
      { key: 'pierName', label: 'Tên cầu cảng' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'location', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'diaDiemChiTiet', label: 'Địa điểm chi tiết' },
      { key: 'ngayCapNhat', label: 'Ngày cập nhật' },
      { key: 'canBoCapNhat', label: 'Cán bộ cập nhật' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'navigationChannelId', label: 'Thuộc luồng hàng hải' },
      { key: 'structureType', label: 'Loại kết cấu cầu cảng' },
      { key: 'operationalCapacity', label: 'Công năng khai thác' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'thoiDiemCongBoMo', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'quyetDinhCongBo', label: 'Quyết định công bố/ Văn bản cho phép khai thác' },
      { key: 'vanBanThoaThuanDauTu', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
      { key: 'berthId', label: 'Thuộc bến cảng' },
      { key: 'phanCap', label: 'Phân cấp công trình' },
      { key: 'length', label: 'Chiều dài (m)' },
      { key: 'width', label: 'Chiều rộng (m)' },
      { key: 'thoiDiemPheDuyetQuyTrinhBaoTriCongTrinh', label: 'Thời điểm phê duyệt quy trình bảo trì công trình' },
      { key: 'thoiDiemDuocChapThuanHoSoBaoCaoDanhGiaAnToanCongTrinh', label: 'Thời điểm được chấp thuận hồ sơ báo cáo đánh giá an toàn công trình (gần nhất)' },
      { key: 'thoiDiemKiemDinhGanNhat', label: 'Thời điểm kiểm định gần nhất' },
      { key: 'quantityCauCangDangKhaiThac', label: 'Số lượng cầu cảng đang khai thác' },
      { key: 'quantityCauCangDaCongBo', label: 'Số lượng cầu cảng đã công bố' },
      { key: 'quantityCauCangDangDuocThoaThuanDauTuXayDung', label: 'Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng' },
      { key: 'sanLuongHangThongQua', label: 'Sản lượng hàng thông qua' },
      { key: 'tiepNhanTauCoTrongTaiLonHonThongSoTaiQuyetDinhCongBo', label: 'Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố' },
      { key: 'soVanBan', label: 'Số văn bản' },
      { key: 'ngayVanBan', label: 'Ngày văn bản' },
      { key: 'phamViKhuNuocNeoBuocTau', label: 'Phạm vi khu nước neo buộc tàu' }
    ];
  }

  if (normType === 'Cảng cạn') {
    return [
      { key: 'dryPortCode', label: 'Mã cảng cạn' },
      { key: 'dryPortName', label: 'Tên cảng cạn' },
      { key: 'viTri', label: 'Vị trí' },
      { key: 'dienTichDat', label: 'Diện tích đất (ha)' },
      { key: 'dienTichNuoc', label: 'Diện tích nước (ha)' },
      { key: 'nangLucThongQua', label: 'Năng lực thông qua' },
      { key: 'congSuatTEU', label: 'Công suất (TEU)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Khu neo đậu') {
    return [
      { key: 'anchorageCode', label: 'Mã khu neo đậu' },
      { key: 'anchorageName', label: 'Tên khu neo đậu' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'provinceId', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'detailedLocation', label: 'Địa điểm chi tiết' },
      { key: 'updatedAt', label: 'Ngày cập nhật' },
      { key: 'updatedBy', label: 'Cán bộ cập nhật' },
      { key: 'remarks', label: 'Ghi chú' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'waterway', label: 'Thuộc luồng hàng hải' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'openingAnnouncementDate', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'publicDecision', label: 'Quyết định công bố/ Văn bản cho phép khai thác' },
      { key: 'investmentAgreement', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
      { key: 'currentWaterDepth', label: 'Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)' },
      { key: 'bottomElevationDesign', label: 'Cao độ đáy bến thiết kế' },
      { key: 'maxVesselDWT', label: 'Cỡ tàu khai thác theo công bố (DWT)' },
      { key: 'buoyStationId', label: 'Thuộc bến phao' },
      { key: 'shapeDescription', label: 'Hình dạng' },
      { key: 'area', label: 'Diện tích (ha)' },
      { key: 'designWaterDepth', label: 'Độ sâu khu nước theo thiết kế (m)' },
      { key: 'activeAnchorageCount', label: 'Số lượng khu neo đậu đang khai thác' },
      { key: 'publishedAnchorageCount', label: 'Số lượng khu neo đậu đã công bố' },
      { key: 'underInvestmentAnchorageCount', label: 'Số lượng khu neo đậu đang được thỏa thuận đầu tư xây dựng' },
    ];
  }

  if (normType === 'Khu chuyển tải') {
    return [
      { key: 'transferAreaCode', label: 'Mã khu chuyển tải' },
      { key: 'transferAreaName', label: 'Tên khu chuyển tải' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'provinceId', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'detailedLocation', label: 'Địa điểm chi tiết' },
      { key: 'updatedAt', label: 'Ngày cập nhật' },
      { key: 'updatedBy', label: 'Cán bộ cập nhật' },
      { key: 'remarks', label: 'Ghi chú' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'operationalFunction', label: 'Công năng khai thác' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'openingAnnouncementDate', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'publicDecision', label: 'Quyết định công bố/ Văn bản cho phép khai thác' },
      { key: 'investmentAgreement', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
      { key: 'currentWaterDepth', label: 'Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)' },
      { key: 'bottomElevationDesign', label: 'Cao độ đáy bến thiết kế' },
      { key: 'shapeDescription', label: 'Hình dạng' },
      { key: 'area', label: 'Diện tích (ha)' },
      { key: 'designWaterDepth', label: 'Độ sâu khu nước theo thiết kế (m)' },
      { key: 'activeTransferAreaCount', label: 'Số lượng khu chuyển tải đang khai thác' },
      { key: 'publishedTransferAreaCount', label: 'Số lượng khu chuyển tải đã công bố' },
      { key: 'underInvestmentTransferAreaCount', label: 'Số lượng khu chuyển tải đang được thỏa thuận đầu tư xây dựng' },
    ];
  }

  if (normType === 'Khu tránh trú bão' || normType === 'Khu tránh, trú bão') {
    return [
      { key: 'stormShelterCode', label: 'Mã khu tránh, trú bão' },
      { key: 'stormShelterName', label: 'Tên khu tránh, trú bão' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'provinceId', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'detailedLocation', label: 'Địa điểm chi tiết' },
      { key: 'updatedAt', label: 'Ngày cập nhật' },
      { key: 'updatedBy', label: 'Cán bộ cập nhật' },
      { key: 'remarks', label: 'Ghi chú' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'waterway', label: 'Thuộc luồng hàng hải' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'openingAnnouncementDate', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'publicDecision', label: 'Quyết định công bố/ Văn bản cho phép khai thác' },
      { key: 'investmentAgreement', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
      { key: 'currentWaterDepth', label: 'Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)' },
      { key: 'bottomElevationDesign', label: 'Cao độ đáy bến thiết kế' },
      { key: 'buoyStationId', label: 'Thuộc bến phao' },
      { key: 'shapeDescription', label: 'Hình dạng' },
      { key: 'area', label: 'Diện tích (ha)' },
      { key: 'activeStormShelterCount', label: 'Số lượng khu tránh trú bão đang khai thác' },
      { key: 'publishedStormShelterCount', label: 'Số lượng khu tránh trú bão đã công bố' },
      { key: 'underInvestmentStormShelterCount', label: 'Số lượng khu tránh trú bão đang được thỏa thuận đầu tư xây dựng' },
    ];
  }

  if (normType === 'Bến phao') {
    return [
      { key: 'buoyBerthCode', label: 'Mã bến phao' },
      { key: 'buoyBerthName', label: 'Tên bến phao' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'provinceId', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'detailedLocation', label: 'Địa điểm chi tiết' },
      { key: 'updatedAt', label: 'Ngày cập nhật' },
      { key: 'updatedBy', label: 'Cán bộ cập nhật' },
      { key: 'remarks', label: 'Ghi chú' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'waterway', label: 'Thuộc luồng hàng hải' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'openingAnnouncementDate', label: 'Thời điểm công bố mở, đưa vào sử dụng' },
      { key: 'publicDecision', label: 'Quyết định công bố/ Văn bản cho phép khai thác' },
      { key: 'investmentAgreement', label: 'Văn bản thỏa thuận đầu tư xây dựng' },
      { key: 'constructionGrade', label: 'Phân cấp công trình' },
      { key: 'designThroughput', label: 'Năng lực thông qua thiết kế' },
      { key: 'maxVesselCapacity', label: 'Cỡ tàu lớn nhất' },
      { key: 'bottomElevationDesign', label: 'Cao độ đáy bến thiết kế' },
      { key: 'currentWaterDepth', label: 'Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)' },
      { key: 'activeBuoyBerthCount', label: 'Số lượng bến phao đang khai thác' },
      { key: 'publishedBuoyBerthCount', label: 'Số lượng bến phao đã công bố' },
      { key: 'underInvestmentBuoyBerthCount', label: 'Số lượng bến phao đang được thỏa thuận đầu tư xây dựng' },
    ];
  }

  if (normType === 'Vùng nước') {
    return [
      { key: 'waterZoneCode', label: 'Mã vùng nước' },
      { key: 'waterZoneName', label: 'Tên vùng nước' },
      { key: 'loaiVungNuoc', label: 'Loại vùng nước' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'chieuDaiVungNuoc', label: 'Chiều dài vùng nước (m)' },
      { key: 'chieuRongVungNuoc', label: 'Chiều rộng vùng nước (m)' },
      { key: 'doSauVungNuoc', label: 'Độ sâu vùng nước (m)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Đèn biển') {
    return [
      { key: 'code', label: 'Mã đèn biển' },
      { key: 'name', label: 'Tên đèn biển' },
      { key: 'type', label: 'Loại đèn biển' },
      { key: 'lightRange', label: 'Tầm hiệu lực (hải lý)' },
      { key: 'lightColor', label: 'Màu sắc ánh sáng' },
      { key: 'lightCharacteristic', label: 'Đặc tính ánh sáng' },
      { key: 'description', label: 'Mô tả vị trí' },
      { key: 'unitId', label: 'Đơn vị quản lý' },
      { key: 'isActive', label: 'Trạng thái hoạt động' },
      { key: 'status', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Phao tiêu') {
    return [
      { key: 'code', label: 'Mã phao, tiêu' },
      { key: 'name', label: 'Tên phao, tiêu' },
      { key: 'unitId', label: 'Đơn vị quản lý' },
      { key: 'updatedAt', label: 'Ngày cập nhật' },
      { key: 'updatedBy', label: 'Cán bộ cập nhật' },
      { key: 'condition', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'classification', label: 'Phân loại' },
      { key: 'commissionedDate', label: 'Thời điểm đưa vào sử dụng' },
      { key: 'lastRepairDate', label: 'Thời điểm sửa chữa gần nhất' },
      { key: 'structure', label: 'Kết cấu' },
      { key: 'area', label: 'Diện tích (m2)' },
      { key: 'lightHeight', label: 'Chiều cao tâm sáng (hải đồ)' },
      { key: 'towerColor', label: 'Màu sắc bên ngoài của tháp đèn' },
      { key: 'powerSupply', label: 'Nguồn cung cấp năng lượng cho đèn' },
      { key: 'buoyStationId', label: 'Thuộc nhà trạm quản lý vận hành phao, tiêu' },
      { key: 'classificationBuoy', label: 'Phân loại phao' },
      { key: 'classificationMark', label: 'Phân loại tiêu' },
      { key: 'shape', label: 'Hình dáng' },
      { key: 'bodyHeight', label: 'Chiều cao thân phao (m)' },
      { key: 'beaconLight', label: 'Đèn biển' },
      { key: 'towerHeight', label: 'Chiều cao tháp đèn' },
      { key: 'range', label: 'Phạm vi chiếu sáng' },
      { key: 'lightColor', label: 'Màu sắc' },
      { key: 'flashType', label: 'Kiểu chớp' },
      { key: 'diameter', label: 'Đường kính phao (m)' },
      { key: 'lightModel', label: 'Chủng loại đèn (Thiết bị báo hiệu)' },
      { key: 'period', label: 'Chu kỳ' }
    ];
  }

  if (normType === 'Đê kè') {
    return [
      { key: 'maDeKe', label: 'Mã đê kè' },
      { key: 'tenDeKe', label: 'Tên đê kè' },
      { key: 'loaiDe', label: 'Loại đê/kè' },
      { key: 'ketCau', label: 'Kết cấu đê/kè' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Luồng hàng hải') {
    return [
      { key: 'maLuong', label: 'Mã luồng hàng hải' },
      { key: 'tenLuong', label: 'Tên luồng hàng hải' },
      { key: 'chieuDaiLuong', label: 'Chiều dài luồng (km)' },
      { key: 'doSauThietKe', label: 'Độ sâu thiết kế (m)' },
      { key: 'chieuRongThietKe', label: 'Chiều rộng thiết kế (m)' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Trạm radar') {
    return [
      { key: 'maTram', label: 'Mã trạm' },
      { key: 'tenTram', label: 'Tên trạm radar' },
      { key: 'radarModel', label: 'Model radar' },
      { key: 'frequencyBand', label: 'Băng tần' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'operationalStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'loaiHinhHoc', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Hệ thống VTS') {
    return [
      { key: 'code', label: 'Mã hệ thống' },
      { key: 'systemName', label: 'Tên hệ thống VTS' },
      { key: 'scope', label: 'Phạm vi hoạt động' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'conditionStatus', label: 'Trạng thái hoạt động' },
      { key: 'approvalStatus', label: 'Trạng thái phê duyệt' },
      { key: 'geometryType', label: 'Loại hình học' }
    ];
  }

  if (normType === 'Cơ sở sửa chữa' || normType === 'Cơ sở sửa chữa/đóng tàu') {
    return [
      { key: 'maCoSo', label: 'Mã cơ sở sửa chữa, đóng tàu' },
      { key: 'facilityName', label: 'Tên cơ sở sửa chữa, đóng tàu' },
      { key: 'orgUnitId', label: 'Đơn vị quản lý' },
      { key: 'province', label: 'Địa điểm (Tỉnh/ Thành phố)' },
      { key: 'address', label: 'Địa điểm chi tiết' },
      { key: 'updatedDate', label: 'Ngày cập nhật' },
      { key: 'updatedBy', label: 'Cán bộ cập nhật' },
      { key: 'remarks', label: 'Ghi chú' },
      { key: 'portId', label: 'Thuộc cảng biển' },
      { key: 'operationalStatus', label: 'Tình trạng' },
      { key: 'approvalStatus', label: 'Trạng thái' },
      { key: 'cauCangId', label: 'Thuộc cầu cảng' },
      { key: 'congNangSuDung', label: 'Công năng sử dụng' },
      { key: 'dienTichNhaXuongKhoBai', label: 'Diện tích nhà xưởng, kho bãi' },
      { key: 'loaiTauDongMoiSuaChua', label: 'Loại tàu đóng mới, sửa chữa' },
      { key: 'coTau', label: 'Cỡ tàu' },
      { key: 'loaiHinhDoanhNghiep', label: 'Loại hình doanh nghiệp' },
      { key: 'hoatDong', label: 'Hoạt động' },
      { key: 'quantityTrienDa', label: 'Số lượng triền đà' }
    ];
  }

  return [];
};

export const normalizePopupLabel = (label: string) => label
  .toLocaleLowerCase('vi')
  .replace(/\s*\/\s*/g, '/')
  .replace(/\s+/g, ' ')
  .trim();

export const getPopupValueByPath = (data: Record<string, unknown>, path: string): unknown => {
  const directValue = path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, data);
  if (directValue !== undefined && directValue !== null) return directValue;
  if (!path.includes('.')) {
    const legacyDetails = data.zobjDataSub;
    if (legacyDetails && typeof legacyDetails === 'object') {
      return (legacyDetails as Record<string, unknown>)[path];
    }
  }
  return undefined;
};

const SPECIFIC_LABEL_KEYS: Record<string, string[]> = {
  'ma khu neo dau': ['anchorageCode', 'code'],
  'ten khu neo dau': ['anchorageName', 'name'],
  'ma khu chuyen tai': ['transferAreaCode', 'code'],
  'ten khu chuyen tai': ['transferAreaName', 'name'],
  'ma khu tranh, tru bao': ['stormShelterCode', 'code'],
  'ma khu tranh tru bao': ['stormShelterCode', 'code'],
  'ten khu tranh, tru bao': ['stormShelterName', 'name'],
  'ten khu tranh tru bao': ['stormShelterName', 'name'],
  'ma ben phao': ['buoyBerthCode', 'code'],
  'ten ben phao': ['buoyBerthName', 'name'],
  'ma cau cang': ['pierCode', 'code'],
  'ten cau cang': ['pierName', 'name'],
  'ma ben cang': ['berthCode', 'code'],
  'ten ben cang': ['berthName', 'name'],
  'ma cang bien': ['portCode', 'code'],
  'ten cang bien': ['portName', 'name'],
  'ma cang can': ['dryPortCode', 'code'],
  'ten cang can': ['dryPortName', 'name'],
  'ma vung nuoc': ['waterZoneCode', 'code'],
  'ten vung nuoc': ['waterZoneName', 'name'],
  'ma den bien': ['beaconCode', 'code'],
  'ten den bien': ['beaconName', 'name'],
  'ma phao, tieu': ['buoyCode', 'code'],
  'ma phao tieu': ['buoyCode', 'code'],
  'ten phao, tieu': ['buoyName', 'name'],
  'ten phao tieu': ['buoyName', 'name'],
  'ma he thong vts': ['systemCode', 'code'],
  'ten he thong vts': ['systemName', 'name'],
  'ma co so sua chua, dong tau': ['facilityCode', 'code'],
  'ma co so sua chua dong tau': ['facilityCode', 'code'],
  'ten co so sua chua, dong tau': ['shipRepairYardName', 'facilityName', 'name'],
  'ten co so sua chua dong tau': ['shipRepairYardName', 'facilityName', 'name'],
  'thuoc cang bien': ['portName', 'tenCangBien', 'portId'],
  'thuoc ben cang': ['berthName', 'tenBenCang', 'berthId'],
  'thuoc luong hang hai': ['waterway', 'waterwayName', 'navigationChannelName', 'channelName', 'navigationChannelId', 'waterwayId'],
  'thuoc ben phao': ['buoyStationName', 'buoyBerthName', 'buoyStationId', 'buoyBerthId'],
  'thuoc nha tram': ['buoyStationName', 'buoyStationId'],
  'thuoc trung tam dieu hanh vts': ['vtsCenterName', 'vtsOperationCenterName', 'name'],
  'dia diem (tinh/ thanh pho)': ['provinceId', 'province', 'location', 'tinhThanh'],
  'dia diem (tinh/thanh pho)': ['provinceId', 'province', 'location', 'tinhThanh'],
  'tinh trang': ['operationalStatus', 'conditionStatus', 'condition', 'tinhTrang', 'isActive'],
  'trang thai': ['approvalStatus', 'trangThai', 'status'],
  'thoi diem cong bo mo, dua vao su dung': ['openingAnnouncementDate', 'thoiDiemCongBoMo', 'thoiDiemCongBo'],
  'quyet dinh cong bo/ van ban cho phep khai thac': ['publicDecision', 'openingDecision', 'quyetDinhCongBo'],
  'van ban thoa thuan dau tu xay dung': ['investmentAgreement', 'vanBanThoaThuanDauTu', 'vanBanThoaThuan'],
  'do sau khu nuoc hien tai (theo tbhh gan nhat) (m)': ['currentWaterDepth', 'doSauKhuNuocHienTai'],
  'cao do day ben thiet ke': ['bottomElevationDesign', 'caoDoDayBenThietKe'],
  'co tau khai thac theo cong bo (dwt)': ['maxVesselDWT', 'maxVesselSize', 'maxTonnage', 'coTauKhaiThacTheoCongBoDwt', 'coTauKhaiThacTheoCongBo'],
  'hinh dang': ['shapeDescription', 'hinhDang'],
  'dien tich (ha)': ['area', 'dienTich', 'totalArea'],
  'do sau khu nuoc theo thiet ke (m)': ['designWaterDepth', 'doSauKhuNuocTheoThietKe'],
  'so luong khu neo dau dang khai thac': ['activeAnchorageCount', 'soLuongKhuNeoDauDangKhaiThac'],
  'so luong khu neo dau da cong bo': ['publishedAnchorageCount', 'soLuongKhuNeoDauDaCongBo'],
  'so luong khu neo dau dang duoc thoa thuan dau tu xay dung': ['underInvestmentAnchorageCount', 'soLuongKhuNeoDauDangThoaThuan'],
  'ghi chu': ['remarks', 'note', 'ghiChu'],
};

const PRIMARY_CODE_NAME_KEYS_BY_TYPE: Record<string, { codeKeys: string[]; nameKeys: string[] }> = {
  ANCHORAGE_AREA: {
    codeKeys: ['anchorageCode', 'code'],
    nameKeys: ['anchorageName', 'name'],
  },
  TRANSSHIPMENT_AREA: {
    codeKeys: ['transferAreaCode', 'code'],
    nameKeys: ['transferAreaName', 'name'],
  },
  STORM_SHELTER_AREA: {
    codeKeys: ['stormShelterCode', 'code'],
    nameKeys: ['stormShelterName', 'name'],
  },
  BUOY_BERTH: {
    codeKeys: ['buoyBerthCode', 'code'],
    nameKeys: ['buoyBerthName', 'name'],
  },
  PIER: {
    codeKeys: ['pierCode', 'code'],
    nameKeys: ['pierName', 'name'],
  },
  PORT_TERMINAL: {
    codeKeys: ['berthCode', 'code'],
    nameKeys: ['berthName', 'name'],
  },
  SEAPORT: {
    codeKeys: ['portCode', 'code'],
    nameKeys: ['portName', 'name'],
  },
  DRY_PORT: {
    codeKeys: ['dryPortCode', 'code'],
    nameKeys: ['dryPortName', 'name'],
  },
  WATER_AREA: {
    codeKeys: ['waterZoneCode', 'code'],
    nameKeys: ['waterZoneName', 'name'],
  },
  SHIP_REPAIR_FACILITY: {
    codeKeys: ['facilityCode', 'code'],
    nameKeys: ['shipRepairYardName', 'facilityName', 'name'],
  },
  SHIP_REPAIR_YARD: {
    codeKeys: ['facilityCode', 'code'],
    nameKeys: ['shipRepairYardName', 'facilityName', 'name'],
  },
  LIGHTHOUSE: {
    codeKeys: ['beaconCode', 'code'],
    nameKeys: ['beaconName', 'name'],
  },
  BUOY: {
    codeKeys: ['buoyCode', 'code'],
    nameKeys: ['buoyName', 'name'],
  },
  BUOY_STATION: {
    codeKeys: ['buoyStationCode', 'stationCode', 'code'],
    nameKeys: ['buoyStationName', 'stationName', 'name'],
  },
  VTS_SYSTEM: {
    codeKeys: ['systemCode', 'code'],
    nameKeys: ['systemName', 'name'],
  },
  RADAR_STATION: {
    codeKeys: ['stationCode', 'radarCode', 'code'],
    nameKeys: ['stationName', 'radarName', 'name'],
  },
  RADAR_STATION_LEGACY: {
    codeKeys: ['stationCode', 'radarCode', 'code'],
    nameKeys: ['stationName', 'radarName', 'name'],
  },
  DIKE_REVETMENT: {
    codeKeys: ['dikeCode', 'code'],
    nameKeys: ['dikeName', 'name'],
  },
  NAVIGATION_CHANNEL: {
    codeKeys: ['channelCode', 'waterwayCode', 'code'],
    nameKeys: ['channelName', 'waterwayName', 'name'],
  },
};

export const resolveVmdPopupFields = (
  infrastructureType: string,
  displayType: string,
  data: Record<string, unknown>,
): VmdPopupField[] => {
  const vmdFields = getVmdPopupFields(infrastructureType);
  if (vmdFields.length === 0) return getOrderedKeysAndLabels(displayType);

  const currentFieldsByLabel = new Map(
    getOrderedKeysAndLabels(displayType).map((field) => [normalizePopupLabel(field.label), field.key]),
  );
  const primaryKeys = PRIMARY_CODE_NAME_KEYS_BY_TYPE[infrastructureType];
  const specificCodeKeys = primaryKeys?.codeKeys || [];
  const specificNameKeys = primaryKeys?.nameKeys || [];
  const genericCodeKeys = ['code', 'portCode', 'berthCode', 'pierCode', 'dryPortCode', 'waterZoneCode', 'buoyBerthCode', 'anchorageCode', 'transferAreaCode', 'stormShelterCode', 'facilityCode', 'beaconCode', 'systemCode'];
  const genericNameKeys = ['name', 'anchorageName', 'transferAreaName', 'stormShelterName', 'buoyBerthName', 'pierName', 'berthName', 'dryPortName', 'portName', 'waterZoneName', 'facilityName', 'beaconName', 'systemName'];
  const commonAliases: Record<string, string[]> = {
    // Basic / Org / User
    fkDonViQl: ['orgUnitId', 'unitId', 'donViQuanLy', 'orgUnitName', 'unitName', 'orgName'],
    updatedDate: ['updatedAt', 'updatedDate'],
    updatedUser: ['updatedByName', 'updatedBy', 'updatedUser'],
    diaDiemChiTiet: ['detailedLocation', 'locationDetail', 'diaChiChiTiet', 'diaDiemChiTiet', 'address'],
    // Parents
    fkCangBien: ['portName', 'tenCangBien', 'portId'],
    fkLuongHh: ['waterway', 'waterwayName', 'navigationChannelName', 'channelName', 'navigationChannelId', 'waterwayId'],
    fkBenPhao: ['buoyStationName', 'buoyBerthName', 'buoyStationId', 'buoyBerthId'],
    fkNhaTram: ['buoyStationName', 'buoyStationId'],
    fkCauCang: ['pierName', 'pierId', 'cauCangId'],
    fkBenCang: ['berthName', 'tenBenCang', 'berthId'],
    fkDonViKt: ['operator', 'operatingOrgName', 'operatingOrgId', 'operatorId'],
    fkDonViVh: ['operator', 'operatingOrgName', 'operatingOrgId', 'operatorId'],
    // Location / Province
    'zobjDataSub.diaDiemText': ['provinceId', 'province', 'location', 'tinhThanh'],
    diaDiemText: ['provinceId', 'province', 'location', 'tinhThanh'],
    // Status
    'zobjDataSub.tinhTrangText': ['operationalStatus', 'conditionStatus', 'condition', 'tinhTrang', 'isActive'],
    tinhTrangText: ['operationalStatus', 'conditionStatus', 'condition', 'tinhTrang', 'isActive'],
    'zobjDataSub.statusText': ['approvalStatus', 'trangThai', 'status'],
    statusText: ['approvalStatus', 'trangThai', 'status'],
    // Publication & Agreement
    'zobjDataSub.thoiDiemCongBo': ['openingAnnouncementDate', 'thoiDiemCongBoMo', 'thoiDiemCongBo'],
    thoiDiemCongBo: ['openingAnnouncementDate', 'thoiDiemCongBoMo', 'thoiDiemCongBo'],
    'zobjDataSub.thoiDiemCongBoMoDuaVaoSuDung': ['openingAnnouncementDate', 'thoiDiemCongBoMo', 'thoiDiemCongBo'],
    thoiDiemCongBoMoDuaVaoSuDung: ['openingAnnouncementDate', 'thoiDiemCongBoMo', 'thoiDiemCongBo'],
    'zobjDataSub.quyetDinhVanBanChoPhepKhaiThac': ['publicDecision', 'openingDecision', 'quyetDinhCongBo'],
    quyetDinhVanBanChoPhepKhaiThac: ['publicDecision', 'openingDecision', 'quyetDinhCongBo'],
    'zobjDataSub.quyetDinhCongBoVanBanChoPhepKhaiThac': ['publicDecision', 'openingDecision', 'quyetDinhCongBo'],
    quyetDinhCongBoVanBanChoPhepKhaiThac: ['publicDecision', 'openingDecision', 'quyetDinhCongBo'],
    'zobjDataSub.quyetDinhCongBo': ['publicDecision', 'openingDecision', 'quyetDinhCongBo'],
    quyetDinhCongBo: ['publicDecision', 'openingDecision', 'quyetDinhCongBo'],
    'zobjDataSub.vanBanThoaThuan': ['investmentAgreement', 'vanBanThoaThuanDauTu', 'vanBanThoaThuan'],
    vanBanThoaThuan: ['investmentAgreement', 'vanBanThoaThuanDauTu', 'vanBanThoaThuan'],
    'zobjDataSub.vanBanThoaThuanDauTuXayDung': ['investmentAgreement', 'vanBanThoaThuanDauTu', 'vanBanThoaThuan'],
    vanBanThoaThuanDauTuXayDung: ['investmentAgreement', 'vanBanThoaThuanDauTu', 'vanBanThoaThuan'],
    // Technical parameters
    'zobjDataSub.doSauKhuNuocHienTai': ['currentWaterDepth', 'doSauKhuNuocHienTai'],
    doSauKhuNuocHienTai: ['currentWaterDepth', 'doSauKhuNuocHienTai'],
    'zobjDataSub.caoDoDayBenThietKe': ['bottomElevationDesign', 'caoDoDayBenThietKe'],
    caoDoDayBenThietKe: ['bottomElevationDesign', 'caoDoDayBenThietKe'],
    'zobjDataSub.coTauKhaiThacTheoCongBoDwt': ['maxVesselDWT', 'maxVesselSize', 'maxTonnage', 'coTauKhaiThacTheoCongBoDwt'],
    coTauKhaiThacTheoCongBoDwt: ['maxVesselDWT', 'maxVesselSize', 'maxTonnage', 'coTauKhaiThacTheoCongBoDwt'],
    'zobjDataSub.coTauKhaiThacTheoCongBo': ['maxVesselDWT', 'maxVesselSize', 'maxTonnage', 'coTauKhaiThacTheoCongBo'],
    coTauKhaiThacTheoCongBo: ['maxVesselDWT', 'maxVesselSize', 'maxTonnage', 'coTauKhaiThacTheoCongBo'],
    'zobjDataSub.hinhDang': ['shapeDescription', 'hinhDang'],
    hinhDang: ['shapeDescription', 'hinhDang'],
    'zobjDataSub.dienTich': ['area', 'dienTich', 'totalArea'],
    dienTich: ['area', 'dienTich', 'totalArea'],
    'zobjDataSub.doSauKhuNuocTheoThietKe': ['designWaterDepth', 'doSauKhuNuocTheoThietKe'],
    doSauKhuNuocTheoThietKe: ['designWaterDepth', 'doSauKhuNuocTheoThietKe'],
    // Counts
    'zobjDataSub.soLuongKhuNeoDauDangKhaiThac': ['activeAnchorageCount', 'soLuongKhuNeoDauDangKhaiThac'],
    soLuongKhuNeoDauDangKhaiThac: ['activeAnchorageCount', 'soLuongKhuNeoDauDangKhaiThac'],
    'zobjDataSub.soLuongKhuNeoDauDaCongBo': ['publishedAnchorageCount', 'soLuongKhuNeoDauDaCongBo'],
    soLuongKhuNeoDauDaCongBo: ['publishedAnchorageCount', 'soLuongKhuNeoDauDaCongBo'],
    'zobjDataSub.soLuongKhuNeoDauDangThoaThuan': ['underInvestmentAnchorageCount', 'soLuongKhuNeoDauDangThoaThuan', 'underInvestmentCount'],
    soLuongKhuNeoDauDangThoaThuan: ['underInvestmentAnchorageCount', 'soLuongKhuNeoDauDangThoaThuan', 'underInvestmentCount'],
    'zobjDataSub.soLuongKhuChuyenTaiDangKhaiThac': ['activeTransferAreaCount', 'soLuongKhuChuyenTaiDangKhaiThac'],
    soLuongKhuChuyenTaiDangKhaiThac: ['activeTransferAreaCount', 'soLuongKhuChuyenTaiDangKhaiThac'],
    'zobjDataSub.soLuongKhuChuyenTaiDaCongBo': ['publishedTransferAreaCount', 'soLuongKhuChuyenTaiDaCongBo'],
    soLuongKhuChuyenTaiDaCongBo: ['publishedTransferAreaCount', 'soLuongKhuChuyenTaiDaCongBo'],
    'zobjDataSub.soLuongKhuChuyenTaiDangThoaThuan': ['underInvestmentTransferAreaCount', 'soLuongKhuChuyenTaiDangThoaThuan'],
    soLuongKhuChuyenTaiDangThoaThuan: ['underInvestmentTransferAreaCount', 'soLuongKhuChuyenTaiDangThoaThuan'],
    'zobjDataSub.soLuongKhuTranhTruBaoDangKhaiThac': ['activeStormShelterCount', 'soLuongKhuTranhTruBaoDangKhaiThac'],
    soLuongKhuTranhTruBaoDangKhaiThac: ['activeStormShelterCount', 'soLuongKhuTranhTruBaoDangKhaiThac'],
    'zobjDataSub.soLuongKhuTranhTruBaoDaCongBo': ['publishedStormShelterCount', 'soLuongKhuTranhTruBaoDaCongBo'],
    soLuongKhuTranhTruBaoDaCongBo: ['publishedStormShelterCount', 'soLuongKhuTranhTruBaoDaCongBo'],
    'zobjDataSub.soLuongKhuTranhTruBaoDangThoaThuan': ['underInvestmentStormShelterCount', 'soLuongKhuTranhTruBaoDangThoaThuan'],
    soLuongKhuTranhTruBaoDangThoaThuan: ['underInvestmentStormShelterCount', 'soLuongKhuTranhTruBaoDangThoaThuan'],
    'zobjDataSub.soLuongBenPhaoDangKhaiThac': ['activeBuoyBerthCount', 'soLuongBenPhaoDangKhaiThac'],
    soLuongBenPhaoDangKhaiThac: ['activeBuoyBerthCount', 'soLuongBenPhaoDangKhaiThac'],
    'zobjDataSub.soLuongBenPhaoDaCongBo': ['publishedBuoyBerthCount', 'soLuongBenPhaoDaCongBo'],
    soLuongBenPhaoDaCongBo: ['publishedBuoyBerthCount', 'soLuongBenPhaoDaCongBo'],
    'zobjDataSub.soLuongBenPhaoDangThoaThuan': ['underInvestmentBuoyBerthCount', 'soLuongBenPhaoDangThoaThuan'],
    soLuongBenPhaoDangThoaThuan: ['underInvestmentBuoyBerthCount', 'soLuongBenPhaoDangThoaThuan'],
    // Notes & Remarks
    'zobjDataSub.ghiChu': ['remarks', 'note', 'ghiChu'],
    ghiChu: ['remarks', 'note', 'ghiChu'],
  };

  return vmdFields.map((field) => {
    const legacyLeafKey = field.key.split('.').pop() || field.key;
    const normalizedLabel = normalizePopupLabel(field.label);
    const candidates = [
      ...(SPECIFIC_LABEL_KEYS[normalizedLabel] || []),
      currentFieldsByLabel.get(normalizedLabel),
      ...(normalizedLabel.startsWith('mã ') ? specificCodeKeys : []),
      ...(normalizedLabel.startsWith('tên ') ? specificNameKeys : []),
      field.key,
      legacyLeafKey,
      ...(commonAliases[field.key] || []),
      ...(commonAliases[legacyLeafKey] || []),
      ...(normalizedLabel.startsWith('mã ') ? genericCodeKeys : []),
      ...(normalizedLabel.startsWith('tên ') ? genericNameKeys : []),
    ].filter((key): key is string => !!key);
    const resolvedKey = candidates.find((key) => getPopupValueByPath(data, key) !== undefined)
      || candidates[0]
      || legacyLeafKey;
    return { ...field, key: resolvedKey };
  });
};
