# Báo cáo đối chiếu trường thông tin: Feature Brief M-002 / M-003 vs Excel "HH_Tính năng & danh sách các trường thông tin.xlsx"

| Mục | Nội dung |
|---|---|
| Người lập | AI Studio (build seat) |
| Ngày | 2026-08-23 |
| Nguồn đối chiếu 1 | `HH_Tính năng & danh sách các trường thông tin.xlsx` (workspace root) — **được xác nhận là nguồn sự thật về trường thông tin** |
| Nguồn đối chiếu 2 | Feature briefs của M-002 (Cảng & Bến) và M-003 (Khu nước & VTS) |
| Mục đích | Liệt kê từng trường lệch giữa brief và Excel để **BA/SA chốt hướng xử lý** trước khi cập nhật brief hoặc Excel |
| Trạng thái | Chờ BA/SA chốt |

---

## 1. Phương pháp

- Trích xuất toàn bộ 29 sheet chi tiết của Excel (8 cột: STT / Tên trường / Loại điều khiển / Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa).
- Đọc feature brief **Tạo mới** của từng entity (brief Tạo mới chứa bảng trường đầy đủ nhất); với entity không có brief Tạo mới (CSSCDT) dùng brief Cập nhật.
- Đối chiếu từng trường: tên, kiểu/loại điều khiển, bắt buộc, vị trí hiển thị (Danh sách / Bộ lọc / Chi tiết / Tạo mới / Sửa).
- Phân loại kết quả: ✅ Khớp / ⚠️ Lệch nhỏ (trường thừa/thiếu không ảnh hưởng luồng) / ❌ Lệch nghiêm trọng (bản chất dữ liệu khác nhau hoặc mâu thuẫn chức năng).

## 2. Tổng hợp kết quả

| # | Entity | Sheet Excel tương ứng | Feature brief | Kết quả |
|---|---|---|---|---|
| 1 | Cảng biển | `QL Cảng biển` | F-008 Tạo mới | ⚠️ Khớp ~90% — brief thừa 2 trường |
| 2 | Bến cảng | `QL Bến cảng` | F-014 Tạo mới | ⚠️ Khớp ~90% — brief thừa 4 trường |
| 3 | Cảng cạn | `QL Cảng cạn` | F-026 Tạo mới | ❌ Mâu thuẫn: Excel cấm Sửa, module có F-027 Cập nhật |
| 4 | Vùng nước | **KHÔNG có sheet** | F-032 Tạo mới | ❌ Excel thiếu sheet "Vùng nước" |
| 5 | Luồng hàng hải | `Luồng hàng hải` (71 trường) | F-038 Tạo mới | ❌ **Lệch hoàn toàn** — brief mô tả "lượng hàng", không phải "tuyến luồng" |
| 6 | Cơ sở SCDT | `QL cơ sở sửa chữa đóng tàu` | F-051 Cập nhật | ✅ Khớp tốt |
| 7 | Đê kè | `QL đê kè` | F-044 Tạo mới | ✅ Khớp tốt (lệch nhỏ về bắt buộc) |
| 8 | Trạm radar | `QL Trạm radar` | F-056 Tạo mới | ❌ Mâu thuẫn: Excel cấm Sửa, module có F-057 Cập nhật; brief thừa 2 trường |
| 9 | Hệ thống VTS | `Hệ thống VTS` | F-062 Tạo mới | ⚠️ Khớp ~90% — brief thừa 3 trường |

---

## 3. Chi tiết từng entity

### 3.1. Cảng biển — F-008 vs sheet `QL Cảng biển` (⚠️)

**Trường brief có nhưng KHÔNG có trong Excel:**

| Trường trong brief F-008 | Kiểu | Ghi chú brief | Trạng thái trong Excel |
|---|---|---|---|
| `area` | DECIMAL(15,2) ≥ 0 | Diện tích | ❌ Không có |
| `maxVesselCapacity` | DECIMAL(15,2) ≥ 0 | Khả năng tiếp nhận tàu | ❌ Không có |

