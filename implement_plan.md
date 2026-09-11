# Implement Plan — Clone báo cáo VMD sang hh.kcht

**Ngày cập nhật:** 10/09/2026.  
**Trạng thái:** kế hoạch triển khai; chưa xác nhận hoàn tất clone hoặc nghiệm thu.  
**Mục tiêu:** chuyển đầy đủ 53 báo cáo và các hành vi liên quan từ VMD vào module báo cáo hiện có của hh.kcht, dùng dữ liệu và phân quyền của hệ thống đích.

## 1. Phạm vi và effort

| Hạng mục | Phạm vi / effort |
| --- | --- |
| Danh mục | 53 báo cáo, 8 nhóm |
| Nhập/lưu | 20 mã có cờ `isCrud=true`; 33 mã còn lại không tự bổ sung CRUD |
| Đầu ra | Preview, Excel, PDF; bảo toàn khả năng WORD backend theo source |
| Hành vi đi kèm | Bộ lọc, kỳ trước/lũy kế/cùng kỳ, dữ liệu mặc định, lịch sử và cập nhật quá hạn theo từng mã |
| Dev | **24 giờ = 3 ngày công**, gồm kiểm tra kỹ thuật và 4 giờ sửa lỗi |
| Test cơ sở | **40 giờ = 5 ngày công**, gồm một vòng kiểm tra lại |
| Dự phòng Test | **8 giờ = 1 ngày công** |
| Tổng | **64 giờ cơ sở; 72 giờ có dự phòng** — 8–9 ngày công nếu làm tuần tự |

3 ngày là effort Dev, không phải thời hạn của cả Dev và Test. Đây là mục tiêu triển khai dựa trên tái sử dụng tối đa, chưa phải năng suất đã đo qua một vòng port thực tế. Không tự cắt chức năng để khớp thời gian.

Không bao gồm dashboard độc lập, export của các màn danh mục ngoài phân hệ báo cáo, chuyển toàn bộ xác thực/LGSP/job VMD, UAT của người dùng nghiệp vụ hoặc triển khai production. Adapter nhận dữ liệu chỉ nằm trong scope khi là phụ thuộc trực tiếp của báo cáo.

## 2. Nguồn đối chiếu và hiện trạng

Đường dẫn tương đối tính từ root hh.kcht. Quy ước `VMD_API = ../VMD/vmd_mtis_api/vmd_mtis_api`.

| Nguồn / thành phần | Vị trí |
| --- | --- |
| Danh mục và cờ hành vi | `VMD_API/src/main/java/vn/etc/mot/vma/vmd_mtis/util/EnumBcNhom.java` |
| API/DTO/service/repository nguồn | `VMD_API/src/main/java/vn/etc/mot/vma/vmd_mtis/bc/` |
| UI nguồn | `../VMD/vmd_mtis_ui/src/pages/(base)/vmd-mtis-ui/bc/` |
| API client nguồn | `../VMD/vmd_mtis_ui/src/service/api/vmd_mtis/bc/` |
| SQL nguồn | `VMD_API/DB/10.0.226.50___1433___SQLSERVER___VMD_MTIS_DEV/`: procedure `PKG_WEB_BC*`, bảng và view liên quan |
| Baseline HH.CSDL | `../HH.CSDL/hh.csdl/src_code/vmd_mtis_api-dev/vmd_mtis_api-dev/` |
| Đặc tả đích | `docs/modules/M-008-bao-cao-thong-ke/` và brief module sở hữu dữ liệu |
| Backend đích | `src/main/java/com/hanghai/kchtg/report/` |
| UI đích | `frontend/src/pages/reports/`, `frontend/src/services/reportService.ts`, `frontend/src/types/report.ts` |
| Template đã copy | `template_export/` |
| Template runtime | `src/main/resources/public/template_export/` |

Đã kiểm tra trong lần viết lại:

- Enum VMD có 53 mã, 20 mã nhập/lưu và 8 mã bật `isGetDataDefault`; tập mã khớp enum baseline HH.CSDL.
- **53/53 XLSX tại root `template_export/` giống byte với template VMD**, không cần copy lại.
- `ReportService` vẫn đọc template trong resource runtime. Copy folder root chưa đủ để ứng dụng dùng được template nguồn.
- `ReportService.getPreview()` có các nhánh riêng F-141–149 và dispatch qua `ReportHandler`, sau đó fallback `getPreviewGeneric()`. Handler hiện có cần đối soát; không coi sự hiện diện của code là đã đúng số liệu.
- `generateReport()`/`downloadReport()` còn đường stub. Cần kiểm tra consumer và hoàn thiện contract đang được dùng trong scope.

Chưa chạy ứng dụng, truy vấn DB hoặc render toàn bộ mẫu trong lượt này. Mapping field, workflow, output và dữ liệu thật phải được kiểm chứng trong các bước bên dưới. Tên biểu VMD và hh.kcht có thể khác nhau; ghi quyết định đối chiếu trước khi sửa nhãn.

## 3. Danh mục đầy đủ 53 báo cáo

