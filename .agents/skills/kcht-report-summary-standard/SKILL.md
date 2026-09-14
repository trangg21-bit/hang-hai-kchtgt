---
name: kcht-report-summary-standard
description: Quy chuẩn kiến trúc và giao diện màn hình tổng hợp báo cáo chi tiết KCHTGT hàng hải: Bảng thông tin chung (Master Summary Table) trên màn hình chính + Nút Chọn chỉ tiêu (ReportColumnSelector) + Popup Preview Modal (ReportPreviewModal) hiển thị chi tiết số liệu. Kích hoạt khi tạo mới, bảo trì hoặc refactor bất kỳ màn hình báo cáo thống kê nào trong hệ thống.
---

<!-- markdownlint-disable MD060 -->

# Quy Chuẩn Giao Diện Màn Hình Báo Cáo Tổng Hợp KCHT Hàng Hải

## 1. Bản chất kiến trúc và Yêu cầu Nghiệp vụ

Theo nghiệp vụ báo cáo thống kê hàng hải:

1. **Màn hình chính (Master View)**:
   - Khi bấm **Tổng hợp** từ sidebar bên trái, màn hình chính **KHÔNG ĐƯỢC ĐỔ THẲNG TOÀN BỘ DỮ LIỆU CHI TIẾT** (tránh vỡ bảng với hàng chục cột số liệu, tràn ngang làm người dùng khó bao quát).
   - Thay vào đó, màn hình chính hiển thị **Bảng thông tin chung (Master Summary Table)** gồm 1 bản ghi tổng hợp tổng quát:
     - STT: 1
     - Mã báo cáo: Mã VMD chuẩn hóa (BCKCHT_163, BCDL_176...)
     - Tên báo cáo: Tên biểu chuẩn nghiệp vụ (Biểu 01-N, Biểu 14-T...)
     - Đơn vị báo cáo: Tên Cảng vụ hàng hải hoặc đơn vị cấp dưới được chọn
     - Thời gian báo cáo: Năm báo cáo hoặc Khoảng ngày kết xuất
     - Thao tác: Xem trước chi tiết (icon con mắt), Xuất Excel (icon bảng tính), Xuất PDF (icon tài liệu).
2. **Nút Chọn chỉ tiêu (ReportColumnSelector)**:
   - Đặt ở thanh tác vụ trên đầu bảng thông tin chung.
   - Cho phép người dùng bật/tắt (ẩn/hiện) các cột thông tin trên bảng và điều chỉnh thứ tự hiển thị linh hoạt theo nhu cầu.

3. **Popup Preview Modal (ReportPreviewModal)**:
   - Bấm vào icon **Xem trước** (con mắt) trên dòng dữ liệu sẽ mở Modal toàn màn hình (width: 92vw, maxWidth: 1440px).
   - Modal chứa dải thẻ thông tin tóm tắt (Đơn vị, Thời gian, Thời điểm kết xuất) và **Bảng dữ liệu chi tiết** với đầy đủ các cột số liệu, nhóm phân cấp, phân loại tàu thuyền, luồng lạch, bến cảng, v.v.

---

## 2. Quy Chuẩn Tiêu Đề Cột (Table Header Standard) — MANDATORY

> [!IMPORTANT]
> **TUYỆT ĐỐI KHÔNG ĐỂ TIÊU ĐỀ CỘT BỊ CẮT XÉN HIỂN THỊ DẤU BA CHẤM ... VÀ BẮT BUỘC 100% TIÊU ĐỀ PHẢI CĂN GIỮA**
> (Ví dụ các lỗi vi phạm: cắt xén NĂNG LỰC NĂM TR..., CHIỀU DÀI BẾN CẢNG..., hoặc tiêu đề cái căn trái cái căn phải lộn xộn).

### Quy tắc định dạng tiêu đề cột trong ReportPreviewModal

1. **Xuống dòng tự nhiên**: Mọi tiêu đề cột có độ dài lớn bắt buộc phải tự động xuống dòng thành 2 hoặc 3 dòng (whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.35).
2. **Căn giữa 100% tiêu đề cột (Mandatory Header Centering)**:
   - Toàn bộ tiêu đề cột (thead th) **BẮT BUỘC CĂN GIỮA (textAlign: 'center')**.
   - Tuyệt đối không để tiêu đề căn trái hoặc căn phải theo nội dung ô dữ liệu bên dưới.
   - Nội dung ô dữ liệu trong thân bảng (tbody td) vẫn căn lề theo ngữ nghĩa:
     - Dạng văn bản / tên / danh mục: căn trái (left).
     - STT, mã, đơn vị tính, ngày tháng: căn giữa (center).
     - Số liệu, chiều dài, trọng tải, công suất: căn phải (right).
