# QA Acceptance Oracle — M-028 "Sản lượng cảng biển" / F-301 `seaport_throughput` (Wave 1)

- **Module:** M-028 `san-luong-cang-bien` — **Feature:** F-301 `seaport_throughput`
- **Stage:** engineering-qa-engineer — **Wave:** 1 (acceptance authoring — oracle định nghĩa, KHÔNG chạy battery)
- **Date:** 2026-09-06
- **Wave-2 contract:** wave-2 thực thi đúng các test case dưới đây trên implementation do dev waves bàn giao, ghi observed output vào `07-qa-report-w2.md`. Wave-1 không yêu cầu implementation xanh (chưa tồn tại); yêu cầu duy nhất là mọi AC trong scope có oracle chạy được, không tautological.
- **Write boundary tuân thủ:** chỉ ghi dưới `docs/modules/M-028-san-luong-cang-bien/qa/**`; toàn bộ tài liệu nguồn khác READ-ONLY; không code, không git, không chạy backend.

## 1. Nguồn sự thật (AC-IDs)

| Nguồn | Tài liệu | Nội dung AC trong scope |
|---|---|---|
| BA lean-spec | `ba/00-lean-spec.md` (223 dòng) | 9 UC (UC-SLCB-01..09), 15 BR (BR-SLCB-01..15), §4 7 trạng thái 2 cấp, §5 phân quyền `seaportthroughput:*`, §6 DataScope, §8 validation rules + message tiếng Việt |
| SA design plan | `design/00-design-plan.md` (207 dòng) | DP-1..10, §3 REST 12 endpoint + 9 action, §4 migration `V20260905120000__seaport_throughput.sql`, BE-1..6 / FE-1..5 work orders |
| Feature brief | `_features/F-301-san-luong-cang-bien/feature-brief.md` (250 dòng) | 29 trường STT 1–29, phân quyền riêng 9 action, điểm khác biệt (DataScope dòng 3) |
| Security | `security/03-threat-model.md` (148 dòng) | M-01..M-06 (must-fix, owner + closure criteria), OR-01..03 (SA reconciliation open) |
| Convention | `docs/conventions/approval-2-level-spec.md` (M-1006 DP-9/AC-25) | 7 trạng thái canonical, 4-eyes, reject reason, direct-approve Cục, soft-delete |

**Nguồn dữ liệu TKCT:** Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm **#33 "QL Sản lượng cảng biển"** + URD III.7.53/III.7.54 (UC #148/#149).

**Input CSV (docs/inputs, mới):** `QL bến phao`, `Khu tránh, trú bão`, `Khu chuyển tải` — đã đọc phần đầu (header + bảng trường): đây là danh sách trường của **các module tài sản KCHT khác**, KHÔNG thuộc cụm #33 của M-028; không có AC nào của oracle này phụ thuộc 3 CSV đó. Deliverable này không predate chúng và không cần revises. (Đối chiếu chéo duy nhất dùng được: mẫu TAB 5 "Xử lý & theo dõi" — đã được feature-brief ghi UNRESOLVED, không đưa vào oracle ràng buộc.)

## 2. Identifier canonical (oracle bám theo — SA đã chốt)

| Hạng mục | Canonical (SA/lean) | Cấm / lưu ý |
|---|---|---|
| Resource permission | `seaportthroughput` (không gạch nối) — 9 action: `read, create, update, delete, submit, import, approve, approve_level2, reject` | Brief §4.4 dùng `seaport-throughput:...` (BA-proposal, OR-01) — oracle kiểm theo canonical; lệch spelling ⇒ `@PreAuthorize` không khớp ⇒ 403 với mọi user non-admin |
| Base URL | `/api/v1/seaport-throughput` (design §3) | Brief §6 liệt kê `/api/seaport-throughput` (proposal) — design chốt `/api/v1` |
| Trạng thái (ORDINAL INT) | `DRAFT`(0), `PENDING_APPROVAL`(2), `APPROVED_LEVEL1`(3), `APPROVED`(5), `REJECTED_LEVEL1`(8), `REJECTED_LEVEL2`(9), `ARCHIVED`(7) | Cấm lưu VARCHAR; cấm fallback mã legacy `PROPOSED (1)`/`APPROVED_LEVEL2 (4)`/`REJECTED (6)` |
| 24 cột số liệu EN | nhóm domestic `domestic_container_ton`, `domestic_container_ton_km`, `domestic_dry_ton`, `domestic_dry_ton_km`, `domestic_liquid_ton`, `domestic_liquid_ton_km`, `domestic_other_ton`, `domestic_other_ton_km`; nhóm foreign `foreign_*` (8, cùng pattern); nhóm route `route_*` (8, cùng pattern) + `passenger_trips` | `@FieldNameConstants`, không hardcode chuỗi |
| Message lỗi | Tiếng Việt có dấu theo lean §8 (danh sách đầy đủ §3.3) | Cấm tiếng Anh/không dấu |