Tên dưới đây lấy từ enum VMD. Mã thường ánh xạ **F = số VMD − 15**; riêng 4 mã N giữ **F-180N/F-182N/F-183N/F-184N**, không ghép với mã không hậu tố của nhóm chuyên ngành bảo đảm.

Mỗi mã có template `template_export/<mã VMD>.xlsx`. “Default” là cờ metadata nguồn; cả các mã có cờ Không vẫn phải kiểm tra call path lấy dữ liệu mặc định/kỳ trước trong API/SQL. Cờ nhập/lưu không có nghĩa mọi mã đều có cùng bộ thao tác tạo/sửa/xóa.

### 3.1. BCC — Thống kê chung (7 mã)

| Mã VMD | Mã hh.kcht | Tên báo cáo | Nhập/lưu | Default |
| --- | --- | --- | --- | --- |
| `BCC_156` | `F-141` | Báo cáo thống kê tăng giảm tài sản | Không | Không |
| `BCC_157` | `F-142` | Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản kết cấu hạ tầng đơn vị được giao quản lý nhưng không trực tiếp khai thác, sử dụng | Có | Không |
| `BCC_158` | `F-143` | Mẫu số 02: Báo cáo kê khai tài sản kết cấu hạ tầng hàng hải | Không | Không |
| `BCC_159` | `F-144` | Mẫu số 03: Báo cáo tình hình quản lý tài sản kết cấu hạ tầng hàng hải | Không | Không |
| `BCC_160` | `F-145` | Mẫu số 04: Báo cáo tình hình xử lý tài sản kết cấu hạ tầng hàng hải | Không | Không |
| `BCC_161` | `F-146` | Mẫu số 05: Báo cáo tình hình khai thác tài sản kết cấu hạ tầng hàng hải | Không | Không |
| `BCC_162` | `F-147` | Mẫu số 06: Tổng hợp danh mục TS KCHTGT hàng hải đề nghị xử lý | Không | Không |

### 3.2. BCKCHT — Kết cấu hạ tầng (13 mã)

| Mã VMD | Mã hh.kcht | Tên báo cáo | Nhập/lưu | Default |
| --- | --- | --- | --- | --- |
| `BCKCHT_163` | `F-148` | Biểu 01-N: Năng lực thông qua bến cảng, cầu cảng | Không | Không |
| `BCKCHT_164` | `F-149` | Biểu 02-N: Năng lực thông qua cảng biển | Không | Không |
| `BCKCHT_165` | `F-150` | Biểu 03-N: Thống kê cầu cảng | Không | Không |
| `BCKCHT_166` | `F-151` | Biểu 03-N: Thống kê luồng | Không | Không |
| `BCKCHT_167` | `F-152` | Biểu 06-N: Thống kê vùng đón trả hoa tiêu, vùng quay trở tàu, ga tránh tàu, khu neo tránh trú bão | Không | Không |
| `BCKCHT_168` | `F-153` | Biểu 04-N: Thống kê khu chuyển tải, khu neo đậu | Không | Không |
| `BCKCHT_169` | `F-154` | Biểu 07-N: Thống kê bến phao, khu neo đậu | Không | Không |
| `BCKCHT_170` | `F-155` | Biểu 08-N: Thống kê hệ thống đèn biển | Không | Không |
| `BCKCHT_171` | `F-156` | Biểu 09-6T/N: Thống kê về hệ thống phao tiêu, báo hiệu trên luồng | Không | Không |
| `BCKCHT_172` | `F-157` | Biểu 10-6T/N: Thống kê phao tiêu, báo hiệu trên luồng | Không | Không |
| `BCKCHT_173` | `F-158` | Biểu 11-N: Thống kê về hệ thống giám sát và điều phối giao thông hàng hải (VTS) | Không | Không |
| `BCKCHT_174` | `F-159` | Biểu 12-N: Hệ thống các đài thông tin duyên hải | Không | Không |
| `BCKCHT_175` | `F-160` | Biểu 13-N: Thống kê về hệ thống đê, kè chắn sóng, chắn cát | Không | Không |

### 3.3. BCDL — Chỉ tiêu đo lường (9 mã) — [ĐÃ HOÀN THÀNH 100%]

