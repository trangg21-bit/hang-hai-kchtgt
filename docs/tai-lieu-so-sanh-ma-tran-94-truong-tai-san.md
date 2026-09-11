# TÀI LIỆU ĐỐI SOÁT & SO SÁNH MA TRẬN 94 TRƯỜNG DỮ LIỆU
## TASK [59] TÀI SẢN HT TRUYỀN DẪN & TASK [60] TÀI SẢN HỆ THỐNG PHỤ TRỢ VTS
*(So sánh với bảng `infra_assets` và màn hình mẫu `/asset/berth`)*

---

## PHẦN 1. GIẢI THÍCH NGHIỆP VỤ BẢNG `infra_assets`

### 1. Bảng `infra_assets` đã có trong hệ thống chưa?
**CÓ, ĐÃ CÓ SẴN TRONG CSDL**.
* Bảng `infra_assets` ban đầu mang tên tiếng Việt là `tai_san_kcht` (Tài sản kết cấu hạ tầng giao thông).
* Tại bản cập nhật Flyway `V80__rename_asset_movement_tables_to_english.sql`, bảng được đổi tên chuẩn sang tiếng Anh là `infra_assets`.
* Ngày 09/09/2026, bản cập nhật `V20260909160000__add_port_terminal_asset_fields.sql` đã bổ sung đầy đủ các cột phục vụ chuẩn nghiệp vụ quản lý tài sản theo Thông tư / Nghị định của Bộ Giao thông vận tải & Bộ Tài chính.

### 2. Nghiệp vụ của bảng `infra_assets` dùng để làm gì?
Bảng `infra_assets` là **bảng trung tâm (Master Table)** dùng để lưu trữ toàn bộ **Hồ sơ lý lịch tài sản kết cấu hạ tầng (KCHT) giao thông hàng hải** trên toàn quốc. Nhiệm vụ chính:
1. **Lưu trữ thông tin định danh & kỹ thuật tài sản**: Mã tài sản (tự sinh duy nhất), Tên tài sản, Barcode, Tình trạng, Hiện trạng, Đơn vị tính, Số lượng, Năm xây dựng, Diện tích, Thông số kỹ thuật...
2. **Gắn kết phân cấp quản lý**: Đơn vị quản lý cấp trên, Đơn vị trực tiếp quản lý, Đơn vị sử dụng (theo cấu trúc cây đơn vị `orgUnitId`).
3. **Liên kết với đối tượng hạ tầng/thiết bị vật lý**:
   - Đối với Bến cảng $\rightarrow$ liên kết với bảng `berths` qua `berth_id`.
   - Đối với HT Truyền dẫn $\rightarrow$ liên kết với bảng `transmissions` qua `transmission_id` (hoặc `device_id`).
   - Đối với HT Phụ trợ VTS $\rightarrow$ liên kết với bảng `vts_assists` qua `vts_assist_id` (hoặc `device_id`).
4. **Theo dõi tài chính & khấu hao**: Nguyên giá tài sản, Tỷ lệ hao mòn/khấu hao, Giá trị còn lại, Khấu hao lũy kế, Khấu hao tháng...
5. **Theo dõi trạng thái phê duyệt 2 cấp**: `approval_status` (Lưu tạm, Chờ Cảng vụ duyệt, Chờ Cục duyệt, Đã duyệt, Từ chối) và người/ngày duyệt.

