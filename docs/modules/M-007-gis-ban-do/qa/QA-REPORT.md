# M-007 QA Report — GIS / Bản đồ

**Module:** M-007 — GIS / Bản đồ
**Date:** 2026-06-19
**Stage:** engineering-code-reviewer
**QA Verdict:** Pass

---

## Scope

Execute unit tests and E2E validation for all 5 features of the GIS/Bản đồ module: Point Object management, Line Object management, Polygon Object management, Map Layer management, and GIS Search.

---

## Artifacts Produced & Verified

### Backend JUnit — 10 Files

| # | File | Class | Test Coverage |
|---|------|-------|---------------|
| 1 | `src/test/java/com/hanghai/kchtg/gis/point/PointObjectServiceTest.java` | `PointObjectServiceTest` | CRUD, status transitions, approval workflow, coordinates validation |
| 2 | `src/test/java/com/hanghai/kchtg/gis/point/PointObjectControllerTest.java` | `PointObjectControllerTest` | REST endpoints for point objects, error handling, search |
| 3 | `src/test/java/com/hanghai/kchtg/gis/line/LineObjectServiceTest.java` | `LineObjectServiceTest` | Line CRUD, WKT geometry validation, approval lifecycle |
| 4 | `src/test/java/com/hanghai/kchtg/gis/line/LineObjectControllerTest.java` | `LineObjectControllerTest` | REST endpoints for line objects, update/delete API checks |
| 5 | `src/test/java/com/hanghai/kchtg/gis/polygon/PolygonObjectServiceTest.java` | `PolygonObjectServiceTest` | Polygon CRUD, intersection checks, area overlaps validation |
| 6 | `src/test/java/com/hanghai/kchtg/gis/polygon/PolygonObjectControllerTest.java` | `PolygonObjectControllerTest` | REST endpoints for polygon objects, validation response checks |
| 7 | `src/test/java/com/hanghai/kchtg/gis/layer/MapLayerServiceTest.java` | `MapLayerServiceTest` | Map layers style configs, overlays, and user MapView persistence |
| 8 | `src/test/java/com/hanghai/kchtg/gis/layer/MapLayerControllerTest.java` | `MapLayerControllerTest` | REST endpoints for map views, layers WMS/WFS overlays |
| 9 | `src/test/java/com/hanghai/kchtg/gis/search/SearchServiceTest.java` | `SearchServiceTest` | Advanced buffer queries, bounding-box, coordinates parsing |
| 10| `src/test/java/com/hanghai/kchtg/gis/search/SearchControllerTest.java` | `SearchControllerTest` | Search REST endpoint, search history logging and clearing |

### Frontend Playwright E2E — 1 File

| # | File | Tests | Coverage |
|---|------|-------|----------|
| 1 | `frontend/tests/gis.spec.ts` | 61 | Full coverage for F-136, F-137, F-138, F-139, F-140. Includes list loading, filtering, paging, creating objects, map layer listing, GIS Search form interaction, sidebar active menu, and viewport responsiveness |

---

## QA Execution Summary

- **Total unit tests:** 268
  * `MapLayerControllerTest`: 13 tests passed
  * `MapLayerServiceTest`: 40 tests passed
  * `LineObjectControllerTest`: 11 tests passed
  * `LineObjectServiceTest`: 28 tests passed
  * `PointObjectControllerTest`: 14 tests passed
  * `PointObjectServiceTest`: 42 tests passed
  * `PolygonObjectControllerTest`: 11 tests passed
  * `PolygonObjectServiceTest`: 28 tests passed
  * `SearchControllerTest`: 11 tests passed
  * `SearchServiceTest`: 35 tests passed
  * Other system active unit tests: 35 tests passed
  * **Pass Rate:** ✅ 100% (268/268)
- **Total E2E tests:** 61
  * **Pass Rate:** ✅ 100% (61/61)
- **All paths verified:** ✅ All tests executed successfully inside sandbox environment.

---

## Verdict

**Pass** — Both unit tests (268/268) and E2E tests (61/61) pass successfully. Standardized validation messages and no-overlap layouts fully verified.

<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <schema_version>1.0</schema_version>
    <key_findings><item>268 backend unit tests passed 100% (including all Polygon and Search tests)</item><item>61 Playwright E2E tests passed 100%</item><item>Table layouts verified to truncate long codes cleanly with ellipses and full tooltips</item><item>Validation messages verified to be fully accented Vietnamese</item></key_findings>
    <artifacts_produced><item>C:\Users\sonpn\.gemini\antigravity-ide\brain\f90542aa-111c-4f47-8e63-bb000deb2599\walkthrough.md</item></artifacts_produced>
  </structured_summary>
  <blockers/>
  <requested_specialists/>
  <completed_features><feature><id>M-007</id><status>closed</status></feature></completed_features>
</verdict_envelope>

---

## Regression 2026-08-28 — GitLab #84, #85

### Hành vi đã đồng bộ