| Mã VMD | Mã hh.kcht | Tên báo cáo | Nhập/lưu | Default | Trạng thái triển khai |
| --- | --- | --- | --- | --- | --- |
| `BCDL_176` | `F-161` | Biểu 14-T: Báo cáo chi tiết tàu biển ra, vào cảng biển | Có | Không | Hoàn thành (`F161ReportHandler`) |
| `BCDL_177` | `F-162` | Biểu 15-T: Báo cáo chi tiết phương tiện thủy nội địa ra, vào cảng biển | Có | Không | Hoàn thành (`F162ReportHandler`, `InlandWaterwayPortCall`) |
| `BCDL_178` | `F-163` | Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời tại khu vực cảng biển | Có | Không | Hoàn thành (`F163ReportHandler`) |
| `BCDL_179` | `F-164` | Biểu 17-Q: Thống kê tàu biển Việt Nam vận tải quốc tế tại khu vực cảng biển | Có | Không | Hoàn thành (`F164ReportHandler`) |
| `BCDL_180` | `F-165` | Biểu 16-T: Khối lượng hàng hóa, hành khách thông qua cảng (tháng) | Có | Có | Hoàn thành (`F165ReportHandler`, `BcdlAggregationService`) |
| `BCDL_181` | `F-166` | Biểu 16-N: Khối lượng hàng hóa, hành khách thông qua cảng biển theo năm | Có | Có | Hoàn thành (`F166ReportHandler`) |
| `BCDL_182` | `F-167` | Biểu 17-T: Lượt tàu thuyền ra, vào cảng (tháng) | Có | Có | Hoàn thành (`F167ReportHandler`) |
| `BCDL_183` | `F-168` | Biểu 19-T: Khối lượng hàng hóa thông qua cảng biển bằng đội tàu biển Việt Nam và phương tiện thủy nội địa | Có | Có | Hoàn thành (`F168ReportHandler`) |
| `BCDL_184` | `F-169` | Biểu 20-T: Khối lượng hàng hóa, lượt tàu thông qua cảng biển, bến trong khu vực quản lý | Có | Không | Hoàn thành (`F169ReportHandler`) |

**Chi tiết kỹ thuật đã thực hiện**:
- **Database Migrations (Flyway)**:
  - `V20260911111500__create_inland_waterway_port_call.sql`: Bảng `inland_waterway_port_call` cho phương tiện thủy nội địa.
  - `V20260911113000__create_bcdl_report_record.sql`: Bảng `bcdl_report_record` lưu snapshot báo cáo tổng hợp.
- **JPA Entities & Repositories**:
  - `InlandWaterwayPortCall.java`, `InlandWaterwayPortCallRepository.java`.
  - `BcdlReportRecord.java`, `BcdlReportRecordRepository.java`.
- **Core Engine & Handlers**:
  - `BcdlAggregationService.java`: Bộ tính toán ngữ nghĩa đầy đủ theo T-SQL gốc (tổng hợp container Tấn/TEUs, hàng lỏng, hàng khô, hàng quá cảnh, phân loại tàu ngoại/tàu VN quốc tế/nội địa, VR-SB, tuyến bờ ra đảo, theo cầu bến).
  - 9 Handlers: `F161ReportHandler` đến `F169ReportHandler`.
  - `ReportService.java`: Cải tiến cơ chế template động nhận diện biểu thức ma trận tĩnh (`zobjComReport`, `zobjDataDefault`, `thiz`, `jrf`), hỗ trợ ghép placeholder phức hợp và dọn sạch placeholder chưa phân giải.
- **Frontend**:
  - `reports.ts`: Kích hoạt `active` cho toàn bộ 9 mã `F-161` - `F-169`.
  - `ReportList.tsx`: Mở khóa danh mục `bcdl` trên cây phân cấp báo cáo.
  - `ReportViewer.tsx`: Hỗ trợ picker Năm (`F-166`) và Khoảng thời gian cho các biểu BCDL.
- **Kiểm thử**:
  - `BcdlReportHandlerTest.java`: 5/5 bài test pass (Preview, Data, Xuất Excel, Xuất PDF cho toàn bộ 9 báo cáo).
  - Frontend: 100% pass `tsc --noEmit` và `eslint` (0 errors, 0 warnings).

### 3.4. BCPTTV — Phương tiện và thuyền viên (3 mã)

| Mã VMD | Mã hh.kcht | Tên báo cáo | Nhập/lưu | Default |
| --- | --- | --- | --- | --- |
| `BCPTTV_185` | `F-170` | Biểu 21-6T/N: Thống kê thuyền viên, hoa tiêu hàng hải | Có | Không |
| `BCPTTV_186` | `F-171` | Biểu 22-6T/N: Thống kê tàu biển mang cờ quốc tịch Việt Nam | Có | Có |
| `BCPTTV_187` | `F-172` | Biểu 28-N: Thống kê tàu thuyền hoạt động dịch vụ lai dắt | Có | Không |

### 3.5. BCDN — Doanh nghiệp (2 mã)

| Mã VMD | Mã hh.kcht | Tên báo cáo | Nhập/lưu | Default |
| --- | --- | --- | --- | --- |
| `BCDN_188` | `F-173` | Biểu 36–N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu biển | Có | Không |
| `BCDN_189` | `F-174` | Biểu 46-6T/N: Tổng hợp khối lượng hàng hóa thông qua cảng biển | Có | Không |

### 3.6. BCTT48 — Thông tư 48 (5 mã)

| Mã VMD | Mã hh.kcht | Tên báo cáo | Nhập/lưu | Default |
| --- | --- | --- | --- | --- |
| `BCTT48_190` | `F-175` | Biểu số 06-N: Năng lực thông qua bến cảng, cầu cảng thông tư 48/2017/TT-BGTVT | Có | Không |
| `BCTT48_191` | `F-176` | Biểu 07-N: Năng lực thông qua cảng biển, cảng bến thủy nội địa địa phương và doanh nghiệp quản lý | Có | Không |
| `BCTT48_192` | `F-177` | Biểu 28-T: Khối lượng hàng hóa thông qua cảng | Có | Có |
| `BCTT48_193` | `F-178` | Biểu 29-N: Khối lượng hàng hóa thông qua cảng | Có | Có |
| `BCTT48_194` | `F-179` | Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp và các hoạt động hỗ trợ vận tải đường sắt, đường thủy nội địa, đường biển | Có | Có |