### 3. Bảng `infra_assets` có đúng với tên chức năng này không?
**HOÀN TOÀN ĐÚNG 100%**.
Trong thiết kế tổng thể của Cục Hàng hải Việt Nam (tài liệu `HH_Tính năng & danh sách các trường thông tin.xlsx` — Sheet `QL Tài sản (44->63)`):
* Cục có **20 loại tài sản KCHT** khác nhau (từ STT 44 Bến cảng, 45 Cầu cảng... 57 HT truyền dẫn, 60 HT phụ trợ VTS...).
* Cả 20 loại tài sản này **cùng chia sẻ chung 1 quy trình nghiệp vụ tài sản chuẩn** (Quản lý hồ sơ $\rightarrow$ Khấu hao $\rightarrow$ Khai thác $\rightarrow$ Tăng/giảm nguyên giá $\rightarrow$ Kiểm kê $\rightarrow$ Phê duyệt 2 cấp).
* Do đó, kiến trúc chuẩn là:
  * **Bảng chính `infra_assets`**: Lưu hồ sơ tài sản (phân biệt bằng cột `asset_type`: `PORT_TERMINAL`, `TRANSMISSION`, `VTS_ASSIST`...).
  * **Bảng `asset_exploitations`**: Lưu nhật ký khai thác tài sản (Tab 4).
  * **Bảng `asset_increase_requests`**: Lưu biến động tăng nguyên giá (Tab 5).
  * **Bảng `asset_decrease_requests`**: Lưu biến động giảm nguyên giá (Tab 5).
  * **Bảng `infrastructure_attachments`**: Lưu hồ sơ tệp đính kèm (Tab 2).
  * **Bảng `infrastructure_history`**: Lưu lịch sử phê duyệt và thay đổi (Tab 6).

---

## PHẦN 2. MA TRẬN ĐỐI SOÁT CHI TIẾT 94 TRƯỜNG DỮ LIỆU

Dưới đây là bảng đối soát chi tiết giữa **94 trường yêu cầu** với **Cơ sở dữ liệu (`infra_assets` & các bảng liên kết)**:

### TAB 1: THÔNG TIN CHUNG (Trường 1 – 25)

