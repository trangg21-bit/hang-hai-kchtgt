# Tech Lead Plan: M-008 — Báo cáo & Thống kê

## Module Overview

Module M-008 Báo cáo & Thống kê covers the reporting and statistics aggregation for the Hàng Hải project. Due to the high number of templates (49+), the technical design establishes a unified Reporting Engine that queries other active domains (Assets, GIS, Users) to compile dynamic reports.

**Tech Stack:**
- Backend: Spring Boot 3.x + Spring Data JPA + Mockito (Unit testing)
- Frontend: React 18 + Vite + TypeScript + Ant Design
- Database: PostgreSQL (queries over points, lines, polygons, and users)

---

## Feature Summary (Scope of Implementation)

To establish the reporting architecture, we prioritize 3 representative reports covering different business domains:

| # | Feature | Slug | Complexity | Est. Effort |
|---|---|---|---|---|
| F-141 | Báo cáo tăng giảm tài sản | bao-cao-tang-giam-tai-san | Medium | 3 sprints (6 days) |
| F-180 | Biểu tổng hợp thông tin chung | bieu-tong-hop-thong-tin-chung | Low | 2 sprints (4 days) |
| F-151 | Biểu 03-Q/N: Thống kê luồng hàng hải | thong-ke-luong-hang-hai | Medium | 3 sprints (6 days) |

**Total estimated effort: ~16 man-days**

---

## Implementation Order

### Wave 1: Backend Reporting Engine
1. Define `ReportType` enums and DTO request/response contracts.
2. Implement repository queries and count aggregation logic in `ReportService`.
3. Set up the dynamic report column mapper and CSV exporter supporting Vietnamese Excel accents (UTF-8 BOM prefix).
4. Expose REST endpoints in `ReportController`.

### Wave 2: Frontend Reports Dashboard
5. Create TypeScript definitions and `reportService.ts` API client.
6. Design the unified `ReportsPage.tsx` using Ant Design components (Select, Date Picker, dynamic Table).
7. Enable file downloads (Excel/CSV and Text/PDF format) from binary payload responses.

### Wave 3: Testing & Validation ✅ Complete
8. Backend controller and service unit tests (`ReportControllerTest`, `ReportServiceTest`) — ✅ Complete (16 report-specific tests, 790 total across all modules)
9. Frontend Playwright E2E integration tests (`reports-page-reports-49-templates.test.ts`) — ✅ Complete (4 tests covering all 49 report types)
10. Run `mvn test` — ✅ Complete (790/790 pass, BUILD SUCCESS)

---

## Backend Package Structure

```
src/main/java/com/hanghai/kchtg/report/
├── controller/
│   └── ReportController.java
├── dto/
│   ├── ReportRequest.java
│   └── ReportResponse.java
├── entity/
│   └── ReportType.java
└── service/
    └── ReportService.java
```

---

## Frontend Package Structure

```
frontend/src/
├── types/
│   └── report.ts
├── services/
│   └── reportService.ts
└── pages/
    └── ReportsPage.tsx
```

---

## Shared API Base Path

All Report REST endpoints use prefix: `/api/v1/`

- `POST /api/v1/reports/preview` (Dynamic preview table data)
- `POST /api/v1/reports/export` (Streamed CSV / Text downloads)

---

## Sprint Timeline (Consolidated)

```
Sprint 1: Backend Report DTOs, controllers, and services. Setup mock data and calculations.
Sprint 2: Backend unit tests and CSV exporter encoding support (UTF-8 BOM).
Sprint 3: Frontend ReportsPage component layout, selectors, and dynamic tables.
Sprint 4: Frontend API client, routing, and sidebar integration.
Sprint 5: Playwright E2E reports testing and overall flow validation.
```


## Cập nhật chuyển đổi nhóm 1 — 10/09/2026

Phần này thay thế kế hoạch cũ cho F-141–F-147. Nguồn chính đã được người dùng chốt: `infra_assets` và bảng nghiệp vụ liên quan; không sử dụng bảng ánh xạ cũ `ts_ql`. Estimate toàn đợt clone giữ theo `implement_plan.md`: dev 24 giờ, test 40 giờ + dự phòng 8 giờ, không áp dụng estimate 16 man-days ở phần lịch sử trên.