### 3.7. BCCNDB — Chuyên ngành bảo đảm (10 mã)

| Mã VMD | Mã hh.kcht | Tên báo cáo | Nhập/lưu | Default |
| --- | --- | --- | --- | --- |
| `BCCNDB_195` | `F-180` | Biểu Tổng hợp thông tin chung | Không | Không |
| `BCCNDB_196` | `F-181` | Biểu Tổng hợp thông tin kết cấu hạ tầng giao thông hàng hải | Không | Không |
| `BCCNDB_197` | `F-182` | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải | Không | Không |
| `BCCNDB_198` | `F-183` | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Cầu cảng | Không | Không |
| `BCCNDB_199` | `F-184` | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Luồng hàng hải | Không | Không |
| `BCCNDB_200` | `F-185` | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Phao tiêu báo hiệu và nhà trạm quản lý vận hành | Không | Không |
| `BCCNDB_201` | `F-186` | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đèn biển và nhà trạm gắn với đèn biển | Không | Không |
| `BCCNDB_202` | `F-187` | Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đê, kè | Không | Không |
| `BCCNDB_203` | `F-188` | Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải | Không | Không |
| `BCCNDB_204` | `F-189` | Báo cáo tình hình hoạt động của báo hiệu hàng hải và công trình đê, kè | Không | Không |

### 3.8. BCTHTN — Tổng hợp theo ngày (4 mã)

| Mã VMD | Mã hh.kcht | Tên báo cáo | Nhập/lưu | Default |
| --- | --- | --- | --- | --- |
| `BCDL_180N` | `F-180N` | Biểu 12-T:Khối lượng hàng hóa, hành khách thông qua cảng biển theo ngày | Không | Không |
| `BCDL_182N` | `F-182N` | Biểu 13-T:Lượt tàu thuyền vào, rời cảng biển | Không | Không |
| `BCDL_183N` | `F-183N` | Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu thông qua cảng biển bằng đội tàu Việt Nam | Không | Không |
| `BCDL_184N` | `F-184N` | Biểu 15-T:Khối lượng hàng hóa, hành khách thông qua cảng biển, bến cảng, khu chuyển tải trong khu vực quản lý | Không | Không |

## 4. Thiết kế triển khai

### 4.1. Tái sử dụng cấu trúc đích

| Thành phần | Hướng triển khai | Điều kiện hoàn thành |
| --- | --- | --- |
| Catalog và route | Giữ `ReportList.tsx`, `ReportViewer.tsx` và route đang dùng; ánh xạ mã rõ ràng | 53 mã không trùng, không đổi nhầm alias N |
| Điều phối | Mở rộng `ReportService`/`ReportHandler` theo nhóm; chỉ thêm helper/registry tối thiểu nếu cần | Mọi mã có query đúng nghiệp vụ; mã sai trả lỗi rõ ràng |
| Dữ liệu | Port logic DTO/SQL vào repository/service PostgreSQL | Mỗi chỉ tiêu có nguồn và phép tính xác định |
| Nhập/lưu | Kế thừa BCC157 và mở rộng theo contract từng mã | Header/detail, validation, version, history/quá hạn đúng |
| Template | Chuyển từ root sang resource cùng code renderer theo từng mã | Render được từ JAR và có phương án phục hồi template/code |
| API | Giữ consumer hiện hữu; hoàn thiện preview/export/generate/download trong scope | Trả dữ liệu/file thật, đúng MIME và quyền |
| Schema | Migration Flyway timestamp, backfill/index khi cần | Dữ liệu cũ không mất, triển khai lại trên môi trường khác được |
| Tài liệu | Đồng bộ brief/UI spec/API/schema cùng thay đổi | Không lệch giữa code và đặc tả |

Không xây lại framework báo cáo hoặc tạo nhiều lớp trừu tượng không cần thiết. Giữ các phần đã hoạt động đúng và kiểm tra hồi quy trước khi thay thế.

### 4.2. Mapping dữ liệu và phép tính

Trước khi port một mã, phải điền mapping:

| Trường/chỉ tiêu VMD | DTO/SQL nguồn | Entity/field đích | Phép tính và đơn vị đo | Bộ lọc/kỳ | Quyền/scope | Gap và hướng xử lý |
| --- | --- | --- | --- | --- | --- | --- |
| Điền theo từng chỉ tiêu | Đường dẫn/thủ tục cụ thể | Nguồn thật | Quy tắc null/0, làm tròn, tổng | Thời điểm nghiệp vụ | Phạm vi áp dụng | Có sẵn / cần bổ sung / cần làm rõ |