| STT | Tên trường (Yêu cầu) | Loại điều khiển UI | Bảng CSDL lưu trữ | Tên cột trong CSDL | Kiểu dữ liệu CSDL / Java | Trạng thái trong DB | Phạm vi hiển thị |
|:---:|---|---|---|---|---|:---:|---|
| **1** | Cơ quan quản lý cấp trên | SelectOrgCode (TreeSelect) | `infra_assets` | `parent_org_unit_id` | `UUID` / `UUID` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **2** | Đơn vị quản lý | SelectOrgCode (TreeSelect) | `infra_assets` | `org_unit_id` | `UUID` / `UUID` | ✅ Đã có sẵn | Bộ lọc, Xem CT, Tạo mới, Sửa |
| **3** | Đơn vị sử dụng | SelectOrgCode (TreeSelect) | `infra_assets` | `using_org_unit_id` | `UUID` / `UUID` | ✅ Đã có sẵn | DS, Bộ lọc, Xem CT, Tạo mới, Sửa |
| **4** | Mã thiết bị | Select (Dropdown) | `infra_assets` | `transmission_id` / `vts_assist_id` / `device_id` | `UUID` / `UUID` | 🆕 Đã tạo migration bổ sung | DS, Bộ lọc, Xem CT, Tạo mới, Sửa |
| **5** | Loại tài sản | Select | `infra_assets` | `asset_type` | `INTEGER` / `InfraAssetType` | ✅ Đã có sẵn (`TRANSMISSION`=5, `VTS_ASSIST`=6) | DS, Bộ lọc, Xem CT, Tạo mới, Sửa |
| **6** | Mã tài sản | Input Text (disabled, tự sinh) | `infra_assets` | `asset_code` | `VARCHAR(50)` / `String` | ✅ Đã có sẵn (sinh dạng `TS-TD-xxx` / `TS-PT-xxx`) | DS, Bộ lọc, Xem CT, Tạo mới, Sửa |
| **7** | Tên tài sản | InputTextArea | `infra_assets` | `asset_name` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn | DS, Bộ lọc, Xem CT, Tạo mới, Sửa |
| **8** | Barcode | Input Text | `infra_assets` | `barcode` | `VARCHAR(100)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **9** | Tình trạng tài sản | Select | `infra_assets` | `asset_condition` | `VARCHAR(100)` / `String` | ✅ Đã có sẵn (Tốt, Hư hỏng cần sửa chữa, Không sử dụng được) | DS, Bộ lọc, Xem CT, Tạo mới, Sửa |
| **10** | Hiện trạng sử dụng | Select | `infra_assets` | `usage_status` | `VARCHAR(100)` / `String` | ✅ Đã có sẵn (Đang sử dụng, Chưa sử dụng, Tạm dừng sử dụng) | DS, Xem CT, Tạo mới, Sửa |
| **11** | Nhóm tài sản | Select | `infra_assets` | `asset_group` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn (Nhà CTXD, Máy móc thiết bị, Khác) | DS, Xem CT, Tạo mới, Sửa |
| **12** | Phân nhóm tài sản | Input Text | `infra_assets` | `asset_subgroup` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **13** | Địa chỉ | InputTextArea | `infra_assets` | `address` | `VARCHAR(500)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **14** | Nguồn gốc | Select | `infra_assets` | `origin` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn (Mua sắm, ĐTXD, Được giao, Điều chuyển, Khác) | Xem CT, Tạo mới, Sửa |
| **15** | Số lượng | InputDecimal | `infra_assets` | `quantity` | `NUMERIC(15,3)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **16** | Đơn vị tính số lượng | Select | `infra_assets` | `quantity_unit` | `VARCHAR(50)` / `String` | ✅ Đã có sẵn (Cái, Bộ, Chiếc, m², m) | Xem CT, Tạo mới, Sửa |
| **17** | Model | Input Text | `infra_assets` | `model` | `VARCHAR(100)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **18** | Serial | Input Text | `infra_assets` | `serial_number` | `VARCHAR(100)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **19** | Xuất xứ | Input Text | `infra_assets` | `country_of_origin` | `VARCHAR(100)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **20** | Hãng sản xuất | Input Text | `infra_assets` | `manufacturer` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **21** | Năm xây dựng | DatePicker (Year: `YYYY`) | `infra_assets` | `construction_year` | `INTEGER` / `Integer` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **22** | Ngày sử dụng tài sản | DatePicker (`DD/MM/YYYY`) | `infra_assets` | `use_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | DS, Xem CT, Tạo mới, Sửa |
| **23** | Diện tích (đất, sàn sử dụng: m2) | InputDecimal | `infra_assets` | `land_area` | `NUMERIC(15,3)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **24** | Diện tích (sàn sử dụng: m2) | InputDecimal | `infra_assets` | `floor_area` | `NUMERIC(15,3)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **25** | Vị trí tài sản | InputTextArea | `infra_assets` | `asset_location` | `VARCHAR(500)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |

---

### TAB 2: HỒ SƠ TÀI SẢN (Trường 26)

| STT | Tên trường (Yêu cầu) | Loại điều khiển UI | Bảng CSDL lưu trữ | Tên cột trong CSDL | Kiểu dữ liệu CSDL / Java | Trạng thái trong DB | Phạm vi hiển thị |
|:---:|---|---|---|---|---|:---:|---|
| **26** | Tên file | Upload/Attachment | `infrastructure_attachments` & `infra_assets` | `attachment_name` / `file_path` / `file_name` | `VARCHAR(500)` | ✅ Đã có sẵn component chuẩn `InfrastructureAttachmentTab` | Xem CT, Tạo mới, Sửa |

---

### TAB 3: THÔNG TIN CHI TIẾT (TÀI CHÍNH & KHẤU HAO) (Trường 27 – 38)