- Theo phản hồi kiểm thử mới nhất, bảng tra cứu khôi phục 6 cột của phiên bản trước: STT, Đơn vị quản lý, Loại KCHT, Tỉnh/Thành phố, Địa điểm chi tiết, Kết cấu hạ tầng; dùng thanh cuộn ngang khi tổng bề rộng vượt panel.
- Tra cứu với "Tất cả đơn vị" không gửi tham số loại KCHT rỗng; truy vấn tổng hợp chỉ lấy bản ghi đã duyệt và không loại nhầm bản ghi theo tình trạng vận hành. Mỗi loại giới hạn tối đa 1.000 bản ghi nguồn trước khi phân trang kết quả.
- Tra cứu Bến cảng trả đủ các bản ghi đã duyệt, kể cả khi tình trạng vận hành chưa được khai báo hoặc không phải `OPERATIONAL`.
- Quản lý lớp bản đồ bổ sung nhóm Bản đồ nền Google M/Y/P và đồng bộ 30 nhãn lớp ENC theo hệ thống nguồn.
- Drawer Quản lý lớp bản đồ rộng 420px trên desktop thay vì preset 50% màn hình; mobile giữ toàn màn hình. Kiểm tra trực tiếp xác nhận danh sách lớp cuộn dọc và bản đồ vẫn còn vùng quan sát.
- Panel tra cứu rộng 560px trên desktop và toàn màn hình trên mobile. Hàng thao tác đồng bộ mẫu Buoy Station: Đặt lại dạng nút tròn, Tìm kiếm co theo nội dung, Bộ lọc nâng cao dạng nút tròn với icon phễu và màu active; cả cụm căn giữa. Kiểm tra trong panel 560px: hai nút tròn cao 38px, nút Tìm kiếm khoảng 104px và trạng thái mở bộ lọc dùng màu `actionPrimary`.
- Khởi tạo Leaflet dùng cùng một instance toàn cục cho MarkerCluster và Geoman, tránh lỗi plugin làm hiện thông báo "Không thể khởi tạo bản đồ" trong Vite dev mode.
- Popup Lưu KCHT dùng đủ 28 giá trị danh mục `LOAI_KCHT`; danh sách Thuộc cảng biển lấy từ API option, chỉ gồm cảng đã duyệt và được lọc theo đơn vị đã chọn cùng cây đơn vị con; Tình trạng gồm Sử dụng và Không sử dụng.

### Kiểm thử hồi quy

| Phạm vi | Kết quả |
|---|---|
| `KchtGis155ServiceTest` | 4/4 pass, gồm trường hợp 3 Bến cảng đã duyệt có tình trạng vận hành khác nhau |
| `CommonOptionsServiceTest` | 2/2 pass cho phạm vi toàn hệ thống và phạm vi đơn vị |
| `gisSearchTypeOptions.test.ts` | 4/4 pass, xác nhận đủ 28 loại KCHT và ánh xạ category hai chiều |
| Vite production build | Pass, 4.118 module được biên dịch |

### Bổ sung sau kiểm tra local

- Truy vấn thực tế với `page=0&size=20` phát hiện schema PostgreSQL thiếu `latitude`/`longitude` ở `coastal_station_lrit`; `coastal_station_haiphong` có cùng độ lệch giữa entity và schema.
- Migration `V20260830010000__add_missing_lrit_haiphong_coordinates.sql` bổ sung bốn cột nullable và backfill dữ liệu POINT từ `gis_spatial_objects` qua `spatial_id`/`ref_id`.
- Flyway đã áp dụng thành công migration trên PostgreSQL local, schema đạt version `20260830010000`.
- Gọi đúng API tra cứu "Tất cả" qua frontend proxy trả HTTP 200, `success=true`, tổng 31 bản ghi và 20 bản ghi ở trang đầu.
- Kiểm tra trực tiếp tại `/gis/map`: bảng hiển thị 20 dòng, phân trang 2 trang, tổng cộng 31; không còn trạng thái "Đã xảy ra lỗi".
- Cột checkbox chọn dòng được cấp đủ chiều rộng; kiểm tra trực tiếp xác nhận header không còn sinh dấu `…` thừa cạnh checkbox.
- Bộ lọc Đơn vị quản lý khóa cả grid item, form và TreeSelect theo chiều rộng panel. Kiểm tra trực tiếp ở breakpoint desktop 560px xác nhận đường dẫn dài được rút gọn bằng `…`; icon xổ xuống và toàn bộ hàng nút vẫn nằm trong panel. Thuộc tính hover giữ toàn bộ đường dẫn đơn vị.

### Tinh chỉnh khả năng đọc và hiển thị bản đồ

