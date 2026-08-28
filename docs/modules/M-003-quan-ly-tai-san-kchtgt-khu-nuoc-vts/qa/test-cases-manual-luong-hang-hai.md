# Bộ test thủ công — Luồng hàng hải (M-003)

- **Module**: M-003 "Quản lý tài sản KCHTGT - Khu nước & VTS"
- **Chức năng**: F-038..F-043 (Luồng hàng hải) — F-038 tạo mới, F-039 cập nhật, F-040 xóa mềm, F-041 phê duyệt C1/C2, F-042 danh sách/chi tiết, F-043 lịch sử
- **Tham chiếu**:
  - Feature brief: `docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/_features/F-038..F-043/feature-brief.md`
  - Lean spec: `docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md`
  - Ma trận 71 trường (Field Coverage Matrix)
- **Ngày tạo**: 2026-08-27
- **Nguồn**: `docs/intel/_tests/suite.json` — group "M-003 Quản lý tài sản KCHTGT khu nước & VTS — Manual test cases (F-038..F-043)" (63 case: TC-MAN-LHH-001..063)

## Bảng thống kê case theo vùng

| # | Vùng kiểm thử (section) | Số case | Dải mã |
|---|---|---|---|
| 1 | Tạo mới hồ sơ Luồng hàng hải (F-038) | 16 | TC-MAN-LHH-001..016 |
| 2 | Quy tắc nghiệp vụ BR-038 (F-038) | 7 | TC-MAN-LHH-017..023 |
| 3 | Phê duyệt 2 cấp C1/C2 (F-041) | 11 | TC-MAN-LHH-024..034 |
| 4 | Cập nhật, xóa mềm, chi tiết, lịch sử (F-039..F-043) | 12 | TC-MAN-LHH-035..046 |
| 5 | Danh sách & bộ lọc (F-042) | 7 | TC-MAN-LHH-047..053 |
| 6 | Phân quyền navigationchannel:* (9 permission) | 10 | TC-MAN-LHH-054..063 |
| **Tổng** | | **63** | TC-MAN-LHH-001..063 |

---

## Tạo mới hồ sơ Luồng hàng hải (F-038)

### TC-MAN-LHH-001 — Hiển thị đúng 46 trường nhập liệu và 25 trường chỉ đọc trên form tạo mới

1. **Mã case**: TC-MAN-LHH-001
2. **Tiêu đề**: Hiển thị đúng 46 trường nhập liệu và 25 trường chỉ đọc trên form tạo mới
3. **Điều kiện tiên quyết**: Đã đăng nhập với tài khoản có quyền navigationchannel:create; dữ liệu danh mục Đơn vị quản lý, Cảng biển, Tình trạng, Loại tuyến luồng, Phân cấp, Biểu tượng, Loại đối tượng đã có sẵn.
4. **Các bước thực hiện**:
   - Bước 1: Mở màn Danh sách Luồng hàng hải và bấm nút Tạo mới để mở form tạo mới
   - Bước 2: Đếm và đối chiếu các trường nhập liệu hiển thị trên form
   - Bước 3: Kiểm tra các trường #47-#71 không xuất hiện dưới dạng input chỉnh sửa
5. **Dữ liệu đầu vào**:
   - Bước 1: Đường dẫn /navigation-channel, nút Thêm mới
   - Bước 2: Các trường #1-#46 (hồ sơ chính #1-#21, tuyến luồng #22-#38, bảo vệ/bản đồ #39-#44, tọa độ #45, file đính kèm #46)
   - Bước 3: Trạng thái #47, kiểm toán #48-#57, KCHT liên quan #58-#59, vận hành #60-#63, bảo trì #64-#67, sự cố #68-#71
6. **Kết quả mong đợi**:
   - Bước 1: Form Tạo mới mở dạng popup trên trang danh sách
   - Bước 2: Hiển thị đủ 46 trường nhập theo đúng control Excel (SelectOrgCode, SelectKcht, Input, InputTextArea, InputDecimal, DatePicker, UploadFileTable, bảng con)
   - Bước 3: Không có input editable cho bất kỳ trường #47-#71 nào trên form tạo mới

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Form Tạo mới mở dạng popup trên trang danh sách
   - 2. Hiển thị đủ 46 trường nhập theo đúng control Excel
   - 3. Không có input editable cho bất kỳ trường #47-#71 nào