3. **Phá bỏ triệt để CSS cấm xuống dòng và ép căn giữa header**:
   - Ghi đè bắt buộc thuộc tính CSS trên bảng xem trước:

```css
     .report-preview-modal .ant-table-thead > tr > th,
     .report-preview-modal .ant-table-thead > tr > th *,
     .report-preview-modal-table .ant-table-thead > tr > th,
     .report-preview-modal-table .ant-table-thead > tr > th * {
       white-space: normal !important;
       word-break: break-word !important;
       overflow-wrap: break-word !important;
       text-overflow: unset !important;
       overflow: visible !important;
       line-height: 1.35 !important;
       text-align: center !important;
       justify-content: center !important;
     }
```
4. **Độ rộng cột hợp lý**: Cấp độ rộng (width) tối thiểu từ 160px - 220px cho các cột có tiêu đề dài để nội dung ngắt dòng hài hòa, cân đối.

---

## 3. Quy Chuẩn Đáy Modal (Footer Layout Standard) — MANDATORY

> [!IMPORTANT]
> **TỔNG SỐ DÒNG BẮT BUỘC NẰM TÁCH BIỆT Ở GÓC BÊN TRÁI ĐÁY MODAL**
> Cấm tuyệt đối việc ép sát thẻ Tổng số dòng ngay cạnh nút Xuất Excel.

### Quy tắc bố cục Footer trong ReportPreviewModal

1. **Flexbox 2 đầu (Space-between)**:
   - Footer của Modal phải sử dụng display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'.
   - Vùng bên trái: Thẻ Tag xanh hiển thị Tổng số dòng: {count.toLocaleString('vi-VN')} dạng viên thuốc (borderRadius: 999), tách biệt hoàn toàn.
   - Vùng bên phải: Cụm nút hành động gồm [Xuất Excel], [Xuất PDF], [Đóng].

2. **Ngăn chặn Ant Design Footer thu hẹp**:
   - Ghi đè CSS cho container footer của modal để luôn chiếm trọn 100% chiều rộng:

```css
     .report-preview-modal .ant-modal-footer {
       display: block !important;
       width: 100% !important;
       padding: 12px 24px !important;
       margin: 0 !important;
       border-top: 1px solid #f0f0f0 !important;
     }
```
---

## 4. Kiến Trúc Mã Nguồn & Component Chuẩn

Mọi logic hiển thị và modal xem trước được đóng gói tập trung, dùng chung cho toàn bộ 46 báo cáo:

| Component | Đường dẫn | Vai trò |
| --- | --- | --- |
| ReportViewer.tsx | frontend/src/pages/reports/ReportViewer.tsx | Màn hình chính: Sidebar bộ lọc + Thanh chọn chỉ tiêu + Master Summary Table |
| ReportColumnSelector.tsx | frontend/src/components/reports/ReportColumnSelector.tsx | Popover ẩn/hiện cột và sắp xếp thứ tự chỉ tiêu |
| ReportPreviewModal.tsx | frontend/src/components/reports/ReportPreviewModal.tsx | Modal xem trước chi tiết số liệu, hỗ trợ xuống dòng tiêu đề và footer space-between |
| reports.ts | frontend/src/config/reports.ts | Cấu hình metadata 46 báo cáo (mã VMD, tên biểu chuẩn hóa) |

---

## 5. Danh Sách 46 Báo Cáo Đã Hoàn Thành Chuẩn Hóa

### 5.1. Nhóm BCKCHT — Kết cấu hạ tầng (13 mã)