| STT | Tên trường (Yêu cầu) | Loại điều khiển UI | Bảng CSDL lưu trữ | Tên cột trong CSDL | Kiểu dữ liệu CSDL / Java | Trạng thái trong DB | Phạm vi hiển thị |
|:---:|---|---|---|---|---|:---:|---|
| **27** | Ngày kê khai tài sản | DatePicker | `infra_assets` | `declaration_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **28** | Nguyên giá (nguồn ngân sách, nguồn khác) | InputMoney (VNĐ) | `infra_assets` | `original_value` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **29** | Tỷ lệ hao mòn/Khấu hao (%) | InputDecimal | `infra_assets` | `depreciation_rate` | `NUMERIC(7,4)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **30** | Giá trị còn lại | InputMoney (disabled, tự tính) | `infra_assets` | `remaining_value` | `NUMERIC(15,2)` / `BigDecimal` | ⚡ Tự động tính (`original_value - accumulated_depreciation`) | Xem CT, Tạo mới, Sửa |
| **31** | Đơn vị tính giá trị | Select (disabled, mặc định VNĐ) | `infra_assets` | N/A (quy chuẩn hiển thị hệ thống) | Fixed `VNĐ` | ✅ Mặc định VNĐ | Xem CT, Tạo mới, Sửa |
| **32** | Số quyết định giao (bao gồm cả tăng vốn) | Input Text | `infra_assets` | `assignment_decision_number` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **33** | Ngày tính khấu hao | DatePicker | `infra_assets` | `depreciation_start_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **34** | Số tháng tính khấu hao | Input Text / Number | `infra_assets` | `depreciation_months` | `INTEGER` / `Integer` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **35** | Ngày hết khấu hao | DatePicker | `infra_assets` | `depreciation_end_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **36** | Khấu hao lũy kế | InputMoney | `infra_assets` | `accumulated_depreciation` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tạo mới, Sửa |
| **37** | Khấu hao tháng | InputMoney (tự tính) | `infra_assets` | `monthly_depreciation` | `NUMERIC(15,2)` / `BigDecimal` | ⚡ Tự động tính (`original_value / depreciation_months`) | Xem CT, Tạo mới, Sửa |
| **38** | Hình thức xử lý tài sản | Select | `infra_assets` | `disposal_method` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn (Bán, Thanh lý, Điều chuyển, Tiêu hủy, Khác) | Xem CT, Tạo mới, Sửa |

---

### TAB 4: KHAI THÁC TÀI SẢN (Trường 39 – 50)

> *Lưu ý nghiệp vụ: Thông tin khai thác là quan hệ 1-N (một tài sản có thể có nhiều đợt khai thác theo thời gian), do đó được lưu tại bảng `asset_exploitations` gắn với `asset_id`.*

