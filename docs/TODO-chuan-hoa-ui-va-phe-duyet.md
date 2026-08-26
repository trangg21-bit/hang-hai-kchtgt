# TODO — Chuẩn hóa UI danh sách/form & quy trình phê duyệt 2 cấp

Ghi lại ngày 2026-08-26. Đây là phần **còn dở**, tạm dừng theo yêu cầu để quay lại sau.
Phần đã làm chỉ liệt kê ngắn để biết điểm dừng.

---

## Đã làm (điểm dừng hiện tại)

**Component dùng chung mới viết** — đã áp cho màn Đài vệ tinh Inmarsat (`/station/special`):

| Component | Đường dẫn | Thay cho |
|---|---|---|
| `ListPageContainer` | `frontend/src/components/list-view/ListPageContainer.tsx` | `<div style={{display:'flex',flexDirection:'column',height:'calc(100% - 32px)'}}>` chép tay ở 5+ màn |
| `SidebarFilterField` | `frontend/src/components/list-view/SidebarFilterField.tsx` | cụm `<div><div style={filterLabelStyle}>Nhãn</div><Control/></div>` chép tay |
| `FormSaveFooter` | `frontend/src/components/shared/FormSaveFooter.tsx` | bộ 3 nút "Lưu tạm / Lưu và gửi phê duyệt / Lưu và phê duyệt" chép tay ở 11 màn |
| `FORM_TAB_LABEL` | `frontend/src/components/shared/formTabs.ts` | nhãn tab form tự đặt tên ("Vị trí & GIS", "Tệp đính kèm", đánh số 1..5) |
| token `listPageContainerStyle` | `frontend/src/tokens.ts` | giá trị `calc(100% - 32px)` rải rác |

**Backend**: VTS (`coastal_station_vts`) và Cospas-Sarsat đã chuyển sang quy trình 2 cấp chuẩn
(`InfrastructureApprovalService`, quy tắc 14, chống tự duyệt 4 mắt); nhật ký nhà trạm đã
chuyển từ in-memory sang bảng `infrastructure_history`.

---

## TODO

### 1. Lan bốn component dùng chung ra các màn còn lại — ưu tiên cao

Mỗi màn làm độc lập, rủi ro thấp vì chỉ đổi phần render.

- [ ] `FormSaveFooter` cho 11 màn còn chép tay bộ 3 nút: `services/port/PortListPage`,
      `pages/port/BerthListPage`, `pages/port/PierListPage`, `pages/port/DryPortListPage`,
      `pages/dikerevetment/DikeRevetmentList`, `pages/vtssystem/VtsSystemForm`,
      `pages/vtssystem/VtsSystemList`, `pages/aissystem/AisSystemFormModal`,
      `pages/vtsoperationcenter/VtsOperationCenterFormModal`,
      `services/buoy/BuoyListPage`, `services/buoy-station/BuoyStationListPage`.
      **Lưu ý**: `AppDrawer` đã tự bọc `drawerFooterStyle`, `FormSaveFooter` chỉ trả về các nút.
      Màn nào còn dùng `<Drawer>` antd thô thì phải tự bọc `<div style={drawerFooterStyle}>`.
- [ ] `ListPageContainer` cho các màn còn chép `height: 'calc(100% - 32px)'`:
      `VtsSystemList`, `RadarStationList`, `DikeRevetmentList`, `PortListPage`, `AisSystemList`.
- [ ] `SidebarFilterField` cho các panel lọc tự dựng nhãn.
- [ ] `FORM_TAB_LABEL` cho các form còn đặt tên riêng — rà `'Thông tin cơ bản'` (7 chỗ),
      `'Vị trí (GIS)'` (2 chỗ), `'Tệp đính kèm'`.

### 2. Tám màn còn dùng `FilterBar` thay vì `FilterTableLayout`

Trái với `docs/conventions/list-screen-ui-standard.md`. Ba màn in đậm là KCHT nên ưu tiên:

- [ ] **`pages/port/WaterZoneList`** (Vùng nước)
- [ ] **`pages/station/CoastalStationList`** (Đài duyên hải VTS)
- [ ] **`pages/station/CospasSarsatStationList`** (Đài Cospas-Sarsat — dựng theo mẫu
      `CoastalStationList` cũ nên thừa hưởng luôn cách làm sai; cần dựng lại theo
      `ListPageContainer` + `FilterTableLayout` + `AppDrawer` + `FormSaveFooter`)
- [ ] `pages/gis/PointObjectList`, `LineObjectList`, `PolygonObjectList`, `MapLayerList`
- [ ] `pages/groups/GroupMembers`

### 3. Màn Đài vệ tinh Inmarsat — phần chưa xong

- [ ] Bật nút **"Lưu và phê duyệt"** khi backend Inmarsat mở đường duyệt thẳng cho cấp Cục
      (như `VtsSystemService` đang làm). Hiện `FormSaveFooter` đã có sẵn prop `canApprove`,
      chỉ cần truyền `true`. Chưa bật vì `approveLevel1` chặn 4 mắt — người tạo bấm vào
      chắc chắn lỗi.
- [ ] Dọn ~13 import/biến thừa và 1 lỗi kiểu thật còn sót từ trước:
      `SpecialStationList.tsx:140` — `Parameter 's' implicitly has an 'any' type`
      (`usePermissionStore((s) => ...)`).
- [ ] Bộ lọc `updatedBy` đang gửi UUID cán bộ; kiểm tra lại backend trả đúng dữ liệu khi lọc.

### 4. Backend — các loại KCHT chưa theo chuẩn phê duyệt 2 cấp

Theo `docs/conventions/approval-2-level-spec.md` (kết quả rà soát 2026-08-26):

- [ ] **CCTV** — chỉ `/approve` + `/reject`, không có `/submit`; tạo mới set thẳng `APPROVED`.
- [ ] **Đèn biển & nhà trạm (BeaconStation)** — chỉ `/approve-l1`, `approveL1` set thẳng `APPROVED`.
- [ ] **Trạm Radar** — backend đủ c1/c2 nhưng frontend chỉ dựng 1 cấp
      (`RadarStationList.tsx` ghi rõ "approval 1 cấp"), hồ sơ kẹt ở `APPROVED_LEVEL1`.
- [ ] **Cảng cạn (DryPort)** — frontend chỉ có một nút `approve()`.
- [ ] **Đài LRIT, Đài Hải Phòng** — vẫn dùng `/approve` tự toggle L1→L2, status legacy
      `APPROVED_LEVEL2`, không dùng `InfrastructureApprovalService`, không chống tự duyệt.
      (VTS và Cospas-Sarsat đã sửa xong, hai đài này làm y hệt cách đó.)
- [ ] **Cơ sở sửa chữa & đóng tàu** — có `/approve/c1`, `/c2` nhưng **không có endpoint submit**;
      dùng status legacy `PROPOSED`/`REJECTED`.
- [ ] **Đê kè (frontend)** — `DikeRevetmentList` gọi `dikeRevetmentApproval.approveL1()` /
      `.reject()` là hai hàm **không tồn tại** trong service → bấm Phê duyệt/Từ chối lỗi JS.
      `TAB_QUERY_MAP` map tab "Nháp" → `PROPOSED` trong khi backend tạo mới = `DRAFT`
      → tab Nháp luôn 0 và không hiện nút Gửi phê duyệt / Xóa.

### 4b. Quy tắc 12 + nhãn trạng thái — ĐÃ LÀM 26/08/2026

Đã chốt ma trận "cho sửa khi nào" (`approval-2-level-spec.md` mục **3.9**) và gom nhãn trạng
thái về một nguồn (mục **3.10**). Chi tiết đã làm:

- Tài liệu: mục 3.9 + 3.10 trong `approval-2-level-spec.md`; sửa `infrastructure-screen-template.md`
  (§3.6 footer + `rowActions` mẫu), `infrastructure-feature-standard-architecture.md` (§4.10 điểm 4),
  `.agents/AGENTS.md`; thêm khối đính chính vào **12 feature-brief** nói ngược quy tắc.