| STT | Mã KCHT | Mã VMD (vmdCode) | Tên Báo Cáo Chuẩn Hóa | Loại kỳ báo cáo |
| :---: | :-------: | :----------------: | :---------------------- | :---------------: |
| 1 | F-148 | BCKCHT_163 | Biểu 01-N: Năng lực thông qua bến cảng, cầu cảng | Năm |
| 2 | F-149 | BCKCHT_164 | Biểu 02-N: Năng lực thông qua cảng biển | Năm |
| 3 | F-150 | BCKCHT_165 | Biểu 03-N: Thống kê cầu cảng | Năm |
| 4 | F-151 | BCKCHT_166 | Biểu 03-N: Thống kê luồng | Năm |
| 5 | F-152 | BCKCHT_167 | Biểu 06-N: Thống kê vùng đón trả hoa tiêu, vùng quay trở tàu, ga tránh tàu, khu neo tránh trú bão | Năm |
| 6 | F-153 | BCKCHT_168 | Biểu 04-N: Thống kê khu chuyển tải, khu neo đậu | Năm |
| 7 | F-154 | BCKCHT_169 | Biểu 07-N: Thống kê bến phao, khu neo đậu | Năm |
| 8 | F-155 | BCKCHT_170 | Biểu 08-N: Thống kê hệ thống đèn biển | Năm |
| 9 | F-156 | BCKCHT_171 | Biểu 09-6T/N: Thống kê về hệ thống phao tiêu, báo hiệu trên luồng | Năm / 6 Tháng |
| 10 | F-157 | BCKCHT_172 | Biểu 10-6T/N: Thống kê phao tiêu, báo hiệu trên luồng | Năm / 6 Tháng |
| 11 | F-158 | BCKCHT_173 | Biểu 11-N: Thống kê về hệ thống giám sát và điều phối giao thông hàng hải (VTS) | Năm |
| 12 | F-159 | BCKCHT_174 | Biểu 12-N: Hệ thống các đài thông tin duyên hải | Năm |
| 13 | F-160 | BCKCHT_175 | Biểu 13-N: Thống kê về hệ thống đê, kè chắn sóng, chắn cát | Năm |

### 5.2. Nhóm BCDL — Chỉ tiêu đo lường (9 mã)

| STT | Mã KCHT | Mã VMD (vmdCode) | Tên Báo Cáo Chuẩn Hóa | Loại kỳ báo cáo |
| :---: | :-------: | :----------------: | :---------------------- | :---------------: |
| 14 | F-161 | BCDL_176 | Biểu 14-T: Báo cáo chi tiết tàu biển ra, vào cảng biển | Khoảng ngày |
| 15 | F-162 | BCDL_177 | Biểu 15-T: Báo cáo chi tiết phương tiện thủy nội địa ra, vào cảng biển | Khoảng ngày |
| 16 | F-163 | BCDL_178 | Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời tại khu vực cảng biển | Khoảng ngày |
| 17 | F-164 | BCDL_179 | Biểu 17-Q: Thống kê tàu biển Việt Nam vận tải quốc tế tại khu vực cảng biển | Khoảng ngày |
| 18 | F-165 | BCDL_180 | Biểu 16-T: Khối lượng hàng hóa, hành khách thông qua cảng (tháng) | Khoảng ngày |
| 19 | F-166 | BCDL_181 | Biểu 16-N: Khối lượng hàng hóa, hành khách thông qua cảng biển theo năm | Năm |
| 20 | F-167 | BCDL_182 | Biểu 17-T: Lượt tàu thuyền ra, vào cảng (tháng) | Khoảng ngày |
| 21 | F-168 | BCDL_183 | Biểu 19-T: Khối lượng hàng hóa thông qua cảng biển bằng đội tàu biển Việt Nam và phương tiện thủy nội địa | Khoảng ngày |
| 22 | F-169 | BCDL_184 | Biểu 20-T: Khối lượng hàng hóa, lượt tàu thông qua cảng biển, bến trong khu vực quản lý | Khoảng ngày |

### 5.3. Nhóm BCPTTV — Phương tiện và thuyền viên (3 mã)

| STT | Mã KCHT | Mã VMD (vmdCode) | Tên Báo Cáo Chuẩn Hóa | Loại kỳ báo cáo |
| :---: | :-------: | :----------------: | :---------------------- | :---------------: |
| 23 | F-170 | BCPTTV_185 | Biểu 21-6T/N: Thống kê thuyền viên, hoa tiêu hàng hải | Năm / 6 Tháng |
| 24 | F-171 | BCPTTV_186 | Biểu 22-6T/N: Thống kê tàu biển mang cờ quốc tịch Việt Nam | Năm / 6 Tháng |
| 25 | F-172 | BCPTTV_187 | Biểu 28-N: Thống kê tàu thuyền hoạt động dịch vụ lai dắt | Năm |

### 5.4. Nhóm BCDN — Doanh nghiệp (2 mã)