- Provider chung BccGeneralReportService và BccReportDataset phục vụ cả preview/export; JDBC áp dụng scope tường minh, trạng thái đã duyệt, loại xóa mềm.
- BccTemplateRenderer đọc bảy template nguồn nguyên bản trong `public/template_export/vmd-bcc`, giữ merge/style/header/footer, mở rộng các nhóm/dòng và tính tổng từ số liệu, không cộng lặp dòng nhóm.
- BCC156: ngày ghi nhận; BCC157 tự tổng hợp: năm bắt đầu hao mòn; BCC158: ngày kê khai và mốc 04/04/2025; BCC159/160: ngày ghi nhận tài sản; BCC161: ngày ghi nhận khai thác; BCC162: hồ sơ xử lý đã duyệt.
- Tiền BCC156/158/159/160/161: nghìn đồng; BCC157: tỷ đồng; BCC162: đồng. Nguồn infra lưu đồng. Số BCC157 nhập lưu theo tỷ đồng của mẫu, không chuyển đổi ngầm dữ liệu cũ.
- BCC157 nhập/sửa có kiểm tra âm/độ chính xác, máy chủ tính lại số dư/còn lại, khóa lạc quan version, ghi lịch sử tập trung. Form mở popup; đơn vị chọn dạng cây; không cho đổi bộ khóa khi sửa.

### Giới hạn dữ liệu và hạng mục cần nghiệm thu

1. `disposal_method` hiện là văn bản tự do. Chấp nhận đúng mã 1–9 hoặc nhãn VMD. “Điều chuyển” không xác định chiều tăng/giảm; dữ liệu như vậy báo lỗi cần chuẩn hóa, không tự gán. Chưa chạy cập nhật dữ liệu thực tế.
2. BCC162 dùng 4 hình thức có thật của hh.kcht (Điều chuyển/Bàn giao/Thanh lý/Phá dỡ); không gán “Thu hồi” thành “Bàn giao”. Nguồn VMD có nhiều hình thức hơn, chưa thể coi là phủ hết 9 mã nguồn.
3. BCC162 hiện lấy thông tin tài sản hiện tại khi ghép hồ sơ; chưa có snapshot đầy đủ tại thời điểm đề nghị như nguồn. Cần đối chiếu khi nghiệm thu lịch sử.
4. Trường ghi chú chưa có nguồn tương ứng để ánh xạ thì để trống. Không tạo số liệu giả.
5. BCC157 nguồn 1 không có bản nhập trả rỗng, không fallback sang nguồn 2. Bản nhập nguồn 2 cũ giữ trong CRUD nhưng không tham gia tổng hợp tự động nguồn 2.
6. Migration version đã tạo, chưa chạy trên DB. Chưa khởi động backend, chưa nghiệm thu tương tác trình duyệt và đối chiếu số liệu DB thật. Kiểm thử mock/template không thay thế kiểm thử tích hợp.
7. WORD backend đã bổ sung: DOCX chứa ảnh từng trang PDF theo đúng thứ tự; dùng PDFBox chỉ đọc PDF nội bộ do máy chủ sinh. PDF nhóm 1 giữ khổ giấy/hướng trang của template. Đã kiểm tra ảnh trang đầu bảy báo cáo và nội dung tiếng Việt; vẫn cần nghiệm thu trường hợp dữ liệu thật dài, nhiều trang. Các kết quả pass cũ phía trên không đại diện cho lần chuyển đổi này.

### Kiểm chứng hiện tại

BccTemplateRendererTest kiểm tra cả bảy mẫu, dữ liệu rỗng, tổng nhóm không nhân đôi và mở rộng 200 dòng. BccGeneralReportServiceTest kiểm tra công thức, đơn vị tiền, năm hao mòn, không fallback, thứ tự khối khai thác, ngày lọc và giới hạn subtree. Kết quả lần chạy cuối xem báo cáo bàn giao, không suy diễn từ số test lịch sử.

Kết quả kiểm tra 10/09/2026: 38/38 test riêng nhóm 1 đạt (16 template, 9 tổng hợp/scope, 8 PDF/Word, 5 CRUD BCC157). Chạy trong thư mục build riêng để tránh file class bị tiến trình build khác ghi đè. ESLint bốn file frontend chỉnh sửa đạt; kiểm tra TypeScript toàn repo còn lỗi ngoài phần này. Chưa xác nhận toàn repo build frontend thành công.

Popup BCC157 có thêm/sửa, xác nhận xóa và lịch sử thao tác. API trả orgUnitName qua cache đơn vị và HTTP 409 khi phiên bản sửa đã cũ. Không hiển thị người thao tác trong bảng lịch sử ở popup.