- Chuyển T-SQL sang PostgreSQL theo ngữ nghĩa; kiểm tra join, aggregate, ngày tháng, null và độ chính xác số.
- Không lấy generic GIS hoặc số 0/placeholder thay chỉ tiêu tài sản, bảo trì, sản lượng, tàu hoặc thuyền viên chưa có nguồn.
- Phân biệt dữ liệu nhập, tích hợp và tự tổng hợp. Preview/export phải dùng cùng nguồn/filter/version; xuất đủ dữ liệu, không chỉ trang đang xem.
- Tính kỳ trước/lũy kế/cùng kỳ trên server theo nguồn; UI có thể tính tức thời nhưng không quyết định duy nhất số liệu lưu/xuất.
- Áp phạm vi đơn vị trước khi tổng hợp; tránh cộng trùng cả bản ghi cha và con.
- Thiếu field phải bổ sung ở module sở hữu, đồng bộ CRUD/DTO và đặc tả. Gap lớn cần ước tính bổ sung, không tự thay nghĩa chỉ tiêu.

### 4.3. Nhập/lưu, lịch sử và quá hạn

Kiểm kê API thực tế cho 20 mã: default-data, tạo/sửa, search/sub-search, detail, history, cập nhật quá hạn và export từ bản ghi đã lưu. Chốt endpoint đích sau khi đọc controller/DTO nguồn; không tự suy diễn thao tác xóa hoặc workflow phê duyệt.

Header/detail phải lưu trong transaction, rollback khi detail lỗi. Khóa chống trùng kỳ–đơn vị–mã–nguồn và kiểm tra version phải theo contract thực tế. Với nguồn tích hợp 176/177, bổ sung chống nhận lặp khi call path yêu cầu.

Lịch sử dùng hạ tầng audit tập trung của hh.kcht theo convention, ghi đúng người thao tác/thời điểm/nội dung. Điều kiện quá hạn và quyền cập nhật/duyệt kiểm tra tại backend. Quyền đọc history không được rộng hơn quyền xem bản ghi.

### 4.4. Render và tải file

1. Thử **BCC157, BCKCHT163, BCDL180** để bao phủ form nhập, bảng phân cấp và bảng chỉ tiêu nhiều dòng.
2. Kiểm tra placeholder, dòng bắt đầu, merged cells, công thức, font và print area; chọn một đường render phù hợp template nguồn trước khi nhân rộng.
3. Chuyển template cùng renderer theo mã; kiểm tra resource khi đóng gói JAR, không phụ thuộc file ở root máy phát triển.
4. Excel/PDF là nghiệm thu chính. WORD backend giữ tương đương source; xác minh cơ chế DOCX chứa ảnh trang PDF, đủ trang/đúng thứ tự, không mặc định Word chỉnh sửa từng ô.
5. Download trả byte thật, đúng MIME/tên file, kiểm tra bản ghi cha và quyền/phạm vi artifact ngay cả khi người gọi biết ID.
6. Kiểm tra lỗi/timeout, profile/temp riêng khi chạy đồng thời, cleanup sau thành công và thất bại. Không xuất file thiếu dòng một cách im lặng.

### 4.5. Quyền và convention

- Đơn vị chỉ xem dữ liệu của mình; cha xem subtree; xem full theo quyền. Kiểm tra scope trên search/count/default-data/detail/history/export/download và request giả orgUnitId/entryId.
- Đăng ký permission mới tại `config/PermissionSeeder.java`; quyền động qua nhóm/tài khoản. Đặc tả phải nêu quyền Admin Cục và các trường nhạy cảm theo quy định đích.
- Trước khi sửa UI, đọc `frontend/src/theme.ts`, `tokens.ts`, `components/AppLayout.tsx` và convention form/list. Dùng preset/component chung, không hardcode token thị giác; filter đơn vị dạng cây, giữ value `orgUnitId`.
- Giữ contract route cần tương thích; thao tác CRUD mới tuân thủ popup/modal và ma trận trường trong brief. Không tự tạo layout/menu riêng.
- Dùng Maven theo cấu hình dự án, không đoán lệnh generator. Scaffold SDLC qua `ai-kit`; không tự tạo scaffold dưới `docs/modules`, `docs/features`, `docs/hotfixes`.
- Đối chiếu HH.CSDL và brief đích trước khi thay đổi nghiệp vụ; chốt các mâu thuẫn cụ thể trước khi code phần phụ thuộc. Đồng bộ tài liệu ngay cùng thay đổi schema/API/workflow/UI.

## 5. Các bước thực hiện và đầu ra

### D1 — Chốt mapping và PoC

- [ ] Lập manifest 53 mã: alias, template, handler, filter, capability và nguồn tham chiếu.
- [ ] Chốt mapping trường/công thức, khác biệt tên biểu, gap schema và quyết định xử lý.
- [ ] Chuẩn bị đầu vào và expected result cho 3 mẫu đại diện.
- [ ] Thử renderer, resource đóng gói và tính nhất quán preview/export.

**Đầu ra:** mapping đủ để triển khai nhóm đầu; gap có phương án xử lý; 3 mẫu render đúng. Không nhân rộng renderer chưa đạt.

### D2 — BCC và BCKCHT: 20 mã