| STT | Mã KCHT | Mã VMD (vmdCode) | Tên Báo Cáo Chuẩn Hóa | Loại kỳ báo cáo |
| :---: | :-------: | :----------------: | :---------------------- | :---------------: |
| 26 | F-173 | BCDN_188 | Biểu 36–N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu biển | Năm |
| 27 | F-174 | BCDN_189 | Biểu 46-6T/N: Tổng hợp khối lượng hàng hóa thông qua cảng biển | Năm / 6 Tháng |

### 5.5. Nhóm BCTT48 — Thông tư 48 (5 mã)

| STT | Mã KCHT | Mã VMD (vmdCode) | Tên Báo Cáo Chuẩn Hóa | Loại kỳ báo cáo |
| :---: | :-------: | :----------------: | :---------------------- | :---------------: |
| 28 | F-175 | BCTT48_190 | Biểu số 06-N: Năng lực thông qua bến cảng, cầu cảng thông tư 48/2017/TT-BGTVT | Năm |
| 29 | F-176 | BCTT48_191 | Biểu 07-N: Năng lực thông qua cảng biển, cảng bến thủy nội địa địa phương và doanh nghiệp quản lý | Năm |
| 30 | F-177 | BCTT48_192 | Biểu 28-T: Khối lượng hàng hóa thông qua cảng | Khoảng ngày |
| 31 | F-178 | BCTT48_193 | Biểu 29-N: Khối lượng hàng hóa thông qua cảng | Năm |
| 32 | F-179 | BCTT48_194 | Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp và các hoạt động hỗ trợ vận tải đường sắt, đường thủy nội địa, đường biển | Năm |

### 5.6. Nhóm BCCNDB — Chuyên ngành bảo đảm (10 mã)

| STT | Mã KCHT | Mã VMD (vmdCode) | Tên Báo Cáo Chuẩn Hóa | Loại kỳ báo cáo |
| :---: | :-------: | :----------------: | :---------------------- | :---------------: |
| 33 | F-180 | BCCNDB_195 | Biểu Tổng hợp thông tin chung | Năm |
| 34 | F-181 | BCCNDB_196 | Biểu Tổng hợp thông tin kết cấu hạ tầng giao thông hàng hải | Năm |
| 35 | F-182 | BCCNDB_197 | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải | Năm |
| 36 | F-183 | BCCNDB_198 | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Cầu cảng | Năm |
| 37 | F-184 | BCCNDB_199 | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Luồng hàng hải | Năm |
| 38 | F-185 | BCCNDB_200 | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Báo hiệu hàng hải, Nhà trạm quản lý vận hành tiêu báo hiệu | Năm |
| 39 | F-186 | BCCNDB_201 | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đèn biển, Nhà trạm gắn với đèn biển | Năm |
| 40 | F-187 | BCCNDB_202 | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đê chắn sóng, Đê chắn cát, kè bảo vệ bờ | Năm |
| 41 | F-188 | BCCNDB_203 | Báo cáo kê khai, quản lý sử dụng tài sản kết cấu hạ tầng giao thông hàng hải | Năm |
| 42 | F-189 | BCCNDB_204 | Báo cáo tình hình hoạt động của hệ thống báo hiệu hàng hải và công trình đê, kè | Năm |

### 5.7. Nhóm BCTHTN — Tổng hợp theo ngày (4 mã)

| STT | Mã KCHT | Mã VMD (vmdCode) | Tên Báo Cáo Chuẩn Hóa | Loại kỳ báo cáo |
| :---: | :-------: | :----------------: | :---------------------- | :---------------: |
| 43 | F-180N | BCDL_180N | Biểu 12-T: Hàng hóa, hành khách theo ngày | Khoảng ngày |
| 44 | F-182N | BCDL_182N | Biểu 13-T: Lượt tàu thuyền vào, rời cảng theo ngày | Khoảng ngày |
| 45 | F-183N | BCDL_183N | Biểu 14-T: Hàng hóa, hành khách, lượt tàu đội tàu VN theo ngày | Khoảng ngày |
| 46 | F-184N | BCDL_184N | Biểu 15-T: Hàng hóa, lượt tàu theo bến / khu chuyển tải theo ngày | Khoảng ngày |

---

## 6. Các lỗi sai nghiêm trọng CẤM MẮC PHẢI (Anti-Patterns)