## 3. Message oracle (chuỗi khẳng định chính xác — dùng nguyên văn trong assertion)

| Tình huống | Message bắt buộc (chính xác) |
|---|---|
| Trùng (đơn vị, tháng) create/edit (BR-SLCB-01/03) | `Đã tồn tại số liệu sản lượng của đơn vị trong tháng này` |
| Thiếu org_unit_id (BR-SLCB-02) | `Vui lòng chọn Đơn vị quản lý` |
| org_unit_id ngoài phạm vi user (BR-SLCB-02, DS) | `Đơn vị quản lý nằm ngoài phạm vi được phép` |
| Thiếu report_month (BR-SLCB-03) | `Vui lòng chọn Thời gian tổng hợp sản lượng` |
| 24 cột DECIMAL < 0 (BR-SLCB-04) | `Giá trị không được nhỏ hơn 0` |
| passenger_trips < 0 (BR-SLCB-04) | `Lượt hành khách không được nhỏ hơn 0` |
| 4-eyes vi phạm (BR-SLCB-07) | `Người kê khai không được tự phê duyệt bản ghi của mình` |
| Reject thiếu lý do (BR-SLCB-08) | `Vui lòng nhập lý do từ chối` |

## 4. Coverage map — Use cases (UC-SLCB-01..09)

| AC/UC | Criterion | Oracle test case | Exec seam |
|---|---|---|---|
| UC-SLCB-01 | Tạo bản ghi mới → mặc định `DRAFT`; nhập 3 nhóm chỉ tiêu + hành khách + file | TC-UC-01 (happy create + default state) | JUnit service test (`src/test/java/.../SeaportThroughputServiceTest.java`) qua runner trực tiếp |
| UC-SLCB-02 | Sửa/Xóa bản ghi chưa ban hành; xóa chỉ khi `DRAFT`; soft delete ghi `deletedBy` | TC-UC-02 + TC-BR-12 | như trên |
| UC-SLCB-03 | Submit từ `DRAFT`/`REJECTED_*` → ghi `submittedAt`/`submittedBy` | TC-UC-03 + TC-BR-06/13/14 | như trên |
| UC-SLCB-04 | C1 duyệt → `APPROVED_LEVEL1`; C1 từ chối → `REJECTED_LEVEL1` + lý do | TC-UC-04 + TC-APP-02/03 | như trên |
| UC-SLCB-05 | C2 duyệt → `APPROVED` (ban hành); C2 từ chối → `REJECTED_LEVEL2` + lý do | TC-UC-05 + TC-APP-05/06 | như trên |
| UC-SLCB-06 | Xem danh sách + lọc (đơn vị cây, trạng thái, tháng, khoảng ngày cập nhật); sort ngày cập nhật giảm dần | TC-UC-06 | JUnit repository/service + FE visual |
| UC-SLCB-07 | Xem chi tiết (3 nhóm + hành khách + file) + lịch sử hình thành/phê duyệt | TC-UC-07 | JUnit service + FE visual |
| UC-SLCB-08 | Cập nhật từ file Excel; lỗi theo dòng; không ghi nửa chừng | TC-UC-08 + TC-FILE-03/04/05 | JUnit service test (BE-6) |
| UC-SLCB-09 | Upload/xóa file đính kèm (chỉ khi chưa ban hành; sau `APPROVED` qua luồng đặc biệt ghi history) | TC-FILE-01/02 | JUnit service test |

## 5. Coverage map — Business Rules (BR-SLCB-01..15)