- Nội dung bảng tra cứu dùng token cỡ chữ nội dung chuẩn `fontSizeMd` thay cho chế độ bảng dày đặc 10px; kiểm tra trên cấu hình local hiện tại hiển thị 14px.
- Bỏ khoảng đệm 24px giữa thanh cuộn ngang và phân trang; phân trang vẫn giữ khoảng đệm nội bộ để không dính sát bảng.
- Không còn vẽ marker tại đỉnh hoặc tâm của đường/vùng ở bất kỳ mức zoom nào. Điểm thật vẫn dùng marker; đường và vùng mở popup khi bấm trực tiếp lên hình học thật.
- Quy hoạch cảng biển và KCHT dùng chung một bộ phân giải click theo tọa độ màn hình, không còn phụ thuộc thứ tự pane/Canvas. Hình học quy hoạch được hit-test từ đúng GeoJSON đang hiển thị và được lập chỉ mục không gian; hình học KCHT dùng cùng sai số 8px. Khi hai nguồn hoặc nhiều đối tượng chồng lấn, popup trung gian cho phép chọn rõ “Quy hoạch cảng biển” hoặc từng KCHT nên không lớp nào che mất tính năng của lớp còn lại.
- Các lớp đường/vùng tương tác trong suốt đã được loại bỏ. Lớp quy hoạch chỉ vẽ bằng SVG không tương tác, KCHT đường/vùng chỉ vẽ hình học không tương tác; một listener click cấp bản đồ xử lý cả hai nguồn. Marker điểm gọi trực tiếp cùng bộ phân giải và chặn phát sinh click kép.
- Kết quả API dùng cặp trường chuẩn `geometryType`/`coordinates`; frontend vẫn hỗ trợ fallback `loaiHinhHoc`/`toaDo` cho dữ liệu cũ và WKT `MULTIPOINT` legacy. Cùng một nguồn hình học được dùng cho zoom, vẽ và xử lý popup để tránh trạng thái zoom đúng vị trí nhưng không có lớp tương tác.
- Marker kết quả dạng điểm được thu gọn còn 16px; marker có biểu tượng danh mục còn 28px. Đối tượng điểm GIS độc lập dùng bán kính 4px và chấm hiển thị 12px trong vùng bấm 28px, viền trắng để không che nhãn bản đồ; đường/vùng không còn marker tâm giả. Toàn bộ màu, bo góc và bóng dùng semantic token.
- Hồi quy click bản đồ: 17/17 unit test pass cho Point/LineString/Polygon, polygon có lỗ, GeoJSON multi/collection, chỉ mục bounding box, planning-only, KCHT-only, nhiều KCHT và Planning + KCHT chồng lấn. Vite production build pass với 4.121 module.

---

## Regression 2026-09-03 — GitLab #90

### Hành vi đã đồng bộ

- Select nhiều Loại KCHT chỉ hiển thị tối đa hai thẻ trên một dòng; các lựa chọn còn lại thu gọn thành `+N`, tránh đẩy lệch nhãn và trường Địa điểm.
- Font tiêu đề và nội dung bảng kết quả được khóa theo `fontSizeMd`; màn hình mặc định và trạng thái sau Đặt lại không vẽ toàn bộ lớp KCHT thủ công.
- Phóng to, thu nhỏ và toàn màn hình được gom thành cụm dọc bên phải, bên dưới nút Quản lý lớp bản đồ.
- Chuột phải mở popup tọa độ gồm kinh độ, vĩ độ, mức thu phóng và nút sao chép liên kết. URL chia sẻ giữ các tham số bộ lọc hiện có và khôi phục đúng tâm/zoom khi mở lại.
- Ba công cụ đa giác, vùng tròn và chỉnh sửa được đặt ở góc trái dưới, tự dịch sang phải khi panel tra cứu mở. Vùng tròn được chuyển thành polygon đóng 32 cạnh trước khi lưu để tương thích mô hình dữ liệu vùng hiện tại.
- Popup Quy hoạch cảng biển được thu gọn còn khoảng 296–320px, giảm khoảng cách dòng và chiều cao tùy chọn; giới hạn nội dung cuộn 310–330px.
- Các lớp KCHT và Quy hoạch cảng biển tiếp tục dùng bộ phân giải click chung; điều khiển zoom, chuột phải và công cụ vẽ không thay đổi thứ tự hay khả năng hit-test của hai nguồn.

### Kiểm thử hồi quy

| Phạm vi | Kết quả |
|---|---|
| `mapInteraction.test.ts` | 4/4 pass: tạo/đọc URL vị trí, từ chối tọa độ không hợp lệ, chuyển vùng tròn thành polygon đóng |
| `gisGeometry.test.ts` + `planningGis.test.ts` | 17/17 pass: hit-test và phân giải click KCHT/QHCB không hồi quy |
| TypeScript `--noEmit` | Pass |
| Vite production build | Pass sau rebase main mới nhất, 4.119 module được biên dịch |
| Toàn bộ Vitest | 101 test pass; riêng suite `AppLayout.test.tsx` không khởi tạo do lỗi đóng gói ESM/CJS sẵn có giữa `@ant-design/icons` và `@ant-design/colors` |