| STT | Tên trường (Yêu cầu) | Loại điều khiển UI | Bảng CSDL lưu trữ | Tên cột trong CSDL | Kiểu dữ liệu CSDL / Java | Trạng thái trong DB | Phạm vi hiển thị |
|:---:|---|---|---|---|---|:---:|---|
| **39** | Đơn vị khai thác | SelectOrgCode (TreeSelect) | `asset_exploitations` | `operator_org_unit_id` | `UUID` / `UUID` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **40** | Danh mục tài sản | Input Text (disabled) | `asset_exploitations` | `asset_category` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn (lấy theo tên tài sản) | Xem CT, Khai thác |
| **41** | Đơn vị tính | Select | `asset_exploitations` | `unit_of_measure` | `VARCHAR(50)` / `String` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **42** | Số lượng | InputDecimal | `asset_exploitations` | `quantity` | `NUMERIC(15,3)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **43** | Thời hạn khai thác | DatePicker | `asset_exploitations` | `exploitation_deadline` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **44** | Tổng số tiền thu được (VNĐ) | InputMoney | `asset_exploitations` | `total_revenue` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **45** | Chi phí có liên quan | InputMoney | `asset_exploitations` | `related_costs` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **46** | Nộp NSNN | InputMoney | `asset_exploitations` | `state_budget_payment` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **47** | Số tiền được thực hiện dự án | InputMoney | `asset_exploitations` | `project_amount` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **48** | Ghi chú (khai thác) | InputTextArea | `asset_exploitations` | `description` | `VARCHAR(1000)` / `String` | ✅ Đã có sẵn | Xem CT, Khai thác |
| **49** | Ngày cập nhật | Text (read-only) | `asset_exploitations` | `updated_at` | `TIMESTAMPTZ` / `Instant` | ✅ Đã có sẵn | Xem CT |
| **50** | Cán bộ cập nhật | Text (read-only) | `asset_exploitations` | `updated_by` | `UUID` (resolve sang Tên người dùng) | ✅ Đã có sẵn | Xem CT |

---

### TAB 5: LỊCH SỬ THAY ĐỔI NGUYÊN GIÁ (Trường 51 – 83)

> *Lưu ý nghiệp vụ: Lịch sử biến động tăng/giảm nguyên giá là quan hệ 1-N (một tài sản có thể có nhiều lần điều chỉnh tăng/giảm giá trị), được lưu tại 2 bảng `asset_increase_requests` và `asset_decrease_requests` gắn với `asset_id`.*

| STT | Tên trường (Yêu cầu) | Loại điều khiển UI | Bảng CSDL lưu trữ | Tên cột trong CSDL | Kiểu dữ liệu CSDL / Java | Trạng thái trong DB | Phạm vi hiển thị |
|:---:|---|---|---|---|---|:---:|---|
| **51** | Loại thay đổi nguyên giá | Select | `asset_increase_requests` / `decrease` | Phân loại Tăng / Giảm | `VARCHAR` | ✅ Đã có sẵn | Xem CT |
| **52** | Số QĐ tăng/giảm nguyên giá | Input Text | `asset_increase_requests` / `decrease` | `decision_number` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **53** | Ngày ra QĐ tăng/giảm | DatePicker | `asset_increase_requests` / `decrease` | `decision_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **54** | Ngày tăng/giảm nguyên giá | DatePicker | `asset_increase_requests` / `decrease` | `adjustment_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **55** | Lý do tăng/giảm nguyên giá | Select | `asset_increase_requests` / `decrease` | `adjustment_reason` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **56** | Ghi chú (điều chỉnh) | InputTextArea | `asset_increase_requests` / `decrease` | `notes` | `VARCHAR(1000)` / `String` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **57** | Nguyên giá trước khi tăng/giảm | InputMoney (disabled) | `asset_increase_requests` / `decrease` | `original_value_before` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **58** | Nguyên giá sau khi tăng/giảm | InputMoney (disabled) | `asset_increase_requests` / `decrease` | `original_value_after` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **59** | Giá trị còn lại trước khi tăng/giảm | InputMoney (disabled) | `asset_increase_requests` / `decrease` | `remaining_value_before` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **60** | Giá trị còn lại sau khi tăng/giảm | InputMoney (disabled) | `asset_increase_requests` / `decrease` | `remaining_value_after` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **61** | Ngày cập nhật | Text (read-only) | `asset_increase_requests` / `decrease` | `updated_at` | `TIMESTAMPTZ` / `Instant` | ✅ Đã có sẵn | Xem CT |
| **62** | Cán bộ cập nhật | Text (read-only) | `asset_increase_requests` / `decrease` | `updated_by` | `UUID` / `String` | ✅ Đã có sẵn | Xem CT |
| **63** | Trạng thái thay đổi nguyên giá | Text (read-only) | `asset_increase_requests` / `decrease` | `status` | `VARCHAR(50)` / `String` | ✅ Đã có sẵn | Xem CT |
| **64** | Ngày kê khai tài sản | DatePicker | `asset_increase_requests` / `decrease` | `declaration_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **65** | Nguyên giá | Input Text/Money | `asset_increase_requests` / `decrease` | `original_value` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **66** | Tỷ lệ hao mòn/Khấu hao (%) | Input Text/Decimal | `asset_increase_requests` / `decrease` | `depreciation_rate` | `NUMERIC(7,4)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **67** | Giá trị còn lại | InputMoney (disabled) | `asset_increase_requests` / `decrease` | `remaining_value` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **68** | Đơn vị tính | Input (disabled, mặc định VNĐ) | N/A | N/A | Fixed `VNĐ` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **69** | Số quyết định giao | Input Text | `asset_increase_requests` / `decrease` | `assignment_decision_number` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **70** | Ngày tính khấu hao | DatePicker | `asset_increase_requests` / `decrease` | `depreciation_start_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **71** | Số tháng tính khấu hao | Input Text/Number | `asset_increase_requests` / `decrease` | `depreciation_months` | `INTEGER` / `Integer` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **72** | Ngày hết khấu hao | Input Text/Date | `asset_increase_requests` / `decrease` | `depreciation_end_date` | `DATE` / `LocalDate` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **73** | Khấu hao lũy kế | Input Text/Money | `asset_increase_requests` / `decrease` | `accumulated_depreciation` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **74** | Khấu hao tháng | Input Text/Money | `asset_increase_requests` / `decrease` | `monthly_depreciation` | `NUMERIC(15,2)` / `BigDecimal` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **75** | Hình thức xử lý tài sản | Select | `asset_increase_requests` / `decrease` | `disposal_method` | `VARCHAR(200)` / `String` | ✅ Đã có sẵn | Xem CT, Tăng/Giảm |
| **76** | Ngày gửi phê duyệt | Text (read-only) | `asset_increase_requests` / `decrease` | `submitted_at` | `TIMESTAMPTZ` / `Instant` | ✅ Đã có sẵn | Xem CT |
| **77** | Cán bộ gửi phê duyệt | Text (read-only) | `asset_increase_requests` / `decrease` | `submitted_by` | `UUID` / `String` | ✅ Đã có sẵn | Xem CT |
| **78** | Ngày phê duyệt Cảng vụ/Chi cục | Text (read-only) | `asset_increase_requests` / `decrease` | `port_authority_approved_at` | `TIMESTAMPTZ` / `Instant` | ✅ Đã có sẵn | Xem CT |
| **79** | Cán bộ phê duyệt Cảng vụ/Chi cục | Text (read-only) | `asset_increase_requests` / `decrease` | `port_authority_approved_by` | `UUID` / `String` | ✅ Đã có sẵn | Xem CT |
| **80** | Nội dung phê duyệt C1 | Text (read-only) | `asset_increase_requests` / `decrease` | `port_authority_approval_content` | `VARCHAR(1000)` / `String` | ✅ Đã có sẵn | Xem CT |
| **81** | Ngày phê duyệt cấp Cục | Text (read-only) | `asset_increase_requests` / `decrease` | `department_approved_at` | `TIMESTAMPTZ` / `Instant` | ✅ Đã có sẵn | Xem CT |
| **82** | Cán bộ phê duyệt cấp Cục | Text (read-only) | `asset_increase_requests` / `decrease` | `department_approved_by` | `UUID` / `String` | ✅ Đã có sẵn | Xem CT |
| **83** | Nội dung phê duyệt C2 | Text (read-only) | `asset_increase_requests` / `decrease` | `department_approval_content` | `VARCHAR(1000)` / `String` | ✅ Đã có sẵn | Xem CT |