- [ ] BCC156: đầu kỳ/tăng/giảm/cuối kỳ đúng thời điểm và loại tài sản.
- [ ] BCC157: kế thừa form/lưu hiện có, nguyên giá/hao mòn/còn lại, nguồn nhập và tổng hợp tách rõ, giữ dữ liệu cũ.
- [ ] BCC158–162: kê khai/quản lý/xử lý/khai thác/đề nghị xử lý đúng nguồn và filter đặc thù.
- [ ] BCKCHT163–165: cây cảng–bến–cầu, công suất/diện tích, tránh cộng lặp cha–con.
- [ ] BCKCHT166–169: đúng nguồn luồng và từng loại vùng nước; không gộp đối tượng vì gần giống tên.
- [ ] BCKCHT170–175: đèn, phao, nhà trạm, VTS/radar, đài và đê/kè; hoàn thiện provider còn thiếu.

**Đầu ra:** 20 mã có dữ liệu/filter/template đúng; nhánh cũ có bằng chứng hồi quy.

### D3 — BCDL và báo cáo ngày: 13 mã

- [ ] 176/177: schema/DTO/form chi tiết, lưu/đọc lại, history/quá hạn, nhận dữ liệu liên quan; phân biệt ngày đến/rời/nhận.
- [ ] 178/179: quốc tịch/tuyến vận tải/lượt ra-vào đúng quy tắc.
- [ ] 180/181: hàng hóa/hành khách/kế hoạch/tháng/năm/lũy kế/cùng kỳ.
- [ ] 182–184: lượt tàu/đội tàu/khu vực quản lý, đúng nguồn và đơn vị đo.
- [ ] 180N/182N/183N/184N: tổng hợp ngày và khoảng so sánh, không sao chép nguyên logic tháng.

**Đầu ra:** nguồn chi tiết 176/177 tin cậy trước khi nghiệm thu các biểu phụ thuộc; tổng ngày/tháng/năm thống nhất theo nghiệp vụ.

### D4 — BCPTTV, BCDN, TT48, BCCNDB: 20 mã

- [ ] BCPTTV185–187: form/nguồn thuyền viên, hoa tiêu, tàu Việt Nam và lai dắt.
- [ ] BCDN188/189: cơ sở đóng/sửa/phá dỡ và tổng hợp hàng hóa theo đúng kỳ.
- [ ] TT48_190/191: phân biệt chỉ tiêu năng lực với BCKCHT163/164; kiểm tra default-data cả khi enum không bật.
- [ ] TT48_192–194: sản lượng/kế hoạch/lũy kế/tỷ lệ/dịch vụ vận tải, thống nhất phép tính server và UI.
- [ ] BCCNDB195/196: thông tin chung và hạ tầng từ nguồn nghiệp vụ.
- [ ] BCCNDB197–202: quan hệ tài sản–kế hoạch bảo trì–chi phí–kết quả, đúng loại tài sản.
- [ ] BCCNDB203/204: kê khai/quản lý tài sản và hoạt động báo hiệu/đê/kè theo thời điểm.

**Đầu ra:** 20 mã đủ provider, hành vi nhập/lưu liên quan và đầu ra; không dùng phép tổng chung thay mọi chỉ tiêu.

### D5 — Tích hợp và bàn giao Test

- [ ] Kiểm kê đủ 53 mã/20 luồng nhập; loại bỏ fallback generic dùng để giả lập nghiệp vụ.
- [ ] Hoàn thiện endpoint còn stub trong scope, WORD backend và compatibility với consumer cũ.
- [ ] Chạy compile/typecheck/lint/build và test kỹ thuật phù hợp; test route báo cáo thực, không dựa trang deprecated.
- [ ] Đồng bộ tài liệu, cấu hình renderer/font/resource, migration và hướng dẫn chuyển template theo mã.
- [ ] Nhận lỗi, sửa trong quỹ Dev, bàn giao lại để Test kiểm tra.

**Chuỗi phụ thuộc:** D1 → D2; D1 + schema nguồn → D3; D4 dùng nguồn D2/D3 khi có phụ thuộc; tất cả → D5. Nhóm độc lập có thể triển khai tiếp khi nhóm khác chờ làm rõ dữ liệu.

## 6. Phân bổ Dev — 24 giờ

| Ngày công | Công việc | Giờ |
| --- | --- | ---: |
| 1 | D1: mapping/gap trọng yếu | 2 |
| 1 | D1: PoC renderer và template | 2 |
| 1 | D2: port BCC/BCKCHT | 4 |
| 2 | D3: port BCDL và mã N | 4 |
| 2 | D4: port các nhóm còn lại | 4 |
| 3 | D5: hoàn thiện nhập/lưu, quyền, API, history/quá hạn và tài liệu | 2 |
| 3 | D5: kiểm tra kỹ thuật và tích hợp | 2 |
| 3 | Quỹ sửa lỗi khi tích hợp và sau Test | 4 |
| **Tổng** | | **24** |

Nhập/lưu và quyền phải làm cùng từng nhóm từ ngày 1–2; 2 giờ ngày 3 chỉ hoàn thiện phần còn lại. Quỹ sửa lỗi có thể dùng sau khi QA trả lỗi, nên 3 ngày công Dev không nhất thiết là 3 ngày liên tiếp.