| BR | Criterion | Oracle test case |
|---|---|---|
| BR-SLCB-01 | Unique (org_unit_id, report_month) create/edit → message §3 | TC-VAL-01 (+ TC-VAL-03 edit) |
| BR-SLCB-02 | org_unit_id bắt buộc; default = đơn vị người kê khai; không đổi khi sửa | TC-DS-03 (default), TC-DS-05 (disabled/edit), TC-VAL-02 (thiếu) |
| BR-SLCB-03 | report_month bắt buộc, chọn tháng MM/YYYY; không 2 bản ghi cùng đơn vị+tháng | TC-VAL-03 |
| BR-SLCB-04 | 24 cột DECIMAL + passenger_trips ≥ 0, default 0 | TC-VAL-04 (mọi cột), TC-VAL-05 (passenger) |
| BR-SLCB-05 | `APPROVED`: khóa sửa/xóa STT 1–29; chỉ xem + theo dõi | TC-BR-05 |
| BR-SLCB-06 | Submit chỉ từ `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` | TC-BR-06 (negative: submit từ PENDING/APPROVED_LEVEL1/APPROVED) |
| BR-SLCB-07 | 4-eyes: người kê khai không tự duyệt | TC-APP-07 |
| BR-SLCB-08 | Reject bất kỳ cấp nào bắt buộc lý do (lưu `rejection_reason` + history) | TC-APP-08 |
| BR-SLCB-09 | Import: validate danh sách cột; lỗi theo dòng rõ ràng; không ghi nửa chừng | TC-FILE-04/05 |
| BR-SLCB-10 | Mọi thay đổi trạng thái/sửa/xóa ghi đủ audit (`operatorId`/`updatedBy`/`deletedBy`) + lịch sử tập trung | TC-APP-11 (history rows), TC-APP-12 (không trùng lặp) |
| BR-SLCB-11 | Không nhập tên đơn vị tự do; response trả `orgUnitId` + `orgUnitName` | TC-DS-06 |
| BR-SLCB-12 | Đóng băng khi `PENDING_APPROVAL`/`APPROVED_LEVEL1`; chỉ xóa mềm khi `DRAFT` | TC-BR-12 |
| BR-SLCB-13 | Người gửi cấp Cục (`OrgUnit.level`) → submit thẳng `APPROVED_LEVEL1` | TC-APP-09 |
| BR-SLCB-14 | Không hạ hồ sơ đã gửi về `DRAFT`; từ `REJECTED_*` sửa + gửi lại → `PENDING_APPROVAL` | TC-APP-10 |
| BR-SLCB-15 | Text đầu vào `.trim()` trước khi lưu/lọc | TC-VAL-06 |

## 6. Coverage map — Design decisions & cross-cutting (DP/BE/FE)

| AC | Criterion (nguồn) | Oracle test case |
|---|---|---|
| DP-1/2/3 | Entity riêng `SeaportThroughput extends BaseApprovableEntity`, 24 cột + passenger_trips, không bảng con | TC-STR-01 (structural grep + compile) |
| DP-5 | 9 permission action riêng `seaportthroughput:*` (submit/reject/import riêng) | TC-PERM-01..09 |
| DP-6 | DataScope: entity `@Filter`, controller `@DataScope`, ghi validate scope, org_unit_id NOT NULL | TC-DS-01..06 |
| DP-8 | Lịch sử tập trung `infrastructure_history`, refType `SEAPORT_THROUGHPUT`, không tab log riêng | TC-APP-11/12, TC-UI-06 |
| DP-9/BE-6 | Import Excel theo mapping STT 4–27, lỗi dòng, không ghi nửa chừng | TC-FILE-03/04/05 |
| DP-10 | 7 trạng thái canonical, 2 vòng, 4-eyes, Cục submit thẳng | TC-APP-01..10 |
| BE-1 | Migration `V20260905120000__seaport_throughput.sql` + 9 `seedPermission` + `InfrastructureType.SEAPORT_THROUGHPUT` | TC-STR-02 |
| BE-2/3 | Entity/Repository/DTO: 24 field, validate ≥ 0, unique check | TC-STR-01, TC-VAL-01..05 |
| BE-4 | Service: CRUD + submit + approve C1/C2 + reject + history + 4-eyes + reject reason | TC-UC-01..05, TC-APP-* |
| BE-5 | Controller: 12 endpoint, `@DataScope`, `@PreAuthorize` 9 action, message VI | TC-PERM-*, TC-STR-03 |
| BE-6 | Import Excel multipart `.xlsx` | TC-FILE-03/04/05 |
| FE-1..5 | List 6 tab + Drawer 3 mode + rowActions theo status + route/menu EN + 4 trạng thái màn | TC-UI-01..08 |
| M-01..M-06 (security must-fix) | closure criteria của từng mục trong `03-threat-model.md` §7 | TC-SEC-01..06 |
| OR-01..03 | SA reconciliation còn mở — QA ghi nhận, không chặn oracle | — |