---

### TAB 6: XỬ LÝ & THEO DÕI (PHÊ DUYỆT 2 CẤP CỦA HỒ SƠ TÀI SẢN) (Trường 84 – 94)

| STT | Tên trường (Yêu cầu) | Loại điều khiển UI | Bảng CSDL lưu trữ | Tên cột trong CSDL | Kiểu dữ liệu CSDL / Java | Trạng thái trong DB | Phạm vi hiển thị |
|:---:|---|---|---|---|---|:---:|---|
| **84** | Trạng thái | Select (hiển thị Pill Badge) | `infra_assets` | `approval_status` | `INTEGER` / `ApprovalStatus` | ✅ Đã có sẵn (6 tab semantic) | DS, Bộ lọc, Xem CT |
| **85** | Cán bộ cập nhật | Text (hiển thị, không nhập) | `infra_assets` | `updated_by` | `UUID` (resolve sang tên CB) | ✅ Đã có sẵn | DS, Xem CT |
| **86** | Ngày cập nhật | DatePicker (hiển thị, không nhập) | `infra_assets` | `updated_at` | `TIMESTAMPTZ` / `LocalDateTime` | ✅ Đã có sẵn | DS, Bộ lọc, Xem CT |
| **87** | Ngày gửi phê duyệt | Text (read-only) | `infra_assets` | `submitted_at` | `TIMESTAMPTZ` / `Instant` | ✅ Đã có sẵn | DS, Xem CT |
| **88** | Cán bộ gửi phê duyệt | Text (read-only) | `infra_assets` | `submitted_by` | `UUID` / `String` | ✅ Đã có sẵn | DS, Xem CT |
| **89** | Ngày phê duyệt Cảng vụ/Chi cục | Text (read-only) | `infra_assets` | `port_authority_approved_at` | `TIMESTAMPTZ` / `Instant` | ✅ Đã có sẵn | DS, Xem CT |
| **90** | Cán bộ phê duyệt Cảng vụ/Chi cục | Text (read-only) | `infra_assets` | `port_authority_approved_by` | `UUID` / `String` | ✅ Đã có sẵn | DS, Xem CT |
| **91** | Nội dung phê duyệt C1 | Text (read-only) | `infra_assets` | `port_authority_approval_content` | `VARCHAR(1000)` / `String` | ✅ Đã có sẵn | Xem CT |
| **92** | Ngày phê duyệt cấp Cục | Text (read-only) | `infra_assets` | `department_approved_at` | `TIMESTAMPTZ` / `Instant` | ✅ Đã có sẵn | DS, Xem CT |
| **93** | Cán bộ phê duyệt cấp Cục | Text (read-only) | `infra_assets` | `department_approved_by` | `UUID` / `String` | ✅ Đã có sẵn | DS, Xem CT |
| **94** | Nội dung phê duyệt C2 | Text (read-only) | `infra_assets` | `department_approval_content` | `VARCHAR(1000)` / `String` | ✅ Đã có sẵn | Xem CT |