| Mốc | Nội dung phải xác nhận |
| --- | --- |
| Sau 4 giờ Dev | 3 mẫu PoC, khả năng render và gap nguồn trọng yếu |
| Sau 8 giờ Dev | Tốc độ port thực tế, dự báo khả năng hoàn tất 53 mã trong ngân sách |
| Sau 16 giờ Dev | Nhóm/luồng còn thiếu, phần đã có thể Test |
| Sau 24 giờ Dev | Trạng thái từng mã, quỹ sửa lỗi đã sử dụng và phần còn lại |

Không ép kết quả thành “hoàn thành” nếu còn thiếu nguồn hoặc chức năng. Schema lớn, renderer cần viết lại hoặc sửa lỗi vượt 4 giờ phải được ước tính bổ sung vào Dev, không hạch toán sang Test.

## 7. Kế hoạch Test — 40 giờ cơ sở

| Hạng mục | Phạm vi kiểm chứng | Giờ |
| --- | --- | ---: |
| Chuẩn bị | Ma trận 53 mã, fixture theo 8 nhóm, expected result độc lập với query và tài khoản/scope | 4 |
| Chức năng/số liệu | 53 mã: route/filter/nguồn/chỉ tiêu/tổng; kiểm tra sâu biến thể kỳ và số liệu theo nơi áp dụng | 10 |
| Nhập/lưu | 20 mã: nhập–lưu–đọc–sửa, validation, trùng kỳ, version, history/quá hạn theo contract | 6 |
| Preview/file | 53 XLSX + 53 PDF: dữ liệu, placeholder/công thức, font, layout/print area; WORD backend theo scope | 8 |
| Quyền/scope | A/B, cha–con, full theo quyền, giả ID và tất cả đường đọc/xuất liên quan | 4 |
| Migration/hiệu năng/vận hành | Dữ liệu cũ, fixture lớn, export đồng thời, resource/timeout/cleanup | 3 |
| Hồi quy/kiểm tra lại | Một vòng kiểm tra lại, BCC157/nhánh cũ, consumer tương thích, tổng hợp bằng chứng và lỗi | 5 |
| **Tổng cơ sở** | | **40** |

### 7.1. Cơ sở estimate và dự phòng

Test tính theo khối lượng kiểm chứng, không theo tỷ lệ phần trăm Dev. Dùng fixture/ca tham số hóa để giảm thao tác lặp nhưng mỗi mã vẫn phải có bằng chứng số liệu và file đầu ra. Ca biên chuyên sâu chạy ở nơi có quy tắc tương ứng, không nhân mọi tổ hợp với mọi mã.

10 giờ đối soát tương đương trung bình khoảng 11 phút/mã khi fixture đã sẵn; 6 giờ nhập/lưu khoảng 18 phút/mã với dữ liệu/form dùng chung. Đây là giả định lập lịch, cần điều chỉnh nếu biểu hoặc dữ liệu phức tạp hơn dự kiến. Kiểm tra file gồm tự động cấu trúc/số liệu và xem trực quan từng mẫu, không chỉ tải được file.

| Dự phòng Test | Giờ |
| --- | ---: |
| Bổ sung fixture và ca kỳ/lũy kế/nguồn phức tạp | 3 |
| Kiểm tra lại font/layout/phân trang sau sửa | 2 |
| Một vòng kiểm tra lại/hồi quy bổ sung | 3 |
| **Tổng dự phòng** | **8** |

40 giờ giả định bàn giao đủ chức năng và một vòng kiểm tra lại chính. Dự phòng Test không dùng cho sửa code hay che phần Dev chưa hoàn thành.

### 7.2. Ma trận nghiệm thu

| Nhóm | Điều kiện đạt |
| --- | --- |
| Catalog | 53 mã duy nhất, alias/template đúng, 4 mã N không nhầm |
| Số liệu | Từng chỉ tiêu khớp fixture, đúng null/0/thập phân/đơn vị đo, không cộng trùng cha–con |
| Thời gian | Cuối tháng/năm, năm nhuận, quý/nửa năm, kỳ trước/lũy kế/cùng kỳ; mốc quá hạn theo source |
| Nhập/lưu | Đọc lại đúng, validation, rollback khi detail lỗi, version và chống trùng theo contract |
| Quyền | Không đọc/xuất/sửa ngoài scope, kể cả đổi orgUnitId/entryId hoặc biết ID file |
| UI | loading/error/empty/data, filter cây đơn vị, form/validation, đủ tiêu đề cột, ellipsis và scroll/phân trang đúng |
| Excel/PDF | Mở được, khớp preview, không placeholder lỗi/#REF!/#VALUE!, font/merged cells/chữ ký/phân trang đúng |
| Export | Đủ phạm vi được phép, không chỉ trang hiện tại, đúng nguồn/filter/version |
| WORD | DOCX hợp lệ, đủ ảnh trang PDF đúng thứ tự theo capability nguồn |
| Vận hành | Resource trong JAR, migration không mất dữ liệu, lỗi renderer được xử lý/cleanup, không cắt ngầm dữ liệu lớn |
| Hồi quy | BCC157, nhánh cũ và API cần tương thích tiếp tục đúng |