## 7. Test case specifications (runnable — wave-2 thực thi)

> Cách chạy (backend): JUnit qua runner trực tiếp với đúng file test — `mvn -pl . test -Dtest=SeaportThroughputServiceTest#<method>` (Maven surefire, `src/test/java`); runner trực tiếp theo Project shape (không chạy suite mặc định toàn cục). FE: `tsc` typecheck trong `frontend/` + kiểm tra visual thủ công theo checklist TC-UI. Không chạy backend server (chính sách dự án). Số liệu test dùng DB disposable / transaction rollback, không đụng DB operator.

### 7.1 TC-UC (use cases)

| ID | Steps (input) | Expected (oracle) |
|---|---|---|
| TC-UC-01 | User có `seaportthroughput:create`, trong DataScope đơn vị A: tạo bản ghi org=A, report_month=2026-08, 24 cột = 0, passenger_trips=0, không file | 2xx; response `approvalStatus=DRAFT`; `orgUnitId`=A; `orgUnitName` trả về (không chỉ id); bản ghi lưu DB đủ 24 cột + passenger_trips |
| TC-UC-02 | (a) Sửa bản ghi `DRAFT` đổi giá trị cột số → 2xx, dữ liệu đổi. (b) Xóa mềm bản ghi `DRAFT` → bản ghi chuyển `ARCHIVED` (hoặc deleted_at), ghi `deletedBy` = user thao tác + history | (a) 2xx; (b) không còn ở danh sách active; `deletedBy` đúng; history ghi soft-delete |
| TC-UC-03 | User submit bản ghi `DRAFT` của đơn vị cấp Cảng vụ | 2xx; `approvalStatus=PENDING_APPROVAL`; `submittedAt`/`submittedBy` được set |
| TC-UC-04 | Lãnh đạo Cảng vụ (quyền `approve`, khác người kê khai) approve C1 bản ghi `PENDING_APPROVAL` trong phạm vi | 2xx; `APPROVED_LEVEL1`; ghi `approvedL1At/By/Note` |
| TC-UC-05 | Lãnh đạo Cục (`approve_level2`) approve C2 bản ghi `APPROVED_LEVEL1` | 2xx; `APPROVED`; `approvedL2At/By` = ban hành; sau đó mọi PUT/DELETE bị chặn |
| TC-UC-06 | GET danh sách với bộ lọc orgUnitId (cây), approvalStatus (comma-list cho tab "Từ chối" = REJECTED_LEVEL1,REJECTED_LEVEL2), reportMonth=2026-08, updatedFrom/To, keyword | 2xx; page đúng; mặc định sort `updatedAt` DESC; lọc "Từ chối" trả cả 2 cấp reject; chỉ trả bản ghi trong DataScope user |
| TC-UC-07 | GET `/{id}` + GET `/{id}/history` | Chi tiết đủ orgUnitName + 24 chỉ tiêu + passenger_trips + files; history trả rows đúng thứ tự thời gian (mới nhất trước), đủ Ngày/Cán bộ/Nội dung từng bước submit/approve/reject |
| TC-UC-08 | POST import file `.xlsx` hợp lệ 2 dòng (2 đơn vị × tháng khác nhau) | 2xx; cả 2 dòng tạo bản ghi `DRAFT`; nếu 1 dòng lỗi validate ⇒ toàn bộ không ghi (BR-09 all-or-nothing) hoặc báo cáo lỗi dòng rõ ràng theo SA chốt — oracle khẳng định: **không có bản ghi ghi nửa chừng** |
| TC-UC-09 | (đi kèm TC-FILE-01/02) | xem §7.4 |

### 7.2 TC-APP (trạng thái + phê duyệt + 4-eyes)