1. ❌ **CẤM đổ thẳng bảng dữ liệu chi tiết ra màn hình chính**:
   - Khiến màn hình chính vỡ giao diện với hàng chục cột số liệu rộng, không còn chỗ thao tác và khác biệt với chuẩn UI cũ của hệ thống.
2. ❌ **CẤM bỏ qua nút Chọn chỉ tiêu**:
   - Mọi màn hình báo cáo tổng hợp bắt buộc phải có nút [⚙ Chọn chỉ tiêu] gắn với `ReportColumnSelector` phía trên bảng.
3. ❌ **CẤM cắt xén tiêu đề cột với dấu ba chấm ...**:
   - Tiêu đề cột dài bắt buộc phải xuống dòng hiển thị trọn vẹn chữ (white-space: normal, word-break: break-word).
4. ❌ **CẤM ép sát nút Tổng số dòng cạnh nút Xuất Excel**:
   - Tổng số dòng: {count} bắt buộc nằm ở góc trái footer (marginRight: 'auto'), tách biệt rộng rãi với cụm nút xuất và đóng ở góc phải.
5. ❌ **CẤM căn trái hoặc căn phải tiêu đề cột**:
   - Toàn bộ tiêu đề cột (thead th) bắt buộc phải căn giữa (textAlign: 'center'). Căn lề số liệu (căn phải cho số, căn trái cho chữ) chỉ áp dụng cho nội dung ô trong thân bảng (tbody td), tuyệt đối không áp dụng cho tiêu đề cột.
6. ❌ **CẤM hardcode mã báo cáo dạng nội bộ (F-152) khi hiển thị**:
   - Ưu tiên hiển thị vmdCode (vd: BCKCHT_167) trên cột Mã báo cáo của bảng thông tin chung theo đúng ảnh chuẩn nghiệp vụ.
7. ❌ **CẤM làm mất các nút thao tác nghiệp vụ**:
   - Bảng thông tin chung phải luôn có đủ 3 icon thao tác: Xem trước 👁, Xuất Excel 📊, Xuất PDF 📄.
   - Đối với các biểu mẫu nhập/lưu số liệu (F-142, F-170..F-179), phải giữ nguyên các action Thêm mới, Chỉnh sửa, Lịch sử, Xóa.
8. ❌ **CẤM để xảy ra lỗi cảnh báo IDE / ESLint**:
   - Tuân thủ 100% quy tắc zero warnings, zero errors (không unused imports, không explicit any).

---

## 7. Checklist Kiểm tra & Nghiệm thu (QA Checklist)

- [ ] 1. Màn hình chính sau khi bấm Tổng hợp chỉ hiển thị bảng thông tin chung 1 dòng (STT, Mã VMD, Tên biểu, Đơn vị, Năm/Kỳ, Thao tác).
- [ ] 2. Bấm nút [⚙ Chọn chỉ tiêu] mở Popover có đủ checkbox ẩn hiện các cột, ẩn hiện STT, link Thiết lập lại và danh sách các cột.
- [ ] 3. Bật/tắt hoặc đổi thứ tự trong Chọn chỉ tiêu lập tức cập nhật tương ứng trên bảng thông tin chung.
- [ ] 4. Bấm icon con mắt 👁 trên dòng bản ghi mở Popup Preview Modal kích thước lớn (width: 92vw).
- [ ] 5. Trong Popup Preview Modal:
  - Tiêu đề 100% các cột **bắt buộc căn giữa (center-aligned)**, không có cột nào căn trái hay căn phải.
  - Tiêu đề các cột dài (như Chiều dài, Năng lực, Tàu neo đậu) **tự động xuống dòng hiển thị trọn vẹn chữ**, không bị cắt xén ....
  - Thân bảng: số liệu căn phải, STT/Mã/ĐVT căn giữa, Tên/Danh mục căn trái.
- [ ] 6. Dưới đáy Popup Preview Modal:
  - Thẻ Tổng số dòng: {count} nằm tách biệt ở **mép TRÁI**.
  - Cụm nút [Xuất Excel], [Xuất PDF], [Đóng] nằm gọn ở **mép PHẢI**.
- [ ] 7. Bấm [Xuất Excel] và [Xuất PDF] trong modal hoặc trên bảng hoạt động bình thường, tải về file đúng định dạng.
- [ ] 8. Chạy `npm test -- --run` và `npx tsc --noEmit`; cả hai phải đạt 100% với 0 lỗi, 0 cảnh báo.