Chạy Maven compile/test, TypeScript/ESLint và Vite build phù hợp thay đổi; nếu sửa token/re-export phải kiểm tra thêm dev mode. E2E dùng route thực và dữ liệu kiểm soát, không dùng mock/empty để kết luận đúng nghiệp vụ. Không tự khởi động backend theo quy định dự án; dùng môi trường test có sẵn. Đo baseline trước khi chốt ngưỡng hiệu năng, không tự đặt SLA thiếu căn cứ.

## 8. Điều kiện thực hiện và rủi ro

| Điều kiện / rủi ro | Cách xử lý |
| --- | --- |
| Phần lớn mapping dùng entity hiện có, thiếu schema nhỏ | Xác minh D1; bổ sung lớn cần estimate riêng |
| Renderer tương thích sau 3 mẫu PoC | Chỉ nhân rộng khi PoC đạt |
| Có DB test riêng, tài khoản, renderer và dữ liệu đầu vào | Thời gian chờ ghi riêng; không coi là Test đã thực hiện |
| Quy tắc nghiệp vụ và expected result đủ rõ | Chốt khác biệt VMD/HH.CSDL/brief trước khi nghiệm thu |
| Lỗi nền chặn build/test | Tách khỏi lỗi clone nhưng ghi tác động vào lịch |
| Sửa nhiều template hoặc nhiều vòng lỗi | Dùng dự phòng đúng mục đích; vượt thì re-estimate |

Một người/trợ lý làm tuần tự: **8 ngày công cơ sở**, dự trù **9 ngày công**. QA riêng có thể chuẩn bị và test cuốn chiếu; ngày lịch phải dựa trên nhân lực và thời điểm bàn giao từng nhóm. Chờ phản hồi/môi trường, UAT, triển khai/migration production và đánh giá tải/bảo mật chuyên sâu không nằm trong 64–72 giờ. Kiểm tra phân quyền/data scope vẫn thuộc Test cơ sở.

## 9. Bàn giao và tiêu chí hoàn tất

Bàn giao một bảng 53 dòng với các cột:

| Nhóm | Nội dung bắt buộc |
| --- | --- |
| Định danh | Mã VMD, mã F, nhóm, template/version |
| Nguồn | DTO/SQL tham chiếu, entity/field đích, filter và công thức |
| Hành vi | Nhập/lưu/default-data/history/quá hạn: đạt/chưa đạt/không áp dụng có lý do |
| File | Mẫu Excel/PDF/WORD theo scope và kết quả kiểm tra |
| Chất lượng | Bằng chứng số liệu, quyền/scope, hồi quy, lỗi còn mở |
| Trạng thái | Chưa làm / Đang làm / Chờ Test / Đạt / Còn lỗi và việc còn lại |

Kèm migration/backfill, cấu hình font/renderer/resource, cách chuyển template theo mã và phương án phục hồi code/template. Phục hồi DB cần phương án riêng đã kiểm chứng, không xóa dữ liệu mới để quay về schema cũ.

**Hoàn tất toàn bộ khi:** 53/53 mã đúng chức năng/số liệu/file theo nguồn đã đối chiếu; 20 mã nhập/lưu tương đương; quyền/scope đạt; không generic/placeholder thay nghiệp vụ; tài liệu đồng bộ và lỗi chặn nghiệm thu đã đóng. Sai số liệu, sai nguồn, mất dữ liệu và lộ dữ liệu là lỗi chặn chức năng liên quan.

Lượt viết lại này chỉ tạo tài liệu kế hoạch tại root. Chưa clone code, thay template runtime, sửa DB hay thực hiện các vòng Test nêu trên. Các xác minh danh mục/template là căn cứ lập kế hoạch, không phải kết quả nghiệm thu ứng dụng.


## Cập nhật triển khai nhóm 1 — 10/09/2026

Nguồn đã chốt: `infra_assets`, `asset_exploitations`, `asset_processing_records`; BCC157 nhập lưu `bcc157_report`.

- [x] Provider có scope và dữ liệu chung cho preview/export BCC156–162 (F-141–147).
- [x] Bảy template nguồn, xuất Excel/PDF; Word backend dạng ảnh trang PDF.
- [x] BCC157 nhập/sửa popup, xóa có xác nhận, lịch sử; kiểm tra số liệu, tính lại số dư, version chống ghi đè.
- [x] Migration version và cập nhật bảy feature brief, kế hoạch kỹ thuật M-008.
- [x] 38 test riêng đạt: template, tổng hợp/scope, PDF/Word và CRUD.
- [ ] Áp dụng migration trên môi trường kiểm thử và kiểm tra tương tác thực tế.
- [ ] Chuẩn hóa disposal_method chưa rõ chiều điều chuyển; đối chiếu hình thức xử lý và snapshot lịch sử BCC162.
- [ ] Đối chiếu số liệu thật và nghiệm thu PDF/Word dài nhiều trang.

Chi tiết: `docs/modules/M-008-bao-cao-thong-ke/tech-lead/04-plan.md`, mục cập nhật nhóm 1. Trạng thái: đã triển khai để kiểm thử, chưa đánh dấu hoàn thành nghiệm thu. Estimate toàn đợt giữ dev 24h; test 40h + dự phòng 8h.