**Khớp (xác nhận):** portCode (CB-XXXXXX) ↔ #1 Mã cảng biển; portName ↔ #4; orgUnitId ↔ #2; province ↔ #5; portClass ↔ #7 Phân cấp; portGroup ↔ #3 Nhóm cảng biển; waterAreaScope ↔ #8; GIS ↔ #23–26; coordinates ↔ #27 Tọa độ GPS (≥1 khi gửi duyệt); infrastructure ↔ #28 Công trình KCHT trực thuộc; attachments ↔ #29; remarks ↔ #30; operationalStatus ↔ #31 Trạng thái; chỉ số tổng hợp ↔ #9–22; kiểm toán ↔ #32–33.

### 3.2. Bến cảng — F-014 vs sheet `QL Bến cảng` (⚠️)

**Trường brief có nhưng KHÔNG có trong Excel:**

| Trường trong brief F-014 | Kiểu | Ghi chú brief | Trạng thái trong Excel |
|---|---|---|---|
| `length` | DECIMAL(15,2) ≥ 0 | Chiều dài | ❌ Không có (chiều dài/rộng là trường của **Cầu cảng**, không phải Bến cảng) |
| `width` | DECIMAL(15,2) ≥ 0 | Chiều rộng | ❌ Không có |
| `berthType` | enum CONTAINER/GENERAL_CARGO/… | Loại bến | ❌ Không có (Excel chỉ có `Loại kết cấu bến cảng` = structureType) |
| `channelDepth` | DECIMAL(10,2) ≥ 0 | Độ sâu kênh | ❌ Không có |

**Khớp (xác nhận):** berthCode `{mã-cảng-mẹ}-B{XX}` ↔ #3; berthName ↔ #4; portId ↔ #2; orgUnitId ↔ #1; provinceId ↔ #7; operationalStatus ↔ #17 Tình trạng; waterway ↔ #5; operator ↔ #6; structureType ↔ #9; operationalFunction ↔ #10; totalArea ↔ #11; designThroughput ↔ #12; currentThroughput ↔ #13; plannedThroughput ↔ #15; maxVesselSize ↔ #14; latestCargoVolume ↔ #16; công bố ↔ #18–20; GIS+tọa độ ↔ #21–25; attachments ↔ #26; log phê duyệt ↔ #28–37; vận hành/bảo trì/sự cố ↔ #40–51.

### 3.3. Cảng cạn — F-026 vs sheet `QL Cảng cạn` (❌ MÂU THUẪN CHỨC NĂNG)

**Mâu thuẫn chính:** Toàn bộ trường trong sheet `QL Cảng cạn` có cột **Sửa = false** (không được phép sửa ở màn Sửa). Nhưng M-002 đang có feature **F-027 "ql-cct-cap-nhat" (Cập nhật cảng cạn)** với đầy đủ mô tả luồng sửa.

| Câu hỏi cho BA/SA | Phương án |
|---|---|
| Cảng cạn có được phép **Sửa** không? | (a) Excel đúng → xóa/bỏ F-027; (b) Brief đúng → sửa Excel chuyển Sửa=true; (c) Sửa có điều kiện (vd: chỉ khi DRAFT, khóa ĐVQL) → ghi rõ điều kiện |

**Trường khớp (xác nhận):** dryPortCode (CC-XXXXXX) ↔ #4; dryPortName ↔ #5; orgUnitId ↔ #1; provinceId ↔ #6; detailedLocation ↔ #7; teuCapacity ↔ #9 Công suất; portStatus ↔ #14 Tình trạng; operatingUnit ↔ #2; region ↔ #3 Khu vực; transportCorridor ↔ #8; area ↔ #10; warehouseArea ↔ #11; yardArea ↔ #12; connectionMode ↔ #13; remarks ↔ #15; công bố ↔ #16–18; GIS ↔ #19–23; attachments ↔ #24; trạng thái phê duyệt ↔ #25; kiểm toán ↔ #26–27.