| ID | Steps | Expected |
|---|---|---|
| TC-APP-01 | Chuỗi hợp lệ đầy đủ: create(DRAFT) → submit → approve C1 → approve C2 | Lần lượt `DRAFT→PENDING_APPROVAL→APPROVED_LEVEL1→APPROVED`; mỗi bước lưu metadata + history |
| TC-APP-02 | C1 reject bản ghi `PENDING_APPROVAL` (có lý do) | `REJECTED_LEVEL1`; `rejection_reason` lưu đúng |
| TC-APP-03 | C1 reject **không** lý do | Lỗi 4xx message `Vui lòng nhập lý do từ chối`; trạng thái không đổi |
| TC-APP-04 | Reject ở cấp Cục (C2) bản ghi `APPROVED_LEVEL1` (có lý do) | `REJECTED_LEVEL2` |
| TC-APP-05 | approve_level2 từ user **không** có quyền `approve_level2` (vd user Cảng vụ) | 403; trạng thái không đổi |
| TC-APP-06 | approve C1 từ user cấp Cục không thuộc phạm vi Cảng vụ của bản ghi | 403 hoặc 400 theo DataScope; trạng thái không đổi |
| TC-APP-07 | Người kê khai tự approve/reject bản ghi mình tạo (cả C1 lẫn C2) | Lỗi message `Người kê khai không được tự phê duyệt bản ghi của mình`; trạng thái không đổi (4-eyes) |
| TC-APP-08 | Reject lưu `rejection_reason` + nội dung phê duyệt + lịch sử đủ | §3 message; history có row reject kèm reason |
| TC-APP-09 | User có org thuộc cấp Cục (`OrgUnit.level` = Cục) submit bản ghi mới | Submit thẳng `APPROVED_LEVEL1` (bỏ vòng 1); không dừng ở `PENDING_APPROVAL` |
| TC-APP-10 | (a) Gọi endpoint hạ `PENDING_APPROVAL`/`APPROVED_LEVEL1`/`APPROVED` về `DRAFT` → bị chặn. (b) Sửa bản ghi `REJECTED_LEVEL1` rồi submit lại | (a) lỗi; (b) `PENDING_APPROVAL` (về đúng vòng cần duyệt) |
| TC-APP-11 | Sau chuỗi create→submit→approve→approve_level2, gọi history | Đúng 1 row/bước, đúng thứ tự; không row trùng lặp chuyển trạng thái |
| TC-APP-12 | Sau `APPROVED`, thay đổi dữ liệu/file qua luồng `recordSaveAndApprove` | Ghi `infrastructure_history` trước/sau; bản ghi vẫn `APPROVED` hoặc theo luồng đặc biệt; không ghi dòng trạng thái trùng |

### 7.3 TC-VAL (validation)

| ID | Steps | Expected |
|---|---|---|
| TC-VAL-01 | Create org=A report_month=2026-08; lặp lại create org=A report_month=2026-08 | 4xx message `Đã tồn tại số liệu sản lượng của đơn vị trong tháng này` |
| TC-VAL-02 | Create thiếu org_unit_id (hoặc NULL) | 4xx message `Vui lòng chọn Đơn vị quản lý`; DB không có row org_unit_id NULL |
| TC-VAL-03 | (a) Create thiếu report_month; (b) Edit đổi report_month thành tháng đã có bản ghi khác cùng đơn vị | (a) `Vui lòng chọn Thời gian tổng hợp sản lượng`; (b) message trùng unique |
| TC-VAL-04 | Lần lượt gửi giá trị âm cho **từng cột trong 24 cột** (`domestic_container_ton` … `route_other_ton_km`) | Mỗi cột: 4xx `Giá trị không được nhỏ hơn 0`; giá trị ≥ 0 (kể cả 0 và số thập phân ≤ 2 chữ số) chấp nhận |
| TC-VAL-05 | `passenger_trips` = -1 | 4xx `Lượt hành khách không được nhỏ hơn 0`; = 0/nguyên dương chấp nhận |
| TC-VAL-06 | `note` = `"  abc  "` và file_name có khoảng trắng thừa; keyword tìm kiếm có khoảng trắng đầu/cuối | Lưu/lọc sau trim → `"abc"`; tìm kiếm khớp kết quả (BR-15) |
| TC-VAL-07 | (đi kèm TC-DS-02) | xem §7.5 |
| TC-VAL-08 | Input vượt precision NUMERIC(18,2) (vd 1e12 tấn với 3 chữ số thập phân) | 4xx validate (không chấp nhận >2 chữ số thập phân hoặc tràn); không silent truncate |

### 7.4 TC-FILE (upload / import)

