# Báo cáo đối chiếu M-004 vs Excel "HH_Tính năng & danh sách các trường thông tin.xlsx"

| Mục | Nội dung |
|---|---|
| Người lập | AI Studio (build seat) |
| Ngày | 2026-08-23 |
| Nguồn 1 | `HH_Tính năng & danh sách các trường thông tin.xlsx` (workspace root) — **nguồn sự thật đã được user xác nhận** |
| Nguồn 2 | 54 feature brief của M-004 (`docs/modules/M-004-quan-ly-tai-san-bao-hieu-thong-tin/_features/`) |
| Mục đích | Mapping entity↔sheet + xác định lệch trước khi **rewrite 1 lượt theo template 7-section + trường Excel** |
| Trạng thái | Đầu vào cho Bước 2 (rewrite 54 brief) |

---

## 1. Mapping entity ↔ sheet Excel ↔ features (54 = 9 entity × 6 thao tác)

| # | Entity | Sheet Excel | Số trường | Features (tạo/sửa/xóa/duyệt/xem/lịch sử) |
|---|---|---|---|---|
| 1 | Đèn biển | `QL Đèn biển và nhà trạm` (dòng 110) | 57 | F-068..F-073 |
| 2 | Phao tiêu | `QL Phao tiêu` (dòng 793) | 56 | F-074..F-079 |
| 3 | Nhà trạm phao | `QL Nhà trạm phao tiêu` (dòng 730) | 50 | F-080..F-085 |
| 4 | Nhà trạm đèn | phần "Thông tin nhà trạm" trong sheet `QL Đèn biển và nhà trạm` (#23–28) | ~30 | F-086..F-091 |
| 5 | Đài TTDH | `Đài TTDH` (dòng 1494) | 40 | F-092..F-097 |
| 6 | Đài Inmarsat | `Đài Inmarsat` (dòng 1604) | 40 | F-098..F-103 |
| 7 | Đài Cospas-Sarsat | `Đài Cospas-Sarsat` (dòng 1707) | 40 | F-104..F-109 |
| 8 | Đài LRIT | `Đài LRIT` (dòng 1656) | 39 | F-110..F-115 |
| 9 | Đài TTXLTT Hà Nội | `Đài TTXLTT Hà Nội` (dòng 1759) | 38 | F-116..F-121 |

> ⚠️ Sheet `Hệ thống VHF` (dòng 1546, 46 trường) **KHÔNG có feature nào** trong M-004 — cần xác nhận VHF thuộc module khác (M-005? M-003?) khi lập kế hoạch, không nằm trong phạm vi rewrite này.

## 2. Trạng thái brief hiện tại (đã phân loại bằng grep)

| Format | Số brief | Ghi chú |
|---|---|---|
| **Intake cũ** (`## Description`, không 7-section) | **48** | F-068..F-091 trừ nhóm đài + F-098..F-121 — cần rewrite toàn bộ |
| **BA rewrite cũ** (`## 1. Tổng quan`, không phải template 7-section chuẩn) | **6** | F-092..F-097 (Đài TTDH, BA xử lý 2026-08-11) — cần chuyển sang 7-section chuẩn |
| Theo `docs/feature-brief-template.md` (7 section) | **0** | Không brief nào đạt chuẩn |

**Kết luận:** cả 54 brief đều cần viết lại theo template 7-section — không có brief nào giữ nguyên được.

## 3. Lệch trường chính (bằng chứng từ brief mẫu)

### 3.1. F-068 Đèn biển — brief cũ mô tả entity KHÁC sheet Excel

| Brief F-068 hiện tại | Sheet `QL Đèn biển và nhà trạm` |
|---|---|
| code, name, type (LIGHTHOUSE / BEACON_LIGHT / BEACON_MARK) | Mã đèn biển (disabled, tự sinh), Tên đèn biển, Đơn vị quản lý (SelectOrgCode), Thuộc cảng biển (SelectKcht CB), Đơn vị vận hành, Địa điểm Tỉnh/TP, Tình trạng |
| lightRange, lightColor, lightCharacteristic, range | Chiều cao tháp đèn (m), Chiều cao tâm sáng (m), Tầm hiệu lực địa lý, Tầm hiệu lực ánh sáng, Màu sắc tháp đèn, Nguồn năng lượng |
| unitId, lastMaintenanceDate, nextMaintenanceDate, isActive | Thông tin nhà trạm (Địa điểm đặt trạm đèn, Kết cấu, Diện tích, Diện tích sử dụng, Số lượng nhân sự), Cấp trạm đèn, Địa bàn, Đặc điểm nhận dạng, Hình dạng |
| Không có GIS | Loại đối tượng / Biểu tượng / Hệ quy chiếu / Quy tắc hiển thị / Tọa độ (LongLatTable) |
| Không có log phê duyệt | Log 2 cấp: gửi duyệt → Cảng vụ/Chi cục → Cục (11 trường) + Trạng thái |
| Không có vận hành/bảo trì/sự cố | 3 khối read-only (#46–57) |

→ **Lệch toàn bộ** — không trường nào trùng trực tiếp.

### 3.2. F-074 Phao tiêu — tương tự, lệch toàn bộ

Brief cũ mô tả `code/name/type (CARDINAL/SECTOR/...)`; Excel yêu cầu: Đơn vị quản lý, Thuộc nhà trạm QLVH (SelectKcht ATHH/NT), Phân loại / Phân loại phao / Phân loại tiêu, Mã `{mã nhà trạm}-PT-{seq}`, Tên, Tình trạng, Hình dáng, Kết cấu, Diện tích, Chiều cao thân phao, Đường kính phao, Đèn biển, Chiều cao tháp đèn, Chiều cao tâm sáng (hải đồ), Chủng loại đèn, Màu sắc, Nguồn cung cấp, Phạm vi chiếu sáng, Thời điểm, Đặc tính ánh sáng (Màu/Kiểu chớp/Chu kỳ), GIS, file, log 2 cấp, vận hành/bảo trì/sự cố.

### 3.3. F-092 Đài TTDH — BA đã rewrite, trường khớp khá tốt nhưng thiếu template 7-section

Brief hiện tại có nhóm A (hành chính: ĐVQL, ĐV khai thác, Mã DTTDH-{seq}, Tên, Phân loại đài, Tỉnh/TP, Địa điểm chi tiết, Vùng phủ sóng, Dịch vụ, Tình trạng, Ghi chú) — **khớp sheet `Đài TTDH` #1–11** tốt. Nhưng cấu trúc file không phải 7-section chuẩn, thiếu bảng cờ hiển thị (Danh sách/Bộ lọc/Xem chi tiết/Tạo mới/Sửa), thiếu khối GIS/log đầy đủ ở dạng bảng.

## 4. ⚠️ Mâu thuẫn Sửa=false trong Excel (giống M-002/M-003 — cần BA/SA chốt)

| Sheet | Cột Sửa | Feature cập nhật tương ứng | Mâu thuẫn |
|---|---|---|---|
| `Đài TTDH` | **false với TOÀN BỘ trường** (kể cả GIS) | F-093 "Cập nhật Đài TTDH" | ✅ Có — giống Cảng cạn/Trạm radar |

Các sheet còn lại (Đèn biển, Phao tiêu, Nhà trạm phao, Inmarsat, Cospas-Sarsat, LRIT, TTXLTT HN) đều `Sửa=true` cho trường nghiệp vụ — không mâu thuẫn.

> Quyết định xử lý đợt này: **giữ nguyên nội dung feature cập nhật (F-093) và ghi chú mâu thuẫn trong brief** (banner ⚠️), không tự xóa — giống cách xử lý F-027 M-002.

## 5. Quy ước chuẩn áp dụng cho cả 54 brief (Bước 2)

1. **Template 7 section** đúng `docs/feature-brief-template.md`: Mô tả ngắn / Trường dữ liệu / Trạng thái và phê duyệt / Quy tắc và phân quyền riêng / Điểm khác biệt (8 dòng) / Phần kỹ thuật — đường dẫn / Phần kỹ thuật — cấu trúc bảng.
2. **Section 2 — bảng trường** cột: `STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú` — lấy nguyên từ sheet Excel (tên trường tiếng Việt + loại điều khiển + 5 cờ).
3. **Phê duyệt 2 cấp** (Cảng vụ/Chi cục → Cục), 7 trạng thái theo tài liệu nền mục 3.5, log ghi tự động.
4. **Phân quyền** dạng `<resource>:<action>` + Admin Cục (full dữ liệu + metadata người tạo/sửa).
5. **GIS 5 trường** cố định (Loại đối tượng / Biểu tượng / Hệ quy chiếu / Quy tắc hiển thị / Tọa độ).
6. **Khối read-only** vận hành khai thác / bảo trì / sự cố ở mọi sheet (brief Tạo mới/Cập nhật tham chiếu, brief Xem chi tiết hiển thị đủ).
7. Giữ nguyên frontmatter `id/name/slug/module-id/classification/priority`; cập nhật `last-updated`; `status` giữ nguyên.
8. Resource prefix gợi ý: `denbien:*`, `phaotieu:*`, `nhatramphao:*`, `nhatramden:*`, `dai-ttdh:*`, `dai-inmarsat:*`, `dai-sarsat:*`, `dai-lrit:*`, `dai-ttxltt-hn:*` (BA/SA chốt khi viết).

## 6. Kế hoạch Bước 2 (rewrite 54 brief — 9 nhóm độc lập, không chia sẻ file)

| Nhóm | Features | Sheet nguồn | Worker |
|---|---|---|---|
| W1 | F-068..F-073 (Đèn biển) | QL Đèn biển và nhà trạm | general #1 |
| W2 | F-074..F-079 (Phao tiêu) | QL Phao tiêu | general #2 |
| W3 | F-080..F-085 (Nhà trạm phao) | QL Nhà trạm phao tiêu | general #3 |
| W4 | F-086..F-091 (Nhà trạm đèn) | Phần nhà trạm của sheet Đèn biển | general #4 |
| W5 | F-092..F-097 (Đài TTDH) | Đài TTDH | general #5 |
| W6 | F-098..F-103 (Đài Inmarsat) | Đài Inmarsat | general #6 |
| W7 | F-104..F-109 (Đài Cospas-Sarsat) | Đài Cospas-Sarsat | general #7 |
| W8 | F-110..F-115 (Đài LRIT) | Đài LRIT | general #8 |
| W9 | F-116..F-121 (Đài TTXLTT HN) | Đài TTXLTT Hà Nội | general #9 |

Mỗi worker: đọc sheet Excel + brief hiện tại (giữ frontmatter + ngữ cảnh nghiệp vụ) → viết 6 brief đầy đủ 7-section → **ghi vào `docs/_drafts/`** (không ghi `docs/modules/` do write-gate bind feature-scope) → build seat move vào đích bằng `apply_patch Move`.

---

*File này là workspace intel — đầu vào cho Bước 2; mọi câu hỏi chưa chốt (VHF thuộc module nào, Sửa=false Đài TTDH) ghi lại để BA/SA quyết.*