7. **Loại**: functional (equivalence, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-038-01, TS-038-01; F-038 feature-brief mục 2 + lean-spec Field Coverage Matrix. Loại: positive.

### TC-MAN-LHH-002 — Chặn tạo mới khi thiếu Đơn vị quản lý (orgUnitId)

1. **Mã case**: TC-MAN-LHH-002
2. **Tiêu đề**: Chặn tạo mới khi thiếu Đơn vị quản lý (orgUnitId)
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới Luồng hàng hải.
4. **Các bước thực hiện**:
   - Bước 1: Để trống trường Đơn vị quản lý (#1 orgUnitId), nhập đủ Tên luồng (#5) và Tình trạng (#8)
   - Bước 2: Bấm Lưu
   - Bước 3: Đọc thông báo lỗi hiển thị tại trường Đơn vị quản lý
5. **Dữ liệu đầu vào**:
   - Bước 1: channelName = 'Luồng Sông Hậu', conditionStatus = Tốt
   - Bước 2:
   - Bước 3:
6. **Kết quả mong đợi**:
   - Bước 1: Không có lỗi hiển thị ở các trường khác
   - Bước 2: Hệ thống chặn submit
   - Bước 3: Thông báo tiếng Việt 'Đơn vị quản lý là bắt buộc'

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Không có lỗi hiển thị ở các trường khác
   - 2. Hệ thống chặn submit, không tạo bản ghi mới
   - 3. Thông báo tiếng Việt 'Đơn vị quản lý là bắt buộc'
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-038-02, BR-038-02, TS-038-02; NavigationChannelCreateRequest.java @NotNull(message = 'Đơn vị quản lý là bắt buộc'). Loại: negative.

### TC-MAN-LHH-003 — Chặn tạo mới khi thiếu Tên luồng hàng hải (channelName)

1. **Mã case**: TC-MAN-LHH-003
2. **Tiêu đề**: Chặn tạo mới khi thiếu Tên luồng hàng hải (channelName)
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới Luồng hàng hải.
4. **Các bước thực hiện**:
   - Bước 1: Chọn Đơn vị quản lý (#1) và Tình trạng (#8), để trống Tên luồng hàng hải (#5)
   - Bước 2: Bấm Lưu
   - Bước 3: Đọc thông báo lỗi hiển thị tại trường Tên luồng hàng hải
5. **Dữ liệu đầu vào**:
   - Bước 1: orgUnitId hợp lệ, conditionStatus = Tốt, channelName = rỗng
   - Bước 2:
   - Bước 3:
6. **Kết quả mong đợi**:
   - Bước 1: Không có lỗi hiển thị ở các trường khác
   - Bước 2: Hệ thống chặn submit
   - Bước 3: Thông báo tiếng Việt 'Tên luồng hàng hải là bắt buộc'

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Không có lỗi hiển thị ở các trường khác
   - 2. Hệ thống chặn submit, không tạo bản ghi mới
   - 3. Thông báo tiếng Việt 'Tên luồng hàng hải là bắt buộc'
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-038-02, BR-038-02; NavigationChannelCreateRequest.java @NotNull(message = 'Tên luồng hàng hải là bắt buộc'). Loại: negative.

### TC-MAN-LHH-004 — Chặn tạo mới khi thiếu Tình trạng (conditionStatus)

1. **Mã case**: TC-MAN-LHH-004
2. **Tiêu đề**: Chặn tạo mới khi thiếu Tình trạng (conditionStatus)
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới Luồng hàng hải.
4. **Các bước thực hiện**:
   - Bước 1: Chọn Đơn vị quản lý (#1) và nhập Tên luồng (#5), để trống Tình trạng (#8)
   - Bước 2: Bấm Lưu
   - Bước 3: Đọc thông báo lỗi hiển thị tại trường Tình trạng
5. **Dữ liệu đầu vào**:
   - Bước 1: orgUnitId hợp lệ, channelName = 'Luồng Sông Hậu', conditionStatus = rỗng
   - Bước 2:
   - Bước 3:
6. **Kết quả mong đợi**:
   - Bước 1: Không có lỗi hiển thị ở các trường khác
   - Bước 2: Hệ thống chặn submit
   - Bước 3: Thông báo tiếng Việt 'Tình trạng là bắt buộc'

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Không có lỗi hiển thị ở các trường khác
   - 2. Hệ thống chặn submit, không tạo bản ghi mới
   - 3. Thông báo tiếng Việt 'Tình trạng là bắt buộc'
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-038-02, BR-038-02; NavigationChannelCreateRequest.java @NotNull(message = 'Tình trạng là bắt buộc'). Loại: negative.

### TC-MAN-LHH-005 — Tạo mới thành công, mã luồng channelCode tự sinh prefix LHH

1. **Mã case**: TC-MAN-LHH-005
2. **Tiêu đề**: Tạo mới thành công, mã luồng channelCode tự sinh prefix LHH
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; danh mục đã có; chưa có bản ghi nào cho đơn vị được chọn (hoặc biết trước count).
4. **Các bước thực hiện**:
   - Bước 1: Nhập đủ 3 trường bắt buộc và các trường tùy chọn #2-#46 cần thiết
   - Bước 2: Bấm Lưu
   - Bước 3: Kiểm tra giá trị channelCode trả về và hiển thị
5. **Dữ liệu đầu vào**:
   - Bước 1: orgUnitId = <UUID hợp lệ>, channelName = 'Luồng Sông Hậu', conditionStatus = Tốt, seaportId, detailedLocation = 'Hậu Giang'
   - Bước 2:
   - Bước 3: channelCode = 'LHH' + %06d (vd LHH000001)
6. **Kết quả mong đợi**:
   - Bước 1: Form hợp lệ, nút Lưu khả dụng
   - Bước 2: API POST /api/v1/navigation-channel trả 200/201 với bản ghi mới
   - Bước 3: channelCode tự sinh đúng prefix LHH, định dạng LHH + 6 chữ số, không rỗng

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Form hợp lệ, nút Lưu khả dụng
   - 2. API POST /api/v1/navigation-channel trả 200/201 với bản ghi mới
   - 3. channelCode tự sinh đúng prefix LHH, định dạng LHH + 6 chữ số
7. **Loại**: functional (equivalence, positive)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-038-03, BR-038-03, TS-038-03; NavigationChannelService.generateChannelCode. Loại: positive.

### TC-MAN-LHH-006 — channelCode và routeCode không thể nhập tay, client gửi mã bị bỏ qua

1. **Mã case**: TC-MAN-LHH-006
2. **Tiêu đề**: channelCode và routeCode không thể nhập tay, client gửi mã bị bỏ qua
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới Luồng hàng hải.
4. **Các bước thực hiện**:
   - Bước 1: Kiểm tra ô Mã luồng hàng hải (#4 channelCode) trên form
   - Bước 2: Thử gửi payload trực tiếp kèm channelCode và routeCode tự chế
   - Bước 3: Kiểm tra bản ghi tạo ra
5. **Dữ liệu đầu vào**:
   - Bước 1:
   - Bước 2: POST /api/v1/navigation-channel với channelCode='ABC', routeDetails=[{routeCode='XYZ'}]
   - Bước 3:
6. **Kết quả mong đợi**:
   - Bước 1: Ô disabled, không gõ được, không nhập tay
   - Bước 2: Server bỏ qua channelCode/routeCode do client gửi
   - Bước 3: channelCode = tự sinh LHH..., routeCode = channelCode + '-' + sequenceNo (tự sinh), không dùng giá trị client

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Ô disabled, không gõ được
   - 2. Server bỏ qua channelCode/routeCode do client gửi
   - 3. channelCode và routeCode đều do server tự sinh
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: BR-038-03, AC-038-03; NavigationChannelCreateRequest.java (không có field channelCode), ChannelRouteDetailRequest.java (không có routeCode). Loại: negative.

### TC-MAN-LHH-007 — routeCode (#23) tự sinh không NULL — kiểm chứng dữ liệu cũ

1. **Mã case**: TC-MAN-LHH-007
2. **Tiêu đề**: routeCode (#23) tự sinh không NULL — kiểm chứng dữ liệu cũ
3. **Điều kiện tiên quyết**: Đã có bản ghi Luồng hàng hải với ít nhất 1 dòng tuyến luồng; có dữ liệu cũ (nếu có) được rename từ bảng chi_tiet_tuyen_luong.
4. **Các bước thực hiện**:
   - Bước 1: Tạo mới hồ sơ có 2 dòng tuyến luồng (#22-#38)
   - Bước 2: Kiểm tra routeCode của từng dòng trong chi tiết/response
   - Bước 3: Với dữ liệu legacy (nếu có), truy vấn channel_route_detail.route_code
5. **Dữ liệu đầu vào**:
   - Bước 1: routeDetails gồm 2 dòng, không gửi sequenceNo
   - Bước 2: routeCode mong đợi = channelCode + '-' + %02d (vd LHH000001-01, LHH000001-02)
   - Bước 3: SELECT route_code FROM channel_route_detail WHERE ...
6. **Kết quả mong đợi**:
   - Bước 1: Tạo thành công
   - Bước 2: routeCode không NULL, đúng format channelCode-XX
   - Bước 3: Ghi nhận: dữ liệu cũ có thể NULL nếu cột ma cũ rỗng (migration không backfill route_code)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Tạo thành công
   - 2. routeCode không NULL, đúng format channelCode-XX
   - 3. Dữ liệu legacy có thể NULL (migration không backfill)
7. **Loại**: boundary (boundary, boundary)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: BR-038-03. KIỂM CHỨNG SOURCE: code hiện tại NavigationChannelService.toRouteDetail (dòng 817-826) TỰ SINH routeCode từ channelCode + sequenceNo (sequenceNo null -> index+1) nên bản ghi MỚI không NULL — gap NULL đã được khắc phục cho dữ liệu mới. HIỆN CHƯA ĐẠT (DEFECT) — DỮ LIỆU CŨ: migration V20260825120000 mục 9 chỉ RENAME cột ma -> route_code, KHÔNG backfill route_code cho dữ liệu cũ => route_code legacy có thể vẫn NULL. Cần kiểm tra dữ liệu thực tế. Loại: boundary.

### TC-MAN-LHH-008 — Giới hạn độ dài Tên luồng hàng hải (channelName) — tối thiểu/tối đa/quá giới hạn

1. **Mã case**: TC-MAN-LHH-008
2. **Tiêu đề**: Giới hạn độ dài Tên luồng hàng hải (channelName) — tối thiểu/tối đa/quá giới hạn
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Nhập Tên luồng (#5) đúng 1 ký tự
   - Bước 2: Nhập Tên luồng với độ dài lớn (vd 500 ký tự)
   - Bước 3: Nhập Tên luồng gồm toàn khoảng trắng
5. **Dữ liệu đầu vào**:
   - Bước 1: channelName = 'A'
   - Bước 2: channelName = chuỗi 500 ký tự
   - Bước 3: channelName = '   '
6. **Kết quả mong đợi**:
   - Bước 1: Hệ thống chấp nhận (không có ràng buộc min độ dài trong source)
   - Bước 2: Hệ thống chấp nhận hoặc chặn theo ràng buộc cột DB (ghi nhận hành vi thực tế)
   - Bước 3: Sau trim, nếu rỗng thì chặn với lỗi 'Tên luồng hàng hải là bắt buộc' (BR-038-05)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 1 ký tự được chấp nhận
   - 2. Ghi nhận hành vi thực tế với chuỗi dài
   - 3. Chuỗi toàn khoảng trắng sau trim bị chặn như rỗng
7. **Loại**: boundary (boundary, boundary)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: BR-038-05, AC-038-02. Ghi chú: source không khai báo @Size cho channelName — giới hạn độ dài thực tế do cột DB (channel_name) quyết định; QA ghi nhận hành vi thực tế. Loại: boundary.

### TC-MAN-LHH-009 — Trim khoảng trắng thừa trước khi lưu (BR-038-05)

1. **Mã case**: TC-MAN-LHH-009
2. **Tiêu đề**: Trim khoảng trắng thừa trước khi lưu (BR-038-05)
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Nhập các trường text/textarea có khoảng trắng thừa đầu/cuối
   - Bước 2: Bấm Lưu và kiểm tra giá trị lưu trong DB/response
   - Bước 3: Tìm kiếm bằng từ khóa không có khoảng trắng thừa
5. **Dữ liệu đầu vào**:
   - Bước 1: channelName = '  Luồng Sông Hậu  ', detailedLocation = '  Hậu Giang  '
   - Bước 2:
   - Bước 3: keyword = 'Luồng Sông Hậu'
6. **Kết quả mong đợi**:
   - Bước 1: Form chấp nhận nhập
   - Bước 2: Giá trị lưu đã trim: 'Luồng Sông Hậu', 'Hậu Giang'
   - Bước 3: Tìm thấy bản ghi (trim giúp lọc khớp)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Form chấp nhận nhập
   - 2. Giá trị lưu đã trim
   - 3. Tìm kiếm khớp nhờ trim
7. **Loại**: functional (equivalence, positive)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: BR-038-05, AC-038-03; NavigationChannelService.trimToNull. Loại: positive.

### TC-MAN-LHH-010 — Trường số nguyên — giá trị âm, số 0 và ký tự đặc biệt

1. **Mã case**: TC-MAN-LHH-010
2. **Tiêu đề**: Trường số nguyên — giá trị âm, số 0 và ký tự đặc biệt
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Nhập giá trị âm vào Số lượng trạm (#10 stationCount)
   - Bước 2: Nhập số 0 vào Số lượng phao (#16 buoyCount) và Số lượng tiêu (#17 beaconCount)
   - Bước 3: Nhập ký tự đặc biệt/chữ vào trường số nguyên
5. **Dữ liệu đầu vào**:
   - Bước 1: stationCount = -5
   - Bước 2: buoyCount = 0, beaconCount = 0
   - Bước 3: stationCount = 'abc' hoặc '!@#'
6. **Kết quả mong đợi**:
   - Bước 1: Hệ thống chặn hoặc chấp nhận (ghi nhận hành vi thực tế — source không khai báo @Min)
   - Bước 2: Chấp nhận (0 là giá trị hợp lệ)
   - Bước 3: Chặn với lỗi kiểu dữ liệu (number)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Ghi nhận hành vi với giá trị âm
   - 2. 0 được chấp nhận
   - 3. Ký tự không phải số bị chặn
7. **Loại**: negative (boundary, negative)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: F-038 field matrix #10/#16/#17 (kiểu Input); source không khai báo @Min/@Max cho các field Integer. Loại: negative.

### TC-MAN-LHH-011 — Trường thập phân — format sai và giá trị ngoài phạm vi

1. **Mã case**: TC-MAN-LHH-011
2. **Tiêu đề**: Trường thập phân — format sai và giá trị ngoài phạm vi
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Nhập giá trị thập phân hợp lệ vào Diện tích trạm (#12)
   - Bước 2: Nhập giá trị thập phân âm hoặc sai format vào Chiều dài luồng (#29)
   - Bước 3: Nhập giá trị thập phân vượt quá độ chính xác cột DB (vd 999999999999999.9999)
5. **Dữ liệu đầu vào**:
   - Bước 1: stationAreaSquareMeters = 120.50
   - Bước 2: channelLengthKilometers = -10 hoặc 'abc'
   - Bước 3: maximumDesignWidthMeters = 999999999999999.99
6. **Kết quả mong đợi**:
   - Bước 1: Chấp nhận
   - Bước 2: Chặn sai format; ghi nhận hành vi với giá trị âm
   - Bước 3: Chặn hoặc lỗi DB rõ ràng (ghi nhận hành vi thực tế)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Giá trị thập phân hợp lệ được chấp nhận
   - 2. Sai format bị chặn
   - 3. Ghi nhận hành vi với giá trị quá lớn
7. **Loại**: boundary (boundary, boundary)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: F-038 field matrix #12/#27-#36 (InputDecimal/Input số, NUMERIC); migration cast NUMERIC(19,4). Loại: boundary.

### TC-MAN-LHH-012 — Enum hợp lệ và không hợp lệ cho các trường lựa chọn

1. **Mã case**: TC-MAN-LHH-012
2. **Tiêu đề**: Enum hợp lệ và không hợp lệ cho các trường lựa chọn
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Chọn giá trị hợp lệ cho Tình trạng (#8 conditionStatus), Loại tuyến luồng (#25 routeType), Phân cấp (#38 routeGrade), Loại đối tượng (#41 geometryType)
   - Bước 2: Gửi payload với giá trị enum không hợp lệ (vd conditionStatus không tồn tại)
   - Bước 3: Kiểm tra Loại đối tượng (#41) chỉ nhận Điểm/Đường/Vùng
5. **Dữ liệu đầu vào**:
   - Bước 1: conditionStatus = Tốt, routeType = giá trị enum hợp lệ, routeGrade = giá trị hợp lệ, geometryType = Đường
   - Bước 2: conditionStatus = 'XYZ' (không có trong ConditionStatus enum)
   - Bước 3: geometryType = 'Điểm'/'Đường'/'Vùng'
6. **Kết quả mong đợi**:
   - Bước 1: Chấp nhận
   - Bước 2: Chặn với lỗi validation/deserialize tiếng Việt hoặc lỗi rõ ràng
   - Bước 3: Chỉ 3 giá trị hợp lệ được chấp nhận

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Giá trị enum hợp lệ được chấp nhận
   - 2. Giá trị enum không hợp lệ bị chặn
   - 3. geometryType chỉ nhận 3 giá trị
7. **Loại**: negative (equivalence, negative)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: F-038 field matrix #8/#22/#25/#38/#41; NavigationChannelCreateRequest.java dùng ConditionStatus/GisGeometryType enum. Loại: negative.

### TC-MAN-LHH-013 — Trường #47-#71 chỉ đọc, payload gửi lên bị bỏ qua (BR-038-06)

1. **Mã case**: TC-MAN-LHH-013
2. **Tiêu đề**: Trường #47-#71 chỉ đọc, payload gửi lên bị bỏ qua (BR-038-06)
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Kiểm tra các trường #47-#71 không xuất hiện trên form tạo mới
   - Bước 2: Gửi payload trực tiếp kèm các field #47-#71
   - Bước 3: Kiểm tra bản ghi tạo ra
5. **Dữ liệu đầu vào**:
   - Bước 1: approvalStatus, updatedAt, submittedAt, level1/2ApprovalContent, relatedInfrastructureName...
   - Bước 2: POST /api/v1/navigation-channel với approvalStatus='APPROVED', level1ApprovedBy=..., incidentCode='SC-1'
   - Bước 3:
6. **Kết quả mong đợi**:
   - Bước 1: Không có input cho các trường này
   - Bước 2: Server bỏ qua, không lưu giá trị client gửi (DTO không chứa field này)
   - Bước 3: approvalStatus = DRAFT (0) do hệ thống ghi, các field #47-#71 = null/giá trị hệ thống, không phải giá trị client

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Không có input cho #47-#71
   - 2. Server bỏ qua giá trị #47-#71 do client gửi
   - 3. #47-#71 do hệ thống ghi, không từ client
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: BR-038-06, TS-038-09, AC-038-08; NavigationChannelCreateRequest.java (chỉ #1-#46). Loại: negative.

### TC-MAN-LHH-014 — Nhiều dòng tuyến luồng — một dòng lỗi rollback toàn bộ (transaction)

1. **Mã case**: TC-MAN-LHH-014
2. **Tiêu đề**: Nhiều dòng tuyến luồng — một dòng lỗi rollback toàn bộ (transaction)
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Nhập hồ sơ chính hợp lệ + 2 dòng tuyến luồng, dòng thứ 2 chứa giá trị sai
   - Bước 2: Kiểm tra database sau khi lỗi
   - Bước 3: Sửa dòng lỗi và gửi lại
5. **Dữ liệu đầu vào**:
   - Bước 1: routeDetails[0] hợp lệ, routeDetails[1] có verticalClearanceMeters='abc' (sai kiểu)
   - Bước 2:
   - Bước 3: routeDetails[1] hợp lệ
6. **Kết quả mong đợi**:
   - Bước 1: Submit bị lỗi validation
   - Bước 2: Không có bản ghi navigation_channel mới, không có channel_route_detail mồ côi
   - Bước 3: Tạo thành công, các dòng gắn cùng navigationChannelId

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Submit bị lỗi validation
   - 2. Không có bản ghi mồ côi (rollback toàn bộ)
   - 3. Tạo thành công khi dữ liệu hợp lệ
7. **Loại**: boundary (boundary, boundary)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-038-04, BR-038-08, TS-038-04. Loại: boundary.

### TC-MAN-LHH-015 — Tọa độ (#45) — format kinh độ/vĩ độ và giá trị ngoài phạm vi

1. **Mã case**: TC-MAN-LHH-015
2. **Tiêu đề**: Tọa độ (#45) — format kinh độ/vĩ độ và giá trị ngoài phạm vi
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Nhập tọa độ hợp lệ: longitude trong [-180,180], latitude trong [-90,90]
   - Bước 2: Nhập longitude = 200 (ngoài phạm vi)
   - Bước 3: Nhập latitude = 'abc' (sai format)
5. **Dữ liệu đầu vào**:
   - Bước 1: longitude = 106.7004, latitude = 10.7763
   - Bước 2: longitude = 200
   - Bước 3: latitude = 'abc'
6. **Kết quả mong đợi**:
   - Bước 1: Chấp nhận
   - Bước 2: Chặn hoặc lỗi rõ ràng (ghi nhận hành vi thực tế)
   - Bước 3: Chặn sai kiểu dữ liệu

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Tọa độ hợp lệ được chấp nhận
   - 2. Ghi nhận hành vi với longitude ngoài phạm vi
   - 3. Sai format bị chặn
7. **Loại**: boundary (boundary, boundary)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: AC-038-05, TS-038-05; bảng con navigation_channel_coordinate (longitude NUMERIC(10,7), latitude NUMERIC(9,7)). Loại: boundary.

### TC-MAN-LHH-016 — File đính kèm (#46) — loại file, kích thước và file 0 byte

1. **Mã case**: TC-MAN-LHH-016
2. **Tiêu đề**: File đính kèm (#46) — loại file, kích thước và file 0 byte
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Đính kèm file hợp lệ (vd PDF/ảnh, kích thước trong giới hạn)
   - Bước 2: Đính kèm file sai loại (vd .exe) hoặc file 0 byte
   - Bước 3: Đính kèm file vượt kích thước tối đa
5. **Dữ liệu đầu vào**:
   - Bước 1: file 'quyet-dinh.pdf' 500KB
   - Bước 2: file 'virus.exe' hoặc file rỗng
   - Bước 3: file 100MB (nếu giới hạn nhỏ hơn)
6. **Kết quả mong đợi**:
   - Bước 1: Chấp nhận, file lưu với ref_type=NAVIGATION_CHANNEL
   - Bước 2: Chặn với thông báo tiếng Việt (theo pattern kiểm soát file chung)
   - Bước 3: Chặn với thông báo kích thước

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. File hợp lệ được chấp nhận
   - 2. File sai loại/0 byte bị chặn
   - 3. File quá lớn bị chặn
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: AC-038-05; F-038 §4.4 mục 7 (UploadFileTable, kiểm soát file theo pattern chung). Loại: negative.

---

## Quy tắc nghiệp vụ BR-038 (F-038)

### TC-MAN-LHH-017 — BR-038-01: form bám đúng 71 trường Excel, không dùng field cũ ngoài Excel

1. **Mã case**: TC-MAN-LHH-017
2. **Tiêu đề**: BR-038-01: form bám đúng 71 trường Excel, không dùng field cũ ngoài Excel
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create và navigationchannel:read; mở form Tạo mới và màn chi tiết.
4. **Các bước thực hiện**:
   - Bước 1: Đối chiếu toàn bộ field hiển thị trên form/chi tiết với ma trận 71 trường Excel
   - Bước 2: Kiểm tra KHÔNG xuất hiện các field cũ ngoài Excel (registered_area, operating_hours, recorded_date, quantity, load_capacity)
5. **Dữ liệu đầu vào**:
   - Bước 1: Ma trận #1-#71 (F-038 lean-spec Field Coverage Matrix)
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Đủ 71 trường theo đúng technical field English (#1-#46 nhập, #47-#71 read-only)
   - Bước 2: Không có field cũ nào trên form/response target

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Đủ 71 trường đúng Excel
   - 2. Không có field cũ ngoài Excel
7. **Loại**: functional (equivalence, positive + negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: BR-038-01, AC-038-01; F-038 feature-brief mục 7 (field cũ cần loại: registered_area...). Loại: positive + negative.

### TC-MAN-LHH-018 — BR-038-02: chỉ 3 trường bắt buộc khi tạo, các trường khác tùy chọn

1. **Mã case**: TC-MAN-LHH-018
2. **Tiêu đề**: BR-038-02: chỉ 3 trường bắt buộc khi tạo, các trường khác tùy chọn
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Chỉ nhập đúng 3 trường bắt buộc #1/#5/#8, để trống toàn bộ trường còn lại
   - Bước 2: Kiểm tra không có trường nào khác bị đánh dấu bắt buộc trên form
5. **Dữ liệu đầu vào**:
   - Bước 1: orgUnitId, channelName, conditionStatus hợp lệ
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Lưu thành công (không bị ép nhập thêm)
   - Bước 2: Chỉ #1/#5/#8 có dấu bắt buộc

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Lưu thành công chỉ với 3 trường bắt buộc
   - 2. Chỉ #1/#5/#8 bắt buộc
7. **Loại**: functional (equivalence, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: BR-038-02, AC-038-02, US-038-02; NavigationChannelCreateRequest.java chỉ 3 @NotNull. Loại: positive.

### TC-MAN-LHH-019 — BR-038-04: chọn orgUnitId ngoài phạm vi bị từ chối, không tạo bản ghi

1. **Mã case**: TC-MAN-LHH-019
2. **Tiêu đề**: BR-038-04: chọn orgUnitId ngoài phạm vi bị từ chối, không tạo bản ghi
3. **Điều kiện tiên quyết**: Đăng nhập với tài khoản thuộc đơn vị con (không có orgunit:scope_all/admin:all); có quyền navigationchannel:create.
4. **Các bước thực hiện**:
   - Bước 1: Mở form Tạo mới và chọn Đơn vị quản lý (#1) là đơn vị NGOÀI phạm vi được phân quyền
   - Bước 2: Gửi POST trực tiếp với orgUnitId ngoài phạm vi
   - Bước 3: Kiểm tra DB
5. **Dữ liệu đầu vào**:
   - Bước 1: orgUnitId = UUID đơn vị ngoài subtree của user
   - Bước 2: POST /api/v1/navigation-channel với orgUnitId ngoài scope
   - Bước 3:
6. **Kết quả mong đợi**:
   - Bước 1: Ghi nhận: nếu frontend chỉ hiển thị cây đơn vị trong scope thì không chọn được; nếu gửi trực tiếp API thì bị từ chối
   - Bước 2: HTTP 403 hoặc lỗi nghiệp vụ tiếng Việt, không tạo bản ghi
   - Bước 3: Không phát sinh bản ghi sai scope, org_unit_id không NULL

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Không chọn được đơn vị ngoài phạm vi qua UI
   - 2. HTTP 403 hoặc lỗi tiếng Việt
   - 3. Không tạo bản ghi sai scope
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: BR-038-04, AC-038-05/AC-038-09, TS-038-06. Loại: negative.

### TC-MAN-LHH-020 — BR-038-07: trường phê duyệt #52-#57 không nhận từ client, trạng thái lưu dạng số

1. **Mã case**: TC-MAN-LHH-020
2. **Tiêu đề**: BR-038-07: trường phê duyệt #52-#57 không nhận từ client, trạng thái lưu dạng số
3. **Điều kiện tiên quyết**: Đã có hồ sơ DRAFT; đăng nhập với quyền update/create.
4. **Các bước thực hiện**:
   - Bước 1: Gửi payload create/update kèm các field phê duyệt #52-#57 tự chế
   - Bước 2: Kiểm tra giá trị lưu của các field #52-#57 và approvalStatus
5. **Dữ liệu đầu vào**:
   - Bước 1: level1ApprovedAt, level1ApprovedBy, level1ApprovalContent, level2ApprovedAt... giá trị client tự đặt
   - Bước 2: SELECT approval_status, level1_approved_by... FROM navigation_channel
6. **Kết quả mong đợi**:
   - Bước 1: Server bỏ qua (DTO không chứa field)
   - Bước 2: approvalStatus lưu dạng số (0/2/3/5/8/9), #52-#57 do workflow ghi, không phải giá trị client

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Server bỏ qua #52-#57 do client gửi
   - 2. Trạng thái số, #52-#57 do workflow ghi
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: BR-038-07, AC-038-06/07; F-038 mục 3 (trạng thái DRAFT=0, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9). Loại: negative.

### TC-MAN-LHH-021 — BR-038-08: bảng con lỗi rollback toàn bộ transaction

1. **Mã case**: TC-MAN-LHH-021
2. **Tiêu đề**: BR-038-08: bảng con lỗi rollback toàn bộ transaction
3. **Điều kiện tiên quyết**: Đã đăng nhập với quyền navigationchannel:create; mở form Tạo mới.
4. **Các bước thực hiện**:
   - Bước 1: Tạo hồ sơ với routeDetails, coordinateList, attachments trong đó 1 phần tử lỗi
   - Bước 2: Kiểm tra DB: navigation_channel, channel_route_detail, navigation_channel_coordinate, infrastructure_attachments
5. **Dữ liệu đầu vào**:
   - Bước 1: routeDetails[0] hợp lệ, coordinateList[0] latitude sai format
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Toàn bộ create bị rollback
   - Bước 2: Không có bản ghi mồ côi nào ở các bảng con

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Toàn bộ create bị rollback
   - 2. Không có bản ghi mồ côi ở bảng con
7. **Loại**: boundary (boundary, boundary)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: BR-038-08, AC-038-04/05, TS-038-04. Loại: boundary.

### TC-MAN-LHH-022 — BR-038-09: dữ liệu liên quan #58-#71 rỗng hiển thị có kiểm soát, không placeholder

1. **Mã case**: TC-MAN-LHH-022
2. **Tiêu đề**: BR-038-09: dữ liệu liên quan #58-#71 rỗng hiển thị có kiểm soát, không placeholder
3. **Điều kiện tiên quyết**: Có hồ sơ Luồng hàng hải; có/không có dữ liệu KCHT/vận hành/bảo trì/sự cố liên quan; đăng nhập với quyền read.
4. **Các bước thực hiện**:
   - Bước 1: Mở chi tiết hồ sơ KHÔNG có dữ liệu liên quan #58-#71
   - Bước 2: Mở chi tiết hồ sơ CÓ dữ liệu liên quan
5. **Dữ liệu đầu vào**:
   - Bước 1:
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Các field #58-#71 hiển thị '—' (rỗng có kiểm soát), không có giá trị giả/placeholder
   - Bước 2: Hiển thị đúng dữ liệu thực từ nguồn nghiệp vụ

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Rỗng hiển thị '—', không placeholder
   - 2. Có dữ liệu thì hiển thị đúng
7. **Loại**: functional (equivalence, positive + negative)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: BR-038-09, AC-038-08, TS-038-09; BR-042-06. Loại: positive + negative.

### TC-MAN-LHH-023 — BR-038-10: user thiếu permission tương ứng nhận 403 Forbidden

1. **Mã case**: TC-MAN-LHH-023
2. **Tiêu đề**: BR-038-10: user thiếu permission tương ứng nhận 403 Forbidden
3. **Điều kiện tiên quyết**: Đăng nhập với tài khoản KHÔNG có bất kỳ quyền navigationchannel:* nào.
4. **Các bước thực hiện**:
   - Bước 1: Gọi các endpoint navigation-channel
   - Bước 2: Kiểm tra UI
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel, POST, PUT, DELETE, approve-level-1, approve-level-2, history
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden cho mọi thao tác
   - Bước 2: Không hiển thị nút Tạo mới/Sửa/Xóa/Duyệt (menu ẩn theo quyền)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. HTTP 403 cho mọi thao tác
   - 2. UI ẩn thao tác không được phép
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: BR-038-10, AC-038-09/10, TS-038-10. Loại: negative.

---

## Phê duyệt 2 cấp C1/C2 (F-041)

### TC-MAN-LHH-024 — Gửi phê duyệt từ cấp Cảng vụ/Chi cục chuyển trạng thái PENDING_APPROVAL

1. **Mã case**: TC-MAN-LHH-024
2. **Tiêu đề**: Gửi phê duyệt từ cấp Cảng vụ/Chi cục chuyển trạng thái PENDING_APPROVAL
3. **Điều kiện tiên quyết**: Có hồ sơ DRAFT; đăng nhập tài khoản cấp Cảng vụ/Chi cục có navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gọi submit-approval
   - Bước 2: Kiểm tra trạng thái và field #50-#51
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/submit-approval
   - Bước 2: approvalStatus, submittedAt, submittedBy
6. **Kết quả mong đợi**:
   - Bước 1: Thành công
   - Bước 2: approvalStatus = PENDING_APPROVAL (2), submittedAt/submittedBy được ghi từ session

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Submit thành công
   - 2. PENDING_APPROVAL (2), ghi #50-#51
7. **Loại**: integration (state-transition, positive)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-041-01, BR-041-01, TS-041-01. Loại: positive.

### TC-MAN-LHH-025 — Gửi phê duyệt từ cấp Cục vào thẳng APPROVED_LEVEL1 (Rule 14)

1. **Mã case**: TC-MAN-LHH-025
2. **Tiêu đề**: Gửi phê duyệt từ cấp Cục vào thẳng APPROVED_LEVEL1 (Rule 14)
3. **Điều kiện tiên quyết**: Có hồ sơ DRAFT; đăng nhập tài khoản cấp Cục có navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gọi submit-approval với tài khoản cấp Cục
   - Bước 2: Kiểm tra trạng thái
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/submit-approval
   - Bước 2: approvalStatus
6. **Kết quả mong đợi**:
   - Bước 1: Thành công
   - Bước 2: approvalStatus = APPROVED_LEVEL1 (3) — bỏ qua bước chờ C1 (Rule 14)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Submit thành công
   - 2. APPROVED_LEVEL1 (3) (Rule 14)
7. **Loại**: integration (state-transition, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-041-02, BR-041-02, TS-041-01. Loại: positive.

### TC-MAN-LHH-026 — Duyệt cấp Cảng vụ/Chi cục (C1) ghi #52-#54

1. **Mã case**: TC-MAN-LHH-026
2. **Tiêu đề**: Duyệt cấp Cảng vụ/Chi cục (C1) ghi #52-#54
3. **Điều kiện tiên quyết**: Có hồ sơ PENDING_APPROVAL; đăng nhập tài khoản có navigationchannel:approvec1, không phải người tạo.
4. **Các bước thực hiện**:
   - Bước 1: Duyệt cấp 1
   - Bước 2: Kiểm tra trạng thái và field #52-#54
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/approve/c1, status=APPROVED
   - Bước 2: approvalStatus, level1ApprovedAt, level1ApprovedBy, level1ApprovalContent
6. **Kết quả mong đợi**:
   - Bước 1: Thành công
   - Bước 2: approvalStatus = APPROVED_LEVEL1 (3), #52-#54 ghi từ workflow/session

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Duyệt C1 thành công
   - 2. APPROVED_LEVEL1 (3), ghi #52-#54
7. **Loại**: integration (state-transition, positive)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-041-03, BR-041-03/09, TS-041-02. Loại: positive.

### TC-MAN-LHH-027 — Trả về cấp 1 thiếu lý do bị chặn

1. **Mã case**: TC-MAN-LHH-027
2. **Tiêu đề**: Trả về cấp 1 thiếu lý do bị chặn
3. **Điều kiện tiên quyết**: Có hồ sơ PENDING_APPROVAL; đăng nhập với navigationchannel:approvec1.
4. **Các bước thực hiện**:
   - Bước 1: Gọi reject-level-1 không kèm reason
   - Bước 2: Đọc thông báo lỗi
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/reject-level-1 (không có reason)
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Bị từ chối
   - Bước 2: 'Lý do từ chối là bắt buộc', trạng thái không đổi

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Bị từ chối
   - 2. 'Lý do từ chối là bắt buộc', trạng thái không đổi
7. **Loại**: integration (error-guessing, negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-041-04, BR-041-07, TS-041-03. Loại: negative.

### TC-MAN-LHH-028 — Người tạo tự duyệt bị chặn (4-eyes principle)

1. **Mã case**: TC-MAN-LHH-028
2. **Tiêu đề**: Người tạo tự duyệt bị chặn (4-eyes principle)
3. **Điều kiện tiên quyết**: Có hồ sơ PENDING_APPROVAL do chính người đang đăng nhập tạo; tài khoản có navigationchannel:approvec1.
4. **Các bước thực hiện**:
   - Bước 1: Người tạo hồ sơ gọi approve/c1
   - Bước 2: Đọc thông báo
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/approve/c1
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Bị từ chối
   - Bước 2: 'Bạn không thể phê duyệt bản do chính mình gửi (4-eyes principle)'

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Tự duyệt bị chặn
   - 2. Thông báo 4-eyes
7. **Loại**: integration (state-transition, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-041-05, BR-041-05, TS-041-04. Loại: negative.

### TC-MAN-LHH-029 — Trả về cấp 1 có lý do chuyển REJECTED_LEVEL1

1. **Mã case**: TC-MAN-LHH-029
2. **Tiêu đề**: Trả về cấp 1 có lý do chuyển REJECTED_LEVEL1
3. **Điều kiện tiên quyết**: Có hồ sơ PENDING_APPROVAL; đăng nhập với navigationchannel:approvec1.
4. **Các bước thực hiện**:
   - Bước 1: Gọi reject-level-1 kèm reason
   - Bước 2: Kiểm tra trạng thái và field #54
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/reject-level-1, reason='Sai thông tin đơn vị'
   - Bước 2: approvalStatus, level1ApprovalContent
6. **Kết quả mong đợi**:
   - Bước 1: Thành công
   - Bước 2: approvalStatus = REJECTED_LEVEL1 (8), level1ApprovalContent = lý do đã trim

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Trả về C1 thành công
   - 2. REJECTED_LEVEL1 (8), ghi #54
7. **Loại**: integration (state-transition, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-041-06, BR-041-03/07, TS-041-05. Loại: positive.

### TC-MAN-LHH-030 — Người duyệt C2 trùng người duyệt C1 bị chặn (4-eyes)

1. **Mã case**: TC-MAN-LHH-030
2. **Tiêu đề**: Người duyệt C2 trùng người duyệt C1 bị chặn (4-eyes)
3. **Điều kiện tiên quyết**: Có hồ sơ APPROVED_LEVEL1; người đăng nhập có navigationchannel:approvec2 và TRÙNG với người đã duyệt C1.
4. **Các bước thực hiện**:
   - Bước 1: Người đã duyệt C1 gọi approve/c2
   - Bước 2: Đọc thông báo
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/approve/c2
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Bị từ chối
   - Bước 2: 'Người phê duyệt C2 không được trùng với người phê duyệt C1 (4-eyes principle)'

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. C2 trùng C1 bị chặn
   - 2. Thông báo 4-eyes C2≠C1
7. **Loại**: integration (state-transition, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-041-07, BR-041-05, TS-041-06. Loại: negative.

### TC-MAN-LHH-031 — Duyệt cấp Cục (C2) ghi #55-#57 và trạng thái APPROVED

1. **Mã case**: TC-MAN-LHH-031
2. **Tiêu đề**: Duyệt cấp Cục (C2) ghi #55-#57 và trạng thái APPROVED
3. **Điều kiện tiên quyết**: Có hồ sơ APPROVED_LEVEL1; đăng nhập tài khoản có navigationchannel:approvec2, khác người duyệt C1.
4. **Các bước thực hiện**:
   - Bước 1: Duyệt cấp 2
   - Bước 2: Kiểm tra trạng thái và field #55-#57
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/approve/c2, status=APPROVED
   - Bước 2: approvalStatus, level2ApprovedAt, level2ApprovedBy, level2ApprovalContent
6. **Kết quả mong đợi**:
   - Bước 1: Thành công
   - Bước 2: approvalStatus = APPROVED (5), #55-#57 ghi từ workflow/session

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Duyệt C2 thành công
   - 2. APPROVED (5), ghi #55-#57
7. **Loại**: integration (state-transition, positive)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-041-08, BR-041-04/09, TS-041-07. Loại: positive.

### TC-MAN-LHH-032 — Trả về cấp 2 có lý do chuyển REJECTED_LEVEL2

1. **Mã case**: TC-MAN-LHH-032
2. **Tiêu đề**: Trả về cấp 2 có lý do chuyển REJECTED_LEVEL2
3. **Điều kiện tiên quyết**: Có hồ sơ APPROVED_LEVEL1; đăng nhập với navigationchannel:approvec2.
4. **Các bước thực hiện**:
   - Bước 1: Gọi reject-level-2 kèm reason
   - Bước 2: Kiểm tra trạng thái
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/reject-level-2, reason='Không đủ điều kiện công bố'
   - Bước 2: approvalStatus
6. **Kết quả mong đợi**:
   - Bước 1: Thành công
   - Bước 2: approvalStatus = REJECTED_LEVEL2 (9), ghi lý do #57

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Trả về C2 thành công
   - 2. REJECTED_LEVEL2 (9)
7. **Loại**: integration (state-transition, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-041-09, BR-041-04/07, TS-041-05. Loại: positive.

### TC-MAN-LHH-033 — Gửi lại sau khi bị trả về (resubmit)

1. **Mã case**: TC-MAN-LHH-033
2. **Tiêu đề**: Gửi lại sau khi bị trả về (resubmit)
3. **Điều kiện tiên quyết**: Có hồ sơ REJECTED_LEVEL1 hoặc REJECTED_LEVEL2.
4. **Các bước thực hiện**:
   - Bước 1: Gọi submit-approval lại trên hồ sơ đã bị trả về
   - Bước 2: Kiểm tra #50-#51 refresh và reset approver
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/submit-approval
   - Bước 2: submittedAt, submittedBy
6. **Kết quả mong đợi**:
   - Bước 1: Submit thành công
   - Bước 2: submittedAt/submittedBy cập nhật mới, approver cấp cũ bị reset

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Gửi lại thành công
   - 2. #50-#51 refresh, reset approver
7. **Loại**: integration (state-transition, boundary)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-041-10, BR-041-01, TS-041-08. Loại: boundary.

### TC-MAN-LHH-034 — Thiếu permission approvec1/approvec2 nhận 403

1. **Mã case**: TC-MAN-LHH-034
2. **Tiêu đề**: Thiếu permission approvec1/approvec2 nhận 403
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản KHÔNG có navigationchannel:approvec1 và navigationchannel:approvec2.
4. **Các bước thực hiện**:
   - Bước 1: Gọi approve/reject cấp 1
   - Bước 2: Gọi approve/reject cấp 2
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel/{id}/approve/c1 hoặc /reject-level-1
   - Bước 2: POST /api/v1/navigation-channel/{id}/approve/c2 hoặc /reject-level-2
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden
   - Bước 2: HTTP 403 Forbidden

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 403 khi thiếu approvec1
   - 2. 403 khi thiếu approvec2
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-041-11, TS-041-09; NavigationChannelController.java @PreAuthorize approvec1/approvec2. Loại: negative.

---

## Cập nhật, xóa mềm, chi tiết, lịch sử (F-039..F-043)

### TC-MAN-LHH-035 — Cập nhật partial thành công, chỉ field gửi được áp dụng

1. **Mã case**: TC-MAN-LHH-035
2. **Tiêu đề**: Cập nhật partial thành công, chỉ field gửi được áp dụng
3. **Điều kiện tiên quyết**: Có hồ sơ Luồng hàng hải; đăng nhập với navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gửi PUT với một số field #1-#46 (partial)
   - Bước 2: Kiểm tra field không gửi giữ nguyên, updatedAt/updatedBy đổi
5. **Dữ liệu đầu vào**:
   - Bước 1: PUT /api/v1/navigation-channel/{id} với channelName mới
   - Bước 2: response + DB
6. **Kết quả mong đợi**:
   - Bước 1: Thành công
   - Bước 2: Chỉ channelName đổi, field khác giữ nguyên, updatedAt/updatedBy ghi từ session

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Cập nhật partial thành công
   - 2. Chỉ field gửi được áp dụng, audit mới
7. **Loại**: functional (equivalence, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-039-01, BR-039-01/05, TS-039-01. Loại: positive.

### TC-MAN-LHH-036 — Đổi orgUnitId ngoài phạm vi bị từ chối

1. **Mã case**: TC-MAN-LHH-036
2. **Tiêu đề**: Đổi orgUnitId ngoài phạm vi bị từ chối
3. **Điều kiện tiên quyết**: Có hồ sơ; đăng nhập tài khoản đơn vị con có navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gửi PUT đổi orgUnitId sang đơn vị ngoài phạm vi
   - Bước 2: Đọc thông báo và kiểm tra DB
5. **Dữ liệu đầu vào**:
   - Bước 1: PUT /api/v1/navigation-channel/{id} với orgUnitId ngoài scope
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: API từ chối
   - Bước 2: 'Đơn vị quản lý nằm ngoài phạm vi được phân quyền', dữ liệu không đổi

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. API từ chối
   - 2. Message tiếng Việt, DB không đổi
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-039-02, BR-039-02, TS-039-02. Loại: negative.

### TC-MAN-LHH-037 — Update gửi channelCode/#47-#71 bị bỏ qua

1. **Mã case**: TC-MAN-LHH-037
2. **Tiêu đề**: Update gửi channelCode/#47-#71 bị bỏ qua
3. **Điều kiện tiên quyết**: Có hồ sơ; đăng nhập với navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gửi PUT kèm channelCode, routeCode và field #47-#71 tự chế
   - Bước 2: Kiểm tra giá trị cũ giữ nguyên
5. **Dữ liệu đầu vào**:
   - Bước 1: PUT với channelCode='ABC', approvalStatus='APPROVED', incidentCode='SC-1'
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Server bỏ qua các field này (DTO update không chứa)
   - Bước 2: channelCode, routeCode, #47-#71 không đổi

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Server bỏ qua field read-only
   - 2. Giá trị cũ giữ nguyên
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-039-03, BR-039-03, TS-039-03; NavigationChannelUpdateRequest.java. Loại: negative.

### TC-MAN-LHH-038 — Thay thế toàn bộ routeDetails cùng transaction

1. **Mã case**: TC-MAN-LHH-038
2. **Tiêu đề**: Thay thế toàn bộ routeDetails cùng transaction
3. **Điều kiện tiên quyết**: Có hồ sơ với routeDetails cũ; đăng nhập với navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gửi PUT với danh sách routeDetails mới thay thế
   - Bước 2: Kiểm tra routeCode tự sinh và transaction
5. **Dữ liệu đầu vào**:
   - Bước 1: routeDetails mới (2 dòng)
   - Bước 2: routeCode = channelCode-XX
6. **Kết quả mong đợi**:
   - Bước 1: Danh sách cũ bị thay thế toàn bộ
   - Bước 2: routeCode tự sinh mới; nếu 1 dòng lỗi thì rollback toàn bộ update

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. routeDetails cũ bị thay thế
   - 2. routeCode tự sinh, rollback khi lỗi
7. **Loại**: boundary (boundary, boundary)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-039-04, BR-039-06, TS-039-04. Loại: boundary.

### TC-MAN-LHH-039 — Update hồ sơ không tồn tại hoặc đã xóa mềm trả lỗi tiếng Việt

1. **Mã case**: TC-MAN-LHH-039
2. **Tiêu đề**: Update hồ sơ không tồn tại hoặc đã xóa mềm trả lỗi tiếng Việt
3. **Điều kiện tiên quyết**: Đăng nhập với navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gửi PUT với id không tồn tại
   - Bước 2: Gửi PUT với id đã xóa mềm
5. **Dữ liệu đầu vào**:
   - Bước 1: PUT /api/v1/navigation-channel/{uuid-không-tồn-tại}
   - Bước 2: PUT /api/v1/navigation-channel/{id-đã-xóa}
6. **Kết quả mong đợi**:
   - Bước 1: Lỗi tiếng Việt, HTTP 400-family, không tạo bản ghi
   - Bước 2: Lỗi 'Không tìm thấy luồng hàng hải với id'

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Lỗi tiếng Việt với id không tồn tại
   - 2. Lỗi 'Không tìm thấy' với id đã xóa
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: AC-039-06, BR-039-07, TS-039-06. Loại: negative.

### TC-MAN-LHH-040 — Update không guard trạng thái (lệch work order — cần PMO chốt)

1. **Mã case**: TC-MAN-LHH-040
2. **Tiêu đề**: Update không guard trạng thái (lệch work order — cần PMO chốt)
3. **Điều kiện tiên quyết**: Có hồ sơ APPROVED (5); đăng nhập với navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gửi PUT sửa hồ sơ đang ở trạng thái APPROVED
   - Bước 2: Kiểm tra approvalStatus và history
5. **Dữ liệu đầu vào**:
   - Bước 1: PUT /api/v1/navigation-channel/{id} với channelName mới
   - Bước 2: approvalStatus, bảng approval_history
6. **Kết quả mong đợi**:
   - Bước 1: Ghi nhận: code hiện tại CHẤP NHẬN update (không guard trạng thái)
   - Bước 2: approvalStatus KHÔNG reset về DRAFT, KHÔNG ghi history UPDATE

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Update được chấp nhận ở mọi trạng thái (code hiện tại)
   - 2. Không reset DRAFT, không ghi history UPDATE
7. **Loại**: negative (state-transition, negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: BR-039-08. HIỆN CHƯA ĐẠT (DEFECT) — lệch kỳ vọng work order: spec gốc kỳ vọng guard trạng thái (chỉ sửa ở trạng thái cho phép), reset DRAFT và ghi history UPDATE; code hiện tại (F-039 lean-spec Summary + Out of scope) KHÔNG guard trạng thái, KHÔNG reset DRAFT, KHÔNG ghi history UPDATE — chờ PMO chốt. Loại: negative.

### TC-MAN-LHH-041 — Xóa mềm hồ sơ DRAFT ghi deletedAt/deletedBy

1. **Mã case**: TC-MAN-LHH-041
2. **Tiêu đề**: Xóa mềm hồ sơ DRAFT ghi deletedAt/deletedBy
3. **Điều kiện tiên quyết**: Có hồ sơ DRAFT do người nhập tạo; đăng nhập với navigationchannel:delete.
4. **Các bước thực hiện**:
   - Bước 1: Gọi DELETE trên hồ sơ DRAFT
   - Bước 2: Kiểm tra DB
5. **Dữ liệu đầu vào**:
   - Bước 1: DELETE /api/v1/navigation-channel/{id}
   - Bước 2: deleted_at, deleted_by
6. **Kết quả mong đợi**:
   - Bước 1: Thành công
   - Bước 2: deleted_at khác NULL, deleted_by ghi từ session (operatorId)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Xóa mềm thành công
   - 2. deletedAt/deletedBy ghi từ session
7. **Loại**: functional (state-transition, positive)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-040-01, BR-040-01/02, TS-040-01. Loại: positive.

### TC-MAN-LHH-042 — Xóa hồ sơ không ở trạng thái Lưu tạm bị từ chối

1. **Mã case**: TC-MAN-LHH-042
2. **Tiêu đề**: Xóa hồ sơ không ở trạng thái Lưu tạm bị từ chối
3. **Điều kiện tiên quyết**: Có hồ sơ APPROVED/PENDING_APPROVAL; đăng nhập với navigationchannel:delete.
4. **Các bước thực hiện**:
   - Bước 1: Gọi DELETE trên hồ sơ không DRAFT
   - Bước 2: Đọc thông báo và kiểm tra DB
5. **Dữ liệu đầu vào**:
   - Bước 1: DELETE /api/v1/navigation-channel/{id} (hồ sơ APPROVED hoặc PENDING_APPROVAL)
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: API từ chối
   - Bước 2: 'Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm', dữ liệu không đổi

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Xóa hồ sơ không DRAFT bị từ chối
   - 2. Message tiếng Việt, DB không đổi
7. **Loại**: negative (state-transition, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-040-02, BR-040-01 (quy tắc 11, approval-2-level-spec.md mục 3.6), TS-040-02. Loại: negative.

### TC-MAN-LHH-043 — Hồ sơ đã xóa mềm ẩn khỏi danh sách/tìm kiếm

1. **Mã case**: TC-MAN-LHH-043
2. **Tiêu đề**: Hồ sơ đã xóa mềm ẩn khỏi danh sách/tìm kiếm
3. **Điều kiện tiên quyết**: Có hồ sơ đã xóa mềm; đăng nhập với navigationchannel:read.
4. **Các bước thực hiện**:
   - Bước 1: Gọi danh sách/tìm kiếm
   - Bước 2: Kiểm tra filter DB
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel, GET /search
   - Bước 2: deleted_at IS NULL
6. **Kết quả mong đợi**:
   - Bước 1: Hồ sơ đã xóa không xuất hiện
   - Bước 2: Chỉ trả hồ sơ chưa xóa

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Hồ sơ đã xóa không xuất hiện
   - 2. Filter deleted_at IS NULL
7. **Loại**: negative (equivalence, negative)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: AC-040-03, BR-040-04, TS-040-03. Loại: negative.

### TC-MAN-LHH-044 — Truy cập trực tiếp hồ sơ đã xóa trả lỗi 'Không tìm thấy'

1. **Mã case**: TC-MAN-LHH-044
2. **Tiêu đề**: Truy cập trực tiếp hồ sơ đã xóa trả lỗi 'Không tìm thấy'
3. **Điều kiện tiên quyết**: Có hồ sơ đã xóa mềm; đăng nhập với navigationchannel:read/update/delete.
4. **Các bước thực hiện**:
   - Bước 1: Gọi GET/PUT/DELETE trên id đã xóa
5. **Dữ liệu đầu vào**:
   - Bước 1: GET/PUT/DELETE /api/v1/navigation-channel/{id-đã-xóa}
6. **Kết quả mong đợi**:
   - Bước 1: Lỗi 'Không tìm thấy luồng hàng hải với id', HTTP 400-family

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Lỗi 'Không tìm thấy luồng hàng hải với id'
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: AC-040-04, BR-040-04, TS-040-04. Loại: negative.

### TC-MAN-LHH-045 — Chi tiết hiển thị đủ 71 trường kèm orgUnitName

1. **Mã case**: TC-MAN-LHH-045
2. **Tiêu đề**: Chi tiết hiển thị đủ 71 trường kèm orgUnitName
3. **Điều kiện tiên quyết**: Có hồ sơ Luồng hàng hải; đăng nhập với navigationchannel:read.
4. **Các bước thực hiện**:
   - Bước 1: Mở chi tiết hồ sơ
   - Bước 2: Kiểm tra #1-#46 dữ liệu nhập, #47-#71 read-only, null hiển thị '—'
   - Bước 3: Kiểm tra cột Đơn vị quản lý hiển thị tên đơn vị
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel/{id}
   - Bước 2:
   - Bước 3: orgUnitId + orgUnitName
6. **Kết quả mong đợi**:
   - Bước 1: Hiển thị đủ #1-#71
   - Bước 2: #47-#71 read-only, null → '—'
   - Bước 3: orgUnitName được ánh xạ từ OrgUnitCacheService (không chỉ hiện UUID)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Đủ 71 trường
   - 2. #47-#71 read-only, null → '—'
   - 3. orgUnitName ánh xạ đúng
7. **Loại**: functional (equivalence, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-042-05, BR-042-04/06, TS-042-05; NavigationChannelService.resolveOrgUnitName + OrgUnitCacheService. Loại: positive.

### TC-MAN-LHH-046 — Lịch sử phê duyệt hiển thị đúng thứ tự và rỗng khi chưa có sự kiện

1. **Mã case**: TC-MAN-LHH-046
2. **Tiêu đề**: Lịch sử phê duyệt hiển thị đúng thứ tự và rỗng khi chưa có sự kiện
3. **Điều kiện tiên quyết**: Có hồ sơ đã qua submit + duyệt C1 + duyệt C2; và một hồ sơ chưa có sự kiện; đăng nhập với navigationchannel:history.
4. **Các bước thực hiện**:
   - Bước 1: Gọi history trên hồ sơ đã qua 3 bước
   - Bước 2: Gọi history trên hồ sơ chưa có sự kiện
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel/{id}/history
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: 3 sự kiện theo thứ tự giảm dần thời gian (C2, C1, submit)
   - Bước 2: Trả [] (HTTP 200), không lỗi

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 3 sự kiện đúng thứ tự DESC
   - 2. [] khi chưa có sự kiện
7. **Loại**: integration (state-transition, positive + boundary)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-043-01/03, BR-043-01/03/05, TS-043-01/03; sự kiện PROPOSED/APPROVED/REJECTED + approvalLevel. Loại: positive + boundary.

---

## Danh sách & bộ lọc (F-042)

### TC-MAN-LHH-047 — Danh sách đủ cột, StatusTabs, bộ lọc và phân trang

1. **Mã case**: TC-MAN-LHH-047
2. **Tiêu đề**: Danh sách đủ cột, StatusTabs, bộ lọc và phân trang
3. **Điều kiện tiên quyết**: Đăng nhập với navigationchannel:read; có dữ liệu luồng hàng hải.
4. **Các bước thực hiện**:
   - Bước 1: Mở màn danh sách Luồng hàng hải
   - Bước 2: Kiểm tra phân trang mặc định
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel
   - Bước 2: page=0, size=20
6. **Kết quả mong đợi**:
   - Bước 1: Hiển thị cột #4/#5/#6/#8/#47/#48 + StatusTabs + FilterBar + Pagination
   - Bước 2: Phân trang 20 bản ghi/trang, sort createdAt DESC

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Đủ cột + tabs + filter + phân trang
   - 2. Phân trang 0/20, sort createdAt DESC
7. **Loại**: functional (equivalence, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-042-01, BR-042-01, TS-042-01. Loại: positive.

### TC-MAN-LHH-048 — Lọc kết hợp nhiều filter, filter rỗng bị bỏ qua

1. **Mã case**: TC-MAN-LHH-048
2. **Tiêu đề**: Lọc kết hợp nhiều filter, filter rỗng bị bỏ qua
3. **Điều kiện tiên quyết**: Đăng nhập với navigationchannel:read; có dữ liệu.
4. **Các bước thực hiện**:
   - Bước 1: Kết hợp nhiều filter (đơn vị + cảng biển + tỉnh + tình trạng + keyword + trạng thái)
   - Bước 2: Gọi search với filter rỗng/không hợp lệ
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /search với orgUnitId, seaportId, provinceId, conditionStatus, keyword, approvalStatus
   - Bước 2: keyword = '' hoặc approvalStatus không hợp lệ
6. **Kết quả mong đợi**:
   - Bước 1: Danh sách lọc đúng, phân trang, kèm totalElements
   - Bước 2: Filter bị bỏ qua, không lỗi

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Lọc kết hợp đúng + totalElements
   - 2. Filter rỗng bị bỏ qua không lỗi
7. **Loại**: boundary (decision-table, boundary)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: AC-042-02, BR-042-02, TS-042-02. Loại: boundary.

### TC-MAN-LHH-049 — Data scope đọc: đơn vị con chỉ thấy hồ sơ subtree

1. **Mã case**: TC-MAN-LHH-049
2. **Tiêu đề**: Data scope đọc: đơn vị con chỉ thấy hồ sơ subtree
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản thuộc đơn vị con (không có orgunit:scope_all/admin:all); có hồ sơ thuộc nhiều đơn vị.
4. **Các bước thực hiện**:
   - Bước 1: Gọi danh sách
   - Bước 2: Thử GET chi tiết hồ sơ ngoài phạm vi
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel
   - Bước 2: GET /api/v1/navigation-channel/{id-ngoài-scope}
6. **Kết quả mong đợi**:
   - Bước 1: Chỉ thấy hồ sơ của đơn vị mình + subtree được phép
   - Bước 2: Bị chặn (403 hoặc không tìm thấy)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Chỉ thấy hồ sơ subtree
   - 2. Hồ sơ ngoài scope bị chặn
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-042-03/06, BR-042-05, TS-042-03/06. Loại: negative.

### TC-MAN-LHH-050 — StatusTabs counts: Tất cả = Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã duyệt + Từ chối

1. **Mã case**: TC-MAN-LHH-050
2. **Tiêu đề**: StatusTabs counts: Tất cả = Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã duyệt + Từ chối
3. **Điều kiện tiên quyết**: Đăng nhập với navigationchannel:read; có hồ sơ ở nhiều trạng thái.
4. **Các bước thực hiện**:
   - Bước 1: Đọc số lượng trên các tab trạng thái
   - Bước 2: Bấm tab 'Chờ Cảng vụ' (PENDING_APPROVAL)
5. **Dữ liệu đầu vào**:
   - Bước 1: Tất cả, Lưu tạm, Chờ Cảng vụ, Chờ Cục, Đã duyệt, Từ chối
   - Bước 2: GET /approval-status/PENDING_APPROVAL
6. **Kết quả mong đợi**:
   - Bước 1: Số lượng tab Tất cả = tổng 5 tab con
   - Bước 2: Chỉ trả hồ sơ đúng trạng thái

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Tất cả = tổng 5 tab con
   - 2. Tab trạng thái lọc đúng
7. **Loại**: boundary (decision-table, boundary)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: AC-042-04, TS-042-04; AGENTS.md quy chuẩn StatusTabs (Tất cả = tổng). Loại: boundary.

### TC-MAN-LHH-051 — Bộ lọc đơn vị dạng TreeSelect/Cascader giữ giá trị orgUnitId

1. **Mã case**: TC-MAN-LHH-051
2. **Tiêu đề**: Bộ lọc đơn vị dạng TreeSelect/Cascader giữ giá trị orgUnitId
3. **Điều kiện tiên quyết**: Đăng nhập với navigationchannel:read; danh mục đơn vị dạng cây có parentId.
4. **Các bước thực hiện**:
   - Bước 1: Mở bộ lọc Đơn vị quản lý
   - Bước 2: Chọn một đơn vị con và gọi search
5. **Dữ liệu đầu vào**:
   - Bước 1:
   - Bước 2: orgUnitId = <UUID đơn vị con>
6. **Kết quả mong đợi**:
   - Bước 1: Hiển thị dropdown dạng cây (TreeSelect/Cascader), không phải Select phẳng
   - Bước 2: Gửi orgUnitId (UUID), backend giới hạn phạm vi theo quyền

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Dropdown cây, không Select phẳng
   - 2. Giữ orgUnitId khi gọi API
7. **Loại**: functional (equivalence, positive)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: BR-042-03; AGENTS.md Bộ lọc đơn vị phân cấp. Loại: positive.

### TC-MAN-LHH-052 — Sắp xếp danh sách theo thời gian tạo giảm dần

1. **Mã case**: TC-MAN-LHH-052
2. **Tiêu đề**: Sắp xếp danh sách theo thời gian tạo giảm dần
3. **Điều kiện tiên quyết**: Đăng nhập với navigationchannel:read; có nhiều hồ sơ.
4. **Các bước thực hiện**:
   - Bước 1: Mở danh sách và quan sát thứ tự
5. **Dữ liệu đầu vào**:
   - Bước 1:
6. **Kết quả mong đợi**:
   - Bước 1: Hồ sơ mới nhất (createdAt lớn nhất) ở đầu danh sách

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Sort createdAt DESC
7. **Loại**: boundary (equivalence, boundary)
8. **Mức ưu tiên**: Minor
9. **Tham chiếu**: Tham chiếu: BR-042-01 (sort createdAt DESC). Loại: boundary.

### TC-MAN-LHH-053 — Danh sách: 4 trạng thái loading/error/empty/data

1. **Mã case**: TC-MAN-LHH-053
2. **Tiêu đề**: Danh sách: 4 trạng thái loading/error/empty/data
3. **Điều kiện tiên quyết**: Đăng nhập với navigationchannel:read.
4. **Các bước thực hiện**:
   - Bước 1: Mở danh sách khi API trả dữ liệu
   - Bước 2: Mở danh sách khi không có bản ghi
   - Bước 3: Mở danh sách khi API lỗi
   - Bước 4: Quan sát lúc đang tải
5. **Dữ liệu đầu vào**:
   - Bước 1:
   - Bước 2: Bộ lọc trả 0 bản ghi
   - Bước 3: Tắt backend hoặc endpoint lỗi
   - Bước 4:
6. **Kết quả mong đợi**:
   - Bước 1: Hiển thị bảng dữ liệu (data state)
   - Bước 2: Hiển thị EmptyState, bảng giữ chiều cao --list-table-scroll-y
   - Bước 3: Hiển thị error state rõ ràng
   - Bước 4: Hiển thị loading state

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Data state
   - 2. EmptyState, giữ chiều cao bảng
   - 3. Error state
   - 4. Loading state
7. **Loại**: negative (error-guessing, negative)
8. **Mức ưu tiên**: Normal
9. **Tham chiếu**: Tham chiếu: AGENTS.md list-screen-ui-standard (loading/error/empty/data). Loại: negative.

---

## Phân quyền navigationchannel:* (9 permission)

### TC-MAN-LHH-054 — Thiếu navigationchannel:create nhận 403

1. **Mã case**: TC-MAN-LHH-054
2. **Tiêu đề**: Thiếu navigationchannel:create nhận 403
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản có navigationchannel:read nhưng KHÔNG có navigationchannel:create.
4. **Các bước thực hiện**:
   - Bước 1: Gọi POST tạo mới
   - Bước 2: Kiểm tra UI
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /api/v1/navigation-channel
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden
   - Bước 2: Không hiển thị nút Tạo mới

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 403 khi thiếu create
   - 2. UI ẩn nút Tạo mới
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: BR-038-10, AC-038-10; NavigationChannelController.java @PreAuthorize create. Loại: negative.

### TC-MAN-LHH-055 — Thiếu navigationchannel:read nhận 403

1. **Mã case**: TC-MAN-LHH-055
2. **Tiêu đề**: Thiếu navigationchannel:read nhận 403
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản KHÔNG có navigationchannel:read.
4. **Các bước thực hiện**:
   - Bước 1: Gọi danh sách/tìm kiếm/chi tiết
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel, /search, /{id}
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 403 khi thiếu read
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-042-07, BR-042-07, TS-042-07. Loại: negative.

### TC-MAN-LHH-056 — Thiếu navigationchannel:update nhận 403

1. **Mã case**: TC-MAN-LHH-056
2. **Tiêu đề**: Thiếu navigationchannel:update nhận 403
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản có read nhưng KHÔNG có navigationchannel:update.
4. **Các bước thực hiện**:
   - Bước 1: Gọi PUT cập nhật
   - Bước 2: Kiểm tra UI
5. **Dữ liệu đầu vào**:
   - Bước 1: PUT /api/v1/navigation-channel/{id}
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden
   - Bước 2: Không hiển thị nút Sửa

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 403 khi thiếu update
   - 2. UI ẩn nút Sửa
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-039-07, TS-039-07. Loại: negative.

### TC-MAN-LHH-057 — Thiếu navigationchannel:delete nhận 403

1. **Mã case**: TC-MAN-LHH-057
2. **Tiêu đề**: Thiếu navigationchannel:delete nhận 403
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản KHÔNG có navigationchannel:delete.
4. **Các bước thực hiện**:
   - Bước 1: Gọi DELETE
   - Bước 2: Kiểm tra UI
5. **Dữ liệu đầu vào**:
   - Bước 1: DELETE /api/v1/navigation-channel/{id}
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden
   - Bước 2: Không hiển thị nút Xóa

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 403 khi thiếu delete
   - 2. UI ẩn nút Xóa
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-040-06, BR-040-05, TS-040-06. Loại: negative.

### TC-MAN-LHH-058 — Thiếu navigationchannel:approvec1 nhận 403

1. **Mã case**: TC-MAN-LHH-058
2. **Tiêu đề**: Thiếu navigationchannel:approvec1 nhận 403
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản có read nhưng KHÔNG có navigationchannel:approvec1.
4. **Các bước thực hiện**:
   - Bước 1: Gọi approve/reject cấp 1
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /{id}/approve/c1 hoặc /reject-level-1
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 403 khi thiếu approvec1
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-041-11; @PreAuthorize approvec1. Loại: negative.

### TC-MAN-LHH-059 — Thiếu navigationchannel:approvec2 nhận 403

1. **Mã case**: TC-MAN-LHH-059
2. **Tiêu đề**: Thiếu navigationchannel:approvec2 nhận 403
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản có read nhưng KHÔNG có navigationchannel:approvec2.
4. **Các bước thực hiện**:
   - Bước 1: Gọi approve/reject cấp 2
5. **Dữ liệu đầu vào**:
   - Bước 1: POST /{id}/approve/c2 hoặc /reject-level-2
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 403 khi thiếu approvec2
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: AC-041-11; @PreAuthorize approvec2. Loại: negative.

### TC-MAN-LHH-060 — Thiếu navigationchannel:history nhận 403

1. **Mã case**: TC-MAN-LHH-060
2. **Tiêu đề**: Thiếu navigationchannel:history nhận 403
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản có read nhưng KHÔNG có navigationchannel:history.
4. **Các bước thực hiện**:
   - Bước 1: Gọi history
   - Bước 2: Kiểm tra UI
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel/{id}/history
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: HTTP 403 Forbidden
   - Bước 2: Không hiển thị timeline lịch sử

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. 403 khi thiếu history
   - 2. UI ẩn timeline
7. **Loại**: security (error-guessing, negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: AC-043-05, BR-043-06, TS-043-05. Loại: negative.

### TC-MAN-LHH-061 — read:restricted / read:confidential kiểm soát metadata nhạy cảm

1. **Mã case**: TC-MAN-LHH-061
2. **Tiêu đề**: read:restricted / read:confidential kiểm soát metadata nhạy cảm
3. **Điều kiện tiên quyết**: Có hồ sơ với mức bảo mật khác nhau (securityLevel); đăng nhập tài khoản chỉ có read thường, và một tài khoản có read:restricted/read:confidential.
4. **Các bước thực hiện**:
   - Bước 1: Tài khoản chỉ có navigationchannel:read xem hồ sơ hạn chế/mật
   - Bước 2: Tài khoản có read:restricted/read:confidential xem hồ sơ tương ứng
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /{id} hồ sơ restricted/confidential
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Không thấy metadata nhạy cảm (người tạo, người sửa cuối, thời gian tạo/cập nhật) hoặc bị chặn theo recordSecurityLevelFilter
   - Bước 2: Thấy đúng metadata theo mức quyền được cấp

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. read thường không thấy metadata nhạy cảm
   - 2. read:restricted/confidential thấy đúng mức
7. **Loại**: security (decision-table, negative)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: F-038 §4.4 (read:restricted/read:confidential), BR-042-05 (recordSecurityLevelFilter), F-042 TS-042-06. Loại: negative.

### TC-MAN-LHH-062 — ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền

1. **Mã case**: TC-MAN-LHH-062
2. **Tiêu đề**: ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản ROLE_SYSTEM_ADMIN (không cần gán permission navigationchannel:* riêng).
4. **Các bước thực hiện**:
   - Bước 1: Thực hiện mọi thao tác (read/create/update/delete/approvec1/approvec2/history)
   - Bước 2: Lưu ý 4-eyes
5. **Dữ liệu đầu vào**:
   - Bước 1: GET/POST/PUT/DELETE/approve/history
   - Bước 2:
6. **Kết quả mong đợi**:
   - Bước 1: Toàn bộ thao tác thành công, không bị 403
   - Bước 2: ROLE_SYSTEM_ADMIN vượt kiểm tra quyền NHƯNG vẫn bị chặn bởi 4-eyes theo userId (BR-041-05)

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Mọi thao tác thành công (bypass quyền)
   - 2. Vẫn bị 4-eyes chặn nếu tự duyệt
7. **Loại**: security (equivalence, positive)
8. **Mức ưu tiên**: Critical
9. **Tham chiếu**: Tham chiếu: BR-038-10/BR-041-05 (ROLE_SYSTEM_ADMIN), F-038 §4.4 (Quản trị hệ thống). Loại: positive.

### TC-MAN-LHH-063 — Admin Cục xem full scope và metadata nhạy cảm

1. **Mã case**: TC-MAN-LHH-063
2. **Tiêu đề**: Admin Cục xem full scope và metadata nhạy cảm
3. **Điều kiện tiên quyết**: Đăng nhập tài khoản Admin Cục có orgunit:scope_all/admin:all/*.
4. **Các bước thực hiện**:
   - Bước 1: Mở danh sách/chi tiết toàn bộ đơn vị
   - Bước 2: Xem metadata nhạy cảm
5. **Dữ liệu đầu vào**:
   - Bước 1: GET /api/v1/navigation-channel
   - Bước 2: người tạo, người sửa cuối, thời gian tạo/cập nhật, field kiểm toán #47-#57
6. **Kết quả mong đợi**:
   - Bước 1: Thấy toàn bộ dữ liệu Luồng hàng hải trong phạm vi Cục
   - Bước 2: Admin Cục thấy metadata nhạy cảm (theo quyền) mà tài khoản khác không thấy

   Kết quả mong đợi tổng hợp (expected[]):
   - 1. Full scope toàn Cục
   - 2. Thấy metadata nhạy cảm
7. **Loại**: security (equivalence, positive)
8. **Mức ưu tiên**: Major
9. **Tham chiếu**: Tham chiếu: F-038 §4.4 Admin Cục + BR-042-05; AGENTS.md Data Scope (Cục full qua orgunit:scope_all/admin:all/*). Loại: positive.