| ID | Steps | Expected |
|---|---|---|
| TC-FILE-01 | POST `/{id}/files` (bản ghi `DRAFT`) với file tên có trim | 2xx; row con `seaport_throughput_file` có `throughput_id` FK, `file_name` trim, `file_path`, `file_size`, `file_type`; GET chi tiết trả danh sách file |
| TC-FILE-02 | (a) DELETE `/{id}/files/{fileId}` khi bản ghi `PENDING_APPROVAL`/`APPROVED_LEVEL1` → bị chặn; (b) khi `DRAFT` → xóa row con; (c) sau `APPROVED` qua luồng đặc biệt → history ghi nhận | (a) lỗi; (b) 2xx, row con mất; (c) history có bước thay đổi file |
| TC-FILE-03 | POST `/import` (multipart `.xlsx`) không có quyền `import` | 403 |
| TC-FILE-04 | Import file sai định dạng cột / thiếu cột bắt buộc (Đơn vị quản lý / Thời gian tổng hợp) | Lỗi báo theo dòng rõ ràng; **không ghi nửa chừng** (BR-09) |
| TC-FILE-05 | Import file có 1 dòng trùng (đơn vị, tháng) đã tồn tại | Lỗi theo dòng message unique §3; các dòng hợp lệ khác xử lý theo phương án SA chốt; tổng DB không có ghi nửa chừng |

### 7.5 TC-DS (DataScope per org unit)

| ID | Steps | Expected |
|---|---|---|
| TC-DS-01 | User đơn vị A (cấp dưới, có con A1) gọi GET danh sách | Chỉ thấy bản ghi org ∈ subtree A (A + A1 + …); không thấy bản ghi đơn vị anh em B (entity `@Filter` + controller `@DataScope` hoạt động) |
| TC-DS-02 | User đơn vị A tạo bản ghi gán org=B (ngoài phạm vi) | 4xx message `Đơn vị quản lý nằm ngoài phạm vi được phép`; không ghi DB |
| TC-DS-03 | User đơn vị A tạo bản ghi không gửi org_unit_id | org tự động gán = đơn vị người kê khai (fallback) nếu nằm trong scope; DB không NULL |
| TC-DS-04 | User Admin Cục / ROLE_SYSTEM_ADMIN (orgunit:scope_all / admin:all) gọi danh sách | Thấy full mọi đơn vị |
| TC-DS-05 | Edit bản ghi: gửi org_unit_id khác | Bị chặn/không đổi (field disabled backend-side: request đổi org → lỗi hoặc giữ nguyên giá trị cũ); oracle chấp nhận 1 trong 2 nhưng KHÔNG được lưu org mới |
| TC-DS-06 | GET `/{id}` response | Chứa cả `orgUnitId` (UUID) + `orgUnitName` (map `OrgUnitCacheService`); không chứa trường tên nhập tay |
| TC-DS-07 | Approve C1 từ lãnh đạo Cảng vụ đơn vị khác (ngoài phạm vi Cảng vụ của bản ghi) | 403/400; trạng thái không đổi |

### 7.6 TC-PERM (9 action `seaportthroughput:*` — mỗi action 1 test dương + 1 âm)

| ID | Action | Endpoint test | Negative (thiếu quyền) |
|---|---|---|---|
| TC-PERM-01 | `read` | GET list + GET `/{id}` + GET `/{id}/history` | 403 |
| TC-PERM-02 | `create` | POST | 403 |
| TC-PERM-03 | `update` | PUT `/{id}`; POST `/{id}/files`; DELETE `/{id}/files/{fileId}` | 403 |
| TC-PERM-04 | `delete` | DELETE `/{id}` | 403 |
| TC-PERM-05 | `submit` | POST `/{id}/submit` | 403 (user có update nhưng không có submit → 403; không fallback sang update) |
| TC-PERM-06 | `import` | POST `/import` | 403 |
| TC-PERM-07 | `approve` | POST `/{id}/approve` | 403 |
| TC-PERM-08 | `approve_level2` | POST `/{id}/approve-level2` | 403 |
| TC-PERM-09 | `reject` | POST `/{id}/reject` | 403 |

> Negative dùng user có toàn bộ 8 action còn lại nhưng thiếu đúng action đang test ⇒ chứng minh kiểm tra **từng thao tác** theo action (không lỏng hơn). ROLE_SYSTEM_ADMIN vượt mọi check (không dùng làm negative). Kiểm chứng kèm: grep `PermissionSeeder.java` đủ 9 dòng `seedPermission(definitions,"seaportthroughput",…)` (TC-STR-02).

### 7.7 TC-UI (FE — 4 trạng thái màn + hành vi list/drawer)