- Frontend: `utils/approvalEditPolicy.ts` (`canEditApprovalRecord`, `normalizeApprovalStatus`),
  áp cho **16 màn**; `ApprovalStatusBadge` thành nguồn nhãn duy nhất, áp cho **18 màn**.
- Backend: `InfrastructureApprovalService.assertEditable()` + cắm vào 8 service `update()`;
  4 test mới trong `VtsSystemServiceTest`.

**Bổ sung 26/08/2026 — quy tắc 11 (điều kiện xóa):** phát hiện khi merge nhánh
`feat/f039-043-luong-hang-hai`. BR-040-01 của F-040 quy định ngược tài liệu nền — chỉ cho xóa
hồ sơ `APPROVED`, cấm xóa `DRAFT`. Tài liệu đó tự khai trong ô *Assumptions* rằng luật được suy
ra "**theo code hiện tại**", không từ nghiệp vụ. Đã đính chính F-040 (lean-spec + feature-brief),
bổ sung `InfrastructureApprovalService.assertDeletable()` + `canDeleteApprovalRecord()`, siết
`approval-2-level-spec.md` mục 3.6 và `.agents/AGENTS.md`, thêm 4 test luật + 2 test ủy quyền.

Còn lại của hạng mục này:

- [ ] **42 feature-brief** vẫn dùng tập trạng thái legacy (`APPROVED_L1`, `APPROVED_L2`,
      `PUBLISHED`, `REJECTED`, `DELETED`). 12 brief nói ngược quy tắc sửa đã được đính chính
      bằng khối cảnh báo đầu tài liệu; 30 brief còn lại chỉ liệt kê mã legacy chứ không sai luật —
      cần viết lại theo 7 trạng thái chuẩn khi rà soát tài liệu đợt tới.
- [ ] Rà soát điều kiện **xóa** ở các màn/service KCHT còn lại cho khớp quy tắc 11 — hiện mỗi
      nơi tự kiểm trạng thái, chưa gọi `assertDeletable()`/`canDeleteApprovalRecord()`.
- [ ] Các service KCHT **chưa dùng** `InfrastructureApprovalService` (CCTV, đèn biển, phao tiêu,
      trạm phao, các đài LRIT/Hải Phòng, cơ sở sửa chữa tàu) chưa có `assertEditable()` ở backend —
      hiện chỉ được chặn ở frontend. Cắm nốt khi đưa các loại này về chuẩn 2 cấp (mục 4 ở trên).
- [ ] `services/buoy/BuoyListPage` và `services/buoy-station/BuoyStationListPage` vẫn gửi mã
      legacy (`PUBLISHED`, `APPROVED_L1`) làm `key` của tab/bộ lọc. Nhãn đã đúng và backend
      `ApprovalStatus.fromString` vẫn nhận, nhưng nên đổi sang mã chuẩn khi có dịp.
- [ ] 6 test backend đang đỏ **không liên quan** thay đổi này, cần xử lý riêng:
      `DryPortServiceTest$ApprovalTests` (3) và `PortApprovalServiceTest` (2) NullPointer do mock
      chưa được inject; `BuoyControllerTest` không load được ApplicationContext.

### 5. Dọn dẹp khác

- [ ] `/api/v1/station-history` — đã viết lại trên `infrastructure_history` nhưng **không có
      frontend nào gọi**. Xác nhận không còn client ngoài dùng thì gỡ hẳn controller + service + DTO.
- [ ] `HistoryService` của họ nhà trạm và `InfrastructureApprovalService` cùng ghi vào
      `infrastructure_history` — cân nhắc gom về một đường ghi duy nhất.
- [ ] Migration `V20260826090000` là PostgreSQL-only (dùng regex `~*`). An toàn vì Flyway chỉ
      bật ở profile `local`/`prod`, nhưng nếu sau này chạy Flyway trên H2 thì phải viết lại.