### 3.4. Vùng nước — F-032 (❌ EXCEL THIẾU SHEET)

Brief F-032 đặc tả entity `WaterZone` (bảng `water_zones`): waterZoneCode (VN-XXXXXX, tự sinh nếu để trống), waterZoneName, portId (cảng mẹ đang hoạt động), orgUnitId, area, maxDepth, avgDepth, waterZoneType (ANCHORAGE / PILOT_BOARDING / TURNING_BASIN / MOORING_BUOY / TRANSSHIPMENT / STORM_SHELTER), operationalStatus, provinceId, mapSymbolId/spatialId, coordinates[], attachments[], approvalStatus.

**Trạng thái trong Excel:** Không có sheet "Vùng nước" nào trong 29 sheet chi tiết. Sheet `QL TT quy hoạch bến cảng HH` là về **quy hoạch** (số QĐ, mục tiêu, dự báo hàng hóa), không phải vùng nước. Nhóm 30→43 chỉ có danh sách tên tính năng, không có "Vùng nước".

| Câu hỏi cho BA/SA | Phương án |
|---|---|
| Vùng nước (F-032) thuộc sheet nào trong Excel? | (a) Bổ sung sheet "Vùng nước" mới theo trường của F-032; (b) Vùng nước = "QL TT quy hoạch bến cảng HH" (xác nhận lại tên gọi) |

### 3.5. Luồng hàng hải — F-038 vs sheet `Luồng hàng hải` (❌ LỆCH HOÀN TOÀN)

Brief F-038 (status `proposed`, brief cũ 2026-06-29, viết tiếng Anh không dấu, **không theo template 7-section**) đang mô tả **"lượng hàng"** chứ không phải **"tuyến luồng hàng hải"**:

| | Brief F-038 hiện tại | Excel sheet `Luồng hàng hải` (71 trường) |
|---|---|---|
| Bản chất | Ghi nhận lượng hàng/tàu thông qua khu vực | Quản lý tuyến luồng hàng hải (fairway) |
| Trường | loai_tau, so_luong, ngay_ghi_nhan, gio_dien, tai_trong, dien_tich_dang_bo, ghi_chu | Mã LHH, Tên luồng, Thuộc cảng biển, Đơn vị vận hành, Trạm quản lý luồng, Số lượng phao/tiêu, Khối lượng nạo vét, Công bố mở, **Danh sách chi tiết luồng (bảng con tuyến luồng: chiều dài, độ sâu, bán kính vũng quay, chiều cao tĩnh không, mái dốc…)**, GIS, file, log phê duyệt 2 cấp… |
| Endpoint | `POST /api/v1/luong-hang-hai` | (chưa xác định — cần SA chốt) |

**Kết luận:** Brief F-038 cần được **viết lại hoàn toàn** theo đúng sheet `Luồng hàng hải` của Excel, theo template 7-section. Nội dung "lượng hàng" hiện tại nếu vẫn cần thì chuyển sang feature khác (vd: Sản lượng cảng biển — sheet 30→43).

### 3.6. Cơ sở sửa chữa đóng tàu — F-051 vs sheet `QL cơ sở sửa chữa đóng tàu` (✅ KHỚP)