| ID | Checklist (visual, `frontend/`) | Expected |
|---|---|---|
| TC-UI-01 | Route `/seaport-throughput` + menu module; vào trang khi có `seaportthroughput:read`, không vào/ẩn menu khi thiếu | Route render đúng; phân quyền menu theo permission |
| TC-UI-02 | List = ScreenHeader + FilterTableLayout (`hideFilterToggle=true`, sidebar 280px, 2 nút Reload + Tìm kiếm) + StatusTabs + DataTable + Pagination; cột: orgUnitName, report_month (MM/YYYY), Cán bộ cập nhật, Ngày cập nhật, Trạng thái (Pill Badge), Thao tác cố định phải | Đúng bố cục convention; **không** tự dựng search/table riêng |
| TC-UI-03 | StatusTabs 6 tab: Tất cả / Lưu tạm / Chờ Cảng vụ duyệt / Chờ Cục duyệt / Ban hành / Từ chối; count "Tất cả" = tổng 5 tab; tab Từ chối gộp REJECTED_LEVEL1+REJECTED_LEVEL2 | Count khớp (assert số nguyên); chuyển tab đổi query `approvalStatus` đúng |
| TC-UI-04 | 4 trạng thái màn: (a) loading (spinner khi gọi API chậm), (b) error (message lỗi tiếng Việt + không vỡ layout), (c) empty (EmptyState giữ chiều cao thân bảng, scroll ngang ở đáy), (d) data (bảng đủ cột, badge viên thuốc) | Kiểm tra lần lượt 4 trạng thái; empty không gây scroll-bar giữa bảng; sau lọc/reset `scrollLeft` về 0 |
| TC-UI-05 | Drawer 3 mode: create (đủ 3 nhóm 8 ô InputDecimal + passenger_trips + note + UploadFileTable), edit (org_unit_id disabled, report_month disabled nếu đã submit/APPROVED), view (chỉ đọc); "Thông tin phê duyệt" toggle nằm trong tab Thông tin chung; KHÔNG tab "log cập nhật" | Đúng mode; trường bắt buộc có validate trước khi gửi; message lỗi backend hiển thị nguyên văn tiếng Việt |
| TC-UI-06 | "Lịch sử" mở từ rowActions (không phải tab); Drawer child-table/pagination theo `DRAWER_TABLE_SCROLL_Y`; phân trang đứng im khi đổi tab | Drawer không phát sinh scroll dọc ngoài body; pagination cố định tọa độ |
| TC-UI-07 | rowActions theo status: DRAFT → Sửa/Xóa/Gửi duyệt; PENDING_APPROVAL/APPROVED_LEVEL1 → Xem chi tiết (+ Phê duyệt/Từ chối nếu đủ quyền cấp & khác người kê khai); REJECTED_* → Sửa/Gửi lại; APPROVED → Xem chi tiết | Ẩn nút khi thiếu quyền (không dựa 403); 4-eyes: user kê khai KHÔNG thấy nút duyệt bản ghi mình |
| TC-UI-08 | `.trim()` ở FE trước khi gửi mọi text; badge nhãn module: DRAFT→Lưu tạm, PENDING_APPROVAL→Chờ Cảng vụ duyệt, APPROVED_LEVEL1→Chờ Cục duyệt, APPROVED→Ban hành, REJECTED_LEVEL1→Từ chối Cảng vụ, REJECTED_LEVEL2→Từ chối Cục | Nhãn + màu semantic token; không hardcode hex |

### 7.8 TC-STR (structural — kiểm chứng artifact dev bàn giao)

| ID | Check (bounded) | Expected |
|---|---|---|
| TC-STR-01 | `src/main/java/com/hanghai/kchtg/seaportthroughput/` tồn tại entity `SeaportThroughput` (extends BaseApprovableEntity, `@Filter(orgUnitFilter)`, `@FieldNameConstants`, 24 field BigDecimal + passengerTrips Long) | Compile `mvn -DskipTests compile` Pass; grep field EN đủ 24 + passenger_trips; grep 0 hardcode chuỗi trạng thái/tên field |
| TC-STR-02 | `src/main/resources/db/migration/V20260905120000__seaport_throughput.sql` tồn tại; `PermissionSeeder.java` có 9 `seedPermission(…"seaportthroughput"…)`; `InfrastructureType` có member `SEAPORT_THROUGHPUT` | File đúng tên; grep 9 action; grep member |
| TC-STR-03 | Controller `SeaportThroughputController` khai `@DataScope` class-level + `@RequestMapping("/api/v1/seaport-throughput")`; 12 endpoint ánh xạ đúng 9 action theo §3 design | Grep + compile; không endpoint dùng action sai (vd submit dùng `update`) |

### 7.9 TC-SEC (security must-fix M-01..M-06 closure)

