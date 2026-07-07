---
id: F-115
name: "Danh sách Bến cảng"
slug: ui-ql-bc-danh-sach
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:19Z"
last-updated: "2026-07-01T04:08:19Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Danh sách Bến cảng

## Description

Tính năng "Danh sách Bến cảng" (F-115) cung cấp giao diện quản lý và hiển thị toàn bộ danh sách các bến cảng thuộc quyền quản lý của đơn vị, cho phép người dùng tìm kiếm, lọc, phân trang và sắp xếp dữ liệu một cách trực quan. Bảng danh sách hiển thị các thông tin chính bao gồm: mã bến (maBen), tên bến (tenBen), tên bến cảng cha (cangBienId — tra cứu từ bảng CangBien), tọa độ GPS (viDo, kinhDo), trạng thái hoạt động (trangThaiHoatDong), trạng thái phê duyệt (trangThaiPheDuyet), và thời gian cập nhật cuối cùng (updatedAt). Dữ liệu được phân trang với tùy chọn 20 hoặc 100 mục mỗi trang, mặc định sắp xếp theo updatedAt giảm dần. Người dùng có thể tìm kiếm theo mã bến hoặc tên bến, và lọc theo trạng thái hoạt động (HIEN_HANH / TAM_NGUNG). Các thao tác tương tác bao gồm: xem chi tiết, chỉnh sửa, xóa (soft-delete), phê duyệt (dành cho người dùng có quyền Leader), và xem lịch sử thay đổi. Giao diện hỗ trợ điều hướng bằng bàn phím (Tab để di chuyển giữa các trường, Enter để thực hiện hành động), đảm bảo tuân thủ các tiêu chuẩn Accessibility (WCAG 2.1 AA). Dữ liệu được lấy từ API `GET /api/v1/ben-cang` với các query parameter `search`, `status`, `page`, `pageSize`, `sortBy`, `sortOrder`.

## Business Intent

Cho phép cán bộ quản lý tài sản cảng biển nắm bắt nhanh chóng toàn bộ danh sách bến cảng đang được vận hành hoặc tạm ngừng, hỗ trợ ra quyết định về phân bổ nguồn lực, điều chỉnh kế hoạch khai thác và giám sát tuân thủ trạng thái phê duyệt theo quy định của cơ quan quản lý nhà nước về giao thông vận tải biển.

## Flow Summary

Người dùng truy cập màn hình "Quản lý Bến cảng" → hệ thống hiển thị bảng danh sách với phân trang mặc định 20 dòng, sắp xếp theo updatedAt giảm dần. Người dùng nhập từ khóa tìm kiếm vào ô "Tìm theo mã/tên bến" (gọi API với param `search`) hoặc chọn bộ lọc trạng thái hoạt động từ dropdown (HIEN_HANH / TAM_NGUNG). Kết quả được render lại trong vòng 500ms với hiệu ứng loading indicator. Mỗi hàng trong bảng hiển thị trạng thái bằng badge màu (vàng: CHO_PHE_DUYET, xanh lá: DUOC_PHE_DUYET, đỏ: TU_CHO, xanh dương: HIEN_HANH, cam: TAM_NGUNG). Người dùng nhấn Enter hoặc click vào tên bến để mở màn hình chi tiết (F-116), nhấn nút "Chỉnh sửa" để vào màn hình cập nhật (F-118), nhấn nút "Xóa" để xác nhận xóa mềm, nhấn nút "Phê duyệt" (chỉ hiển thị cho Leader) để chuyển sang màn hình phê duyệt (F-119), hoặc nhấn "Lịch sử" để xem lịch sử thay đổi (F-121). Thao tác bàn phím: Tab để di chuyển giữa các nút hành động, Enter để kích hoạt hành động được focus.

## Acceptance Criteria

1. Khi mở màn hình danh sách, hệ thống gọi API `GET /api/v1/ben-cang?page=1&pageSize=20&sortBy=updatedAt&sortOrder=DESC` và hiển thị tối đa 20 bản ghi mỗi trang.
2. Người dùng nhập từ khóa vào ô tìm kiếm (maBen hoặc tenBen) và nhấn Enter, hệ thống gọi `GET /api/v1/ben-cang?search=<keyword>` và hiển thị kết quả khớp trong vòng 500ms.
3. Dropdown lọc trạng thái hoạt động hiển thị các tùy chọn: "Tất cả", "Hiện hành", "Tạm ngừng". Khi chọn một trạng thái, bảng danh sách được lọc tương ứng và hiển thị kết quả trong vòng 500ms.
4. Mỗi hàng trong bảng hiển thị: maBen, tenBen, tên bến cảng cha (cangBienId resolved to CangBien.ten), viDo, kinhDo, badge trạng thái hoạt động, badge trạng thái phê duyệt, updatedAt. Badge trạng thái phê duyệt có màu: vàng (CHO_PHE_DUYET), xanh lá (DUOC_PHE_DUYET), đỏ (TU_CHO).
5. Nút "Xem chi tiết" trên mỗi hàng mở màn hình chi tiết Bến cảng (F-116) với id tương ứng.
6. Nút "Chỉnh sửa" mở màn hình cập nhật (F-118) với dữ liệu pre-filled của BenCang tương ứng.
7. Nút "Xóa" mở hộp thoại xác nhận xóa mềm; sau khi xác nhận, hệ thống gọi `DELETE /api/v1/ben-cang/:id` và bản ghi bị ẩn khỏi danh sách (soft-delete).
8. Nút "Phê duyệt" chỉ hiển thị cho các Role có quyền authentication `bencang:approve`; khi click, mở màn hình phê duyệt (F-119).
9. Nút "Lịch sử" mở màn hình lịch sử thay đổi (F-121) của BenCang tương ứng.
10. Người dùng có thể chuyển giữa các trang bằng phân phối số trang hoặc click Previous/Next; mỗi lần chuyển trang hiển thị tối đa 20 hoặc 100 mục (tùy chọn dropdown pageSize).
11. Phím Tab di chuyển focus giữa các ô nhập liệu và các nút hành động; phím Enter kích hoạt hành động của phần tử đang focus.
12. Khi danh sách trống (không có kết quả tìm kiếm), hiển thị thông báo "Không tìm thấy Bến cảng nào phù hợp" với hướng dẫn tạo mới.