- Brief F-051 (Cập nhật — không có brief Tạo mới F-050 trong module) khớp sheet: mã CSSCDT disabled ↔ #1; tên ↔ #2; ĐVQL ↔ #3; thuộc cảng biển ↔ #4; thuộc cầu cảng ↔ #5; địa điểm Tỉnh/TP ↔ #6; địa điểm chi tiết ↔ #7; tình trạng ↔ #8; 8 trường đặc thù (công năng sử dụng, diện tích nhà xưởng, loại tàu, cỡ tàu DWT, loại hình DN, hoạt động, số lượng triền đà, ghi chú) ↔ #9–16; GIS ↔ #17–21; file ↔ #22; log phê duyệt ↔ #23–33; vận hành/bảo trì/sự cố ↔ #34–45.
- Khóa trường ĐVQL + cảng biển khi sửa (BR-051-03) **khớp** Excel (Sửa=false cho #3, #4).
- ⚠️ Lưu ý nhỏ: thiếu brief Tạo mới F-050 — cần xác nhận có nằm trong phạm vi M-003 hay không.

### 3.7. Đê kè — F-044 vs sheet `QL đê kè` (✅ KHỚP, lệch nhỏ)

**Khớp (xác nhận):** ma (DK-{seq}, disabled) ↔ #1; tên ↔ #2; ĐVQL ↔ #3; thuộc cảng biển ↔ #4; đơn vị vận hành ↔ #5; địa điểm Tỉnh/TP ↔ #6; địa điểm chi tiết ↔ #7; loại kết cấu công trình ↔ #8; tình trạng ↔ #9; ghi chú ↔ #10; chiều dài/chiều cao/cao trình đỉnh ↔ #11–13; thời điểm xây dựng/đưa vào khai thác/năm bảo trì ↔ #14–16; log phê duyệt ↔ #17–27; GIS ↔ #28–32; file ↔ #33; vận hành/bảo trì/sự cố ↔ #34–45.

**Lệch nhỏ:**

| Điểm | Brief F-044 | Excel |
|---|---|---|
| Địa điểm chi tiết | Bắt buộc (AC-044-03) | Không ghi bắt buộc (#7: Textarea, hiển thị ở Tạo mới/Sửa) |
| Loại kết cấu | enum 7 giá trị (WAVE_BREAK_REVETMENT…) | Chỉ "Select (Dropdown)", không liệt kê giá trị |
| Trường cũ `surfaceMaterial` | ~~Loại bỏ~~ | Không có (nhất quán) |

### 3.8. Trạm radar — F-056 vs sheet `QL Trạm radar` (❌ MÂU THUẪN CHỨC NĂNG + lệch nhỏ)

**Mâu thuẫn chính:** Toàn bộ trường trong sheet `QL Trạm radar` có cột **Sửa = false**. Nhưng M-003 đang có feature **F-057 "quan-ly-tram-radar-cap-nhat" (Cập nhật trạm radar)**.

| Câu hỏi cho BA/SA | Phương án |
|---|---|
| Trạm radar có được phép **Sửa** không? | (a) Excel đúng → bỏ F-057; (b) Brief đúng → sửa Excel chuyển Sửa=true; (c) Sửa có điều kiện |

**Trường brief có nhưng KHÔNG có trong Excel:**

| Trường trong brief F-056 | Kiểu | Trạng thái trong Excel |
|---|---|---|
| `stationType` | VARCHAR(100), Loại trạm (Radar X/S) | ❌ Không có |
| `source` | VARCHAR(255), Nguồn gốc thiết bị | ❌ Không có |

**Khớp (xác nhận):** code (RADAR-{seq}) ↔ #1; tên ↔ #2; ĐVQL ↔ #3; cảng biển ↔ #4; VTS ↔ #5; TTDH VTS ↔ #6; đơn vị khai thác ↔ #7; Tỉnh/TP ↔ #8; địa điểm chi tiết ↔ #9; đơn vị tính ↔ #10; số lượng ↔ #11; tình trạng ↔ #12; chiều cao tháp ↔ #13; tầm hiệu lực ↔ #14; ghi chú ↔ #15; GIS ↔ #16–20; file ↔ #21; log phê duyệt ↔ #22–32; KCHT ↔ #33–34; vận hành/bảo trì/sự cố ↔ #35–46.

### 3.9. Hệ thống VTS — F-062 vs sheet `Hệ thống VTS` (⚠️)

**Trường brief có nhưng KHÔNG có trong Excel (màn hình Tạo mới):**

| Trường trong brief F-062 | Kiểu | Trạng thái trong Excel |
|---|---|---|
| Mức độ phụ trách | Text, max 255 | ❌ Không có |
| Nguồn gốc | Text, max 255 | ❌ Không có |
| Đối tác | Text, max 255 | ❌ Không có |

**Khớp (xác nhận):** ĐVQL ↔ #1; ghi chú ↔ #2; trạng thái phê duyệt ↔ #3; log phê duyệt ↔ #4–13; đơn vị chủ quản ↔ #14; đơn vị vận hành ↔ #15; thuộc cảng biển ↔ #16; mã VTS ↔ #17; tên VTS ↔ #18; Tỉnh/TP ↔ #19; địa điểm chi tiết ↔ #20; thời gian bắt đầu hoạt động ↔ #21; phạm vi áp dụng ↔ #22; thông báo hàng hải ↔ #23; tình trạng ↔ #24; bảng vùng VTS ↔ #25; file ↔ #26; KCHT khác ↔ #27–28; vận hành/bảo trì/sự cố ↔ #29–40.

---

## 4. Tổng hợp câu hỏi cần BA/SA chốt

| # | Câu hỏi | Liên quan | Phương án đề xuất |
|---|---|---|---|
| 1 | Cảng cạn có được Sửa không? | F-027 vs Excel (Sửa=false) | Xác nhận lại cột Sửa trong Excel |
| 2 | Trạm radar có được Sửa không? | F-057 vs Excel (Sửa=false) | Xác nhận lại cột Sửa trong Excel |
| 3 | F-038 nên đặc tả theo sheet `Luồng hàng hải` (tuyến luồng) — nội dung "lượng hàng" hiện tại xử lý thế nào? | F-038 | Viết lại brief theo Excel; chuyển "lượng hàng" sang feature khác (Sản lượng cảng biển) |
| 4 | Vùng nước (F-032) thuộc sheet Excel nào, hay cần bổ sung sheet mới? | F-032 | Bổ sung sheet "Vùng nước" theo entity WaterZone |
| 5 | Trường thừa trong brief so với Excel: `area`, `maxVesselCapacity` (Cảng biển); `length`, `width`, `berthType`, `channelDepth` (Bến cảng); `stationType`, `source` (Trạm radar); Mức độ phụ trách, Nguồn gốc, Đối tác (VTS) — giữ hay bỏ? | F-008, F-014, F-056, F-062 | Đề xuất: bỏ khỏi brief nếu Excel là nguồn sự thật; hoặc bổ sung vào Excel nếu nghiệp vụ cần |
| 6 | Địa điểm chi tiết (Đê kè) có bắt buộc không? | F-044 | Thống nhất brief ↔ Excel |
| 7 | CSSCDT thiếu brief Tạo mới (F-050) — có nằm trong phạm vi M-003 không? | M-003 | Xác nhận phạm vi |

---

## 5. Khuyến nghị

1. **Ưu tiên cao:** Viết lại F-038 theo sheet `Luồng hàng hải` (lệch bản chất dữ liệu — không thể để brief sai chạm tới code).
2. **Ưu tiên cao:** Chốt câu hỏi 1 & 2 (Sửa=false của Cảng cạn/Trạm radar) trước khi chạm vào F-027/F-057 — tránh phát triển chức năng mâu thuẫn tài liệu.
3. **Ưu tiên trung bình:** Bổ sung sheet "Vùng nước" vào Excel (F-032) hoặc xác nhận ánh xạ.
4. **Ưu tiên thấp:** Rà soát 11 trường thừa trong brief (mục 4, câu 5) để thống nhất 1 nguồn duy nhất.
5. Sau khi BA/SA chốt: cập nhật brief qua pipeline SDLC (M-002, M-003) và đồng bộ Excel theo quy tắc Auto-Sync SDLC Documentation.

---

*File này là workspace intel (tương tự `ui-audit-report.md`, `data-scope-gap-report.md`) — không phải artifact của Document Studio. Mọi quyết định của BA/SA ghi trực tiếp vào cột "Phương án đề xuất" hoặc bổ sung cột "Kết luận".*