| ID | Must-fix (nguồn threat-model) | Oracle kiểm chứng closure |
|---|---|---|
| TC-SEC-01 | M-01: permission authz từng action + record-level IDOR | TC-PERM-01..09 + TC-APP-05/06: user đơn vị B truy cập GET `/{id}` bản ghi đơn vị A → 403/404; không lộ dữ liệu |
| TC-SEC-02 | M-02: DataScope chiều ghi validate + cấm NULL org_unit_id | TC-DS-02/03 + TC-VAL-02; DDL `org_unit_id UUID NOT NULL` |
| TC-SEC-03 | M-03: 4-eyes + state machine + TOCTOU | TC-APP-07 + TC-APP-10; approve song song/trùng submit → chỉ 1 chuyển trạng thái thành công (optimistic/concurrency guard), trạng thái cuối nhất quán |
| TC-SEC-04 | M-04: file upload/import hardening (loại file, kích thước, path traversal) | Import chỉ nhận `.xlsx`; upload theo cơ chế storage dự án; tên file không chứa path traversal; lỗi không ghi nửa chừng |
| TC-SEC-05 | M-05: audit đầy đủ | TC-APP-11/12: operatorId/updatedBy/deletedBy đúng user thao tác trên mọi thay đổi |
| TC-SEC-06 | M-06: Cục-level resubmit routing (REJECTED_LEVEL2 → submit đúng vòng) | TC-APP-10(b): reject ở C2 → sửa → submit → `PENDING_APPROVAL` (không nhảy thẳng `APPROVED_LEVEL1` trừ user cấp Cục theo BR-13) |

## 8. Oracle design notes (cho dev waves + QA wave-2)

1. **Một AC có thể cần nhiều TC; một TC có thể chứng minh nhiều BR** — coverage map §4–§6 là ánh xạ chính; không bắt buộc số TC = số AC.
2. **Tautology guard:** mọi TC dương đều có assertion trạng thái/giá trị quan sát được từ response hoặc DB (không chỉ "status code 2xx"); mọi TC âm đều khẳng định message chính xác §3 và **trạng thái không đổi** (side-effect free) — đây là chiều phủ định giá trị cao nhất.
3. **4-eyes test bắt buộc 2 tài khoản khác nhau** (kê khai vs duyệt) — dùng chung 1 user cho cả 2 bước là test sai thiết kế.
4. **DataScope test cần cây OrgUnit ≥ 3 nút** (cha – con – anh em) + 1 tài khoản cấp Cục; seed dữ liệu test phải disposable.
5. **Message assertion dùng nguyên văn chuỗi §3** (so khớp chính xác, không substring mơ hồ); mọi message phải tiếng Việt có dấu.
6. **Import**: file mẫu chuẩn chưa chốt (design §8.3) — BE-6 mapping STT 4–27 theo §2.1; nếu file thực tế lệch cột thì dev báo PMO, chỉnh mapping, KHÔNG đổi schema (chuyển tiếp cho QA wave-2 khi có file mẫu chốt).
7. **OR-01 (spelling resource), OR-02 (no-self-approve flow), OR-03 (import atomicity)** — còn mở theo security §8; oracle đã chốt theo hướng SA (canonical `seaportthroughput`, 4-eyes chặn, import không ghi nửa chừng). Nếu SA đổi quyết định, wave-2 phải cập nhật TC tương ứng trước khi chạy.
8. **Không oracle hóa** các yêu cầu UI mỹ thuật ngoài convention (màu/spacing) — đã có sẵn convention + audit UI; QA chỉ assert hành vi liệt kê TC-UI.

## 9. Wave-1 verdict (authoring)

Acceptance map hoàn chỉnh cho toàn bộ AC trong scope: 9 UC (TC-UC-01..09), 15 BR (ánh xạ đầy đủ §5), DataScope 7 TC (TC-DS-01..07), permission 9 action × dương/âm (TC-PERM-01..09), 2-level approval + 4-eyes + 7 trạng thái (TC-APP-01..12), validation 24 cột ≥ 0 + passenger_trips + unique + trim (TC-VAL-01..08), file/import (TC-FILE-01..05), 4 UI states + list/drawer hành vi (TC-UI-01..08), structural dev-evidence (TC-STR-01..03), security must-fix closure (TC-SEC-01..06). Mọi TC có oracle quan sát được, không tautological, seam thực thi xác định (JUnit qua runner trực tiếp / FE typecheck + visual). Implementation chưa tồn tại (dev waves chưa chạy) — đây là input dev dự kiến, không phải blocker của wave-1.