## In Scope

- Hiển thị danh sách Bến cảng với phân trang, sắp xếp, tìm kiếm và lọc.
- Các cột: maBen, tenBen, cangBienId (parent name), viDo, kinhDo, trangThaiHoatDong, trangThaiPheDuyet, updatedAt.
- Badge trạng thái với mã màu chuẩn (vàng/xanh lá/đỏ/xanh dương/cam).
- Các hành động: Xem chi tiết, Chỉnh sửa, Xóa, Phê duyệt, Lịch sử.
- Điều hướng bàn phím (Tab/Enter).
- Loading state và error handling (toast thông báo lỗi từ backend).
- Responsive layout cho màn hình desktop và tablet.

## Out of Scope

- Tạo mới Bến cảng (thuộc F-117).
- Xem chi tiết đầy đủ với attachment và approval action (thuộc F-116).
- Chỉnh sửa Bến cảng (thuộc F-118).
- Phê duyệt / từ chối Bến cảng chi tiết (thuộc F-119).
- Xóa mềm Bến cảng (thuộc F-120).
- Xem lịch sử thay đổi chi tiết (thuộc F-121).
- Export danh sách ra Excel/PDF.
- Bulk operations (chọn nhiều dòng để xử lý đồng loạt).
- Phân quyền chi tiết từng cột hoặc hành động (chỉ kiểm tra quyền hành động).

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien | Full access | Được phép xem, tạo, chỉnh sửa, xóa, phê duyệt tất cả Bến cảng trong hệ thống. Quyền `bencang:create/read/update/delete/approve`. |
| QuanLyDonVi | Read + Update + Approve | Được xem danh sách, xem chi tiết, chỉnh sửa Bến cảng thuộc đơn vị mình, phê duyệt Bến cảng thuộc đơn vị mình. Không có quyền xóa. |
| NhanVien | Read only | Chỉ được xem danh sách và chi tiết Bến cảng. Không có quyền chỉnh sửa, xóa hoặc phê duyệt. |
| ThanhVienPheDuyet | Read + Approve | Được xem danh sách và chi tiết; có quyền phê duyệt / từ chối Bến cảng thuộc đơn vị mình. Không có quyền chỉnh sửa hoặc xóa. |

## Entities

| Entity | Fields |
|---|---|
| BenCang | id (UUID), maBen (string, unique, length≤50), tenBen (string, length≤255), cangBienId (UUID, parent ref), tuyenDuongThuy (string, length≤255), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), chieuDai (BigDecimal, precision 15 scale 2), chieuRong (BigDecimal, precision 15 scale 2), loaiBen (string, length≤100), doSauLuong (BigDecimal, precision 10 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string, length≤50: CHO_PHE_DUYET/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime) |
| CangBien | id (UUID), ten (string) — được join qua cangBienId để hiển thị tên bến cảng cha |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-115-01 | maBen phải là duy nhất trong toàn bộ hệ thống. | Create/Update | BenCang spec |
| BR-115-02 | Bến cảng cha (CangBien) phải có trạng thái HIEN_HANH mới được hiển thị trong danh sách hoặc tạo mới. | Create / Filter | Parent guard |
| BR-115-03 | viDo phải nằm trong khoảng [-90, 90], kinhDo phải nằm trong khoảng [-180, 180]. | Create / Update | GPS validation |
| BR-115-04 | Trạng thái phê duyệt mặc định khi tạo mới là CHO_PHE_DUYET. | Create | Default status |
| BR-115-05 | Khi cập nhật, trạng thái phê duyệt được reset về CHO_PHE_DUYET để yêu cầu phê duyệt lại. | Update | Reset approval |

## Testing Strategy

Kiểm thử chấp nhận tập trung vào các kịch bản: (1) hiển thị danh sách đúng cấu trúc phân trang với 20 và 100 mục; (2) tìm kiếm chính xác theo maBen và tenBen với các trường hợp substring match và exact match; (3) lọc theo trạng thái hoạt động HIEN_HANH và TAM_NGUNG, xác nhận kết quả đúng; (4) sắp xếp theo updatedAt giảm dần; (5) xác nhận badge màu trạng thái hiển thị chính xác cho 5 giá trị; (6) xác nhận các nút hành động hiển thị đúng theo Role (nút Phê duyệt chỉ hiển thị cho Leader); (7) điều hướng bàn phím Tab/Enter hoạt động đúng thứ tự và hành động; (8) xử lý lỗi API (HTTP 404, 500) hiển thị toast thông báo phù hợp; (9) kiểm thử responsive trên breakpoint desktop (≥1024px) và tablet (768-1023px).