---

## PHẦN 3. KẾT LUẬN & ĐÁNH GIÁ KIẾN TRÚC

1. **Độ tương thích CSDL**:
   - Bảng `infra_assets` và các bảng biến động (`asset_exploitations`, `asset_increase_requests`, `asset_decrease_requests`) **đã bao phủ 93/94 trường dữ liệu**.
   - Trường duy nhất cần bổ sung khóa ngoại là **Trường số 4 (Mã thiết bị)**: Cần lưu ID của thiết bị Truyền dẫn (`transmissions`) hoặc Phụ trợ VTS (`vts_assists`). Việc bổ sung cột `transmission_id`, `vts_assist_id`, `device_id` vào `infra_assets` (như file migration vừa tạo) là giải pháp sạch nhất, chuẩn quan hệ CSDL quan hệ (Relational DB).

2. **Khả năng tái sử dụng thành phần (Reusability)**:
   - Toàn bộ giao diện List, Filter, StatusTabs, Drawer Form (`DynamicFormSidebar`), Drawer Chi tiết (`DynamicViewSidebar`) của màn `/asset/berth` có thể được tái sử dụng 100% cho 2 màn hình mới:
     - **Tài sản HT truyền dẫn** (`/asset/transmission`): Load dropdown Mã thiết bị từ API `GET /api/v1/transmissions/options`.
     - **Tài sản hệ thống phụ trợ VTS** (`/asset/vts-assist`): Load dropdown Mã thiết bị từ API `GET /api/v1/vts-assists/options`.
   - Cả 2 màn hình đều tuân thủ triệt để các Skill đã đăng ký (`kcht-status-tabs`, `kcht-dynamic-form-sidebar`, `kcht-dynamic-view-sidebar`) và tiêu chuẩn hiển thị Pill Badge, Ellipsis, Zero Warnings của dự án.
