# Nhật ký thay đổi dự án (JOURNAL)

## 2026-09-24 — Phao, tiêu (`/buoys`): xóa trắng trường ở tab GIS bị khôi phục về giá trị cũ

**Hiện tượng:** ở Drawer Chỉnh sửa Phao, tiêu, xóa trắng một trường đang có giá trị (đặc biệt ở tab GIS) rồi lưu thành công, kiểm tra lại thấy y như cũ.

**Nguyên nhân (chứng minh được bằng dòng code):** `BuoyListPage.tsx:1035-1038` (trong `handleEditFinish`) luôn fallback về bản ghi gốc:

```ts
const resolvedGeometryType = values.geometryType || editingRecord.geometryType;
const resolvedMapSymbolId = values.mapSymbolId || editingRecord.mapSymbolId;
const resolvedCoordinateSystem = values.coordinateSystem ?? editingRecord.coordinateSystem;
const resolvedDisplayRule = values.displayRule || editingRecord.displayRule;
```

Ý định ban đầu (ghi ở comment 1033-1034) là bảo vệ trường hợp **tab GIS chưa mount** — khi đó `values.x` rỗng KHÔNG có nghĩa là người dùng đã xóa. Nhưng cùng biểu thức đó cũng áp cho trường hợp người dùng **đã mở tab GIS và xóa trắng**, nên giá trị cũ được gửi lại ⇒ `Loại đối tượng` / `Biểu tượng bản đồ` / `Hệ quy chiếu` / `Quy tắc hiển thị` không thể xóa được.

**Khắc phục:**

- `frontend/src/services/buoy/resolveGisFields.ts` (mới): `resolveGisFieldValue(formValue, storedValue, gisTabTouched)` — phân biệt "chưa mở tab" (giữ giá trị cũ) với "đã mở tab và xóa trắng" (tôn trọng ý định xóa, gửi rỗng để server ghi `null`).
- `BuoyListPage.tsx`: thêm cờ `gisTabTouchedRef` (đặt `true` khi người dùng mở tab GIS ở `onTabChange`, reset khi mở Drawer sửa) và thay 4 dòng `resolved*` bằng `resolveGisFieldValue(...)`.
- Test thật: `frontend/src/services/buoyGisFieldResolve.test.ts` (5 case: xóa khi đã mở tab, giữ khi chưa mở tab, giá trị mới luôn thắng, bản ghi rỗng, `isClearedValue`).

**Hai ghi nhận KHÁC trên cùng màn, CỐ Ý KHÔNG sửa trong lượt này (cần quyết định riêng):**

1. `BuoyService.update()` ghi **vô điều kiện** cho ~30 trường (`entity.setDescription(request.getDescription())`…), trong khi Drawer **không render** `description`, `color`, `lightCharacteristic`, `lastRepairDate`, `lastInspectionDate` ⇒ mỗi lần lưu là các cột này bị ghi `null` (mất dữ liệu). Muốn chặn phải cho `UpdateBuoyRequest` theo cơ chế `FieldPresenceTrackedRequest` như `/port`, `/transfer-area`, `/dry-port` — vượt phạm vi một bản vá nhỏ.
2. `isActive` bị ép `true` mỗi lần lưu (payload mặc định `true`, Drawer không có field `isActive`), và `unitId`/`orgUnitId` không xóa được do input `disabled={isEdit}` + guard ở BE — đúng thiết kế bảo vệ dữ liệu đơn vị.


## 2026-09-24 — Hệ thống AIS (`/ais-system`): 7 trường bị bỏ sót khỏi hợp đồng "xóa trắng ⇒ `null` tường minh"

**Hiện tượng:** ở Drawer Chỉnh sửa Hệ thống AIS, xóa triệt để một trường đang có giá trị rồi bấm lưu thì
trường đó "không hề có gì thay đổi", không hiện lỗi. Tái hiện 100% với ô **"Đơn vị khai thác"**.

**Nguyên nhân — hợp đồng xóa-trắng đã áp cho 15/22 trường, 7 trường còn lại bị bỏ sót ở CẢ HAI đầu:**
1. **FE `AisSystemForm.tsx:714-726`** — 7 ô gửi `values.x` / `values.x?.trim()` mà KHÔNG có `?? null`
   (`code`, `name`, `operatingOrgId`, `orgUnitId`, `unitOfMeasure`, `quantity`, `conditionStatus`). Khi bị
   xóa trắng giá trị là `undefined` ⇒ **`JSON.stringify` bỏ hẳn key khỏi body** ⇒ `isFieldPresent` = false
   ⇒ server hiểu là "client không gửi trường".
2. **BE `aissystem/dto/AisSystemRequest.java`** — 7 trường đó **KHÔNG có setter `markFieldPresent(...)`**
   (chỉ 15 trường có: `vtsOperationCenterId`, `radarStationId`, `provinceId`, `detailedLocation`, `model`,
   `specifications`, `manufacturer`, `commissioningYear`, `maintenanceInfo`, `note`, `spatialId`,
   `geometryType`, `coordinates`, `symbolId`, `approvalStatus`).
3. **BE `AisSystemService.update:366`** áp trường qua `EntityUpdateUtils.copyPropertiesIfPresent(...)`, mà
   util này chỉ copy khi `newValue != null || tracked.isFieldPresent(name)`
   (`EntityUpdateUtils.java:105-107`) ⇒ với 7 trường vừa không có key vừa không được track ⇒ **bỏ qua ⇒
   giữ nguyên giá trị cũ**.
   Ô **"Đơn vị khai thác"** (`operatingOrgId`) là `<Select allowClear>` **không bắt buộc**
   (`AisSystemForm.tsx:1011-1018`) nên người dùng xóa được, và `operating_org_id` là cột **nullable**
   (`AisSystem.java:56`) ⇒ xóa là hợp lệ nhưng không bao giờ lưu được.

**Sửa (C1 — 3 file sản phẩm + journal):**
- `AisSystemForm.tsx`: thêm `?? null` cho 7 ô trong payload (dòng 714-726) — mọi ô rỗng nay đi kèm request
  dưới dạng `null` tường minh.
- `AisSystemRequest.java`: thêm setter có `markFieldPresent(...)` cho 7 trường còn thiếu.
- `AisSystemService.java` (ngay trước dòng 366): 5 cột NOT NULL (`code`, `name`, `unitOfMeasure`,
  `quantity`, `conditionStatus`) khi nhận null/blank tường minh thì ném `IllegalArgumentException` tiếng
  Việt (400). Bắt buộc phải có: sau khi presence-track, null sẽ được copy vào entity và `saveAndFlush`
  vi phạm ràng buộc ⇒ **rollback cả lượt lưu**, mọi thay đổi hợp lệ khác cũng mất.
- Chốt chống ghi đè ở FE: effect nạp dữ liệu (`AisSystemForm.tsx:407-531`) phụ thuộc `initialData` — prop
  mà `AisSystemList` thay bằng object mới tại 6 chỗ gọi `setSelectedRecord` — nên nó chạy lại, `getById()`
  rồi `setFieldsValue()` ghi đè giá trị server lên ô vừa xóa. Thêm `prefilledKeyRef` để mỗi lượt mở chỉ
  nạp đúng một lần (cùng lớp lỗi đã ghi ở mục `/ship-repair-yard`).

**Kiểm chứng:** `mvnw.cmd -Dtest=AisSystemServiceTest test` → **BUILD SUCCESS, exit 0**;
`npx tsc --noEmit` (frontend) → exit 0; `npm run build` (vite) → exit 0. Chưa UAT end-to-end trong DB
(quy ước dự án cấm tự khởi động BE).

**Còn tồn:** `AisSystemFormModal.tsx` (component form AIS thứ hai, ~46KB) chưa được rà theo cùng hợp đồng.

## 2026-09-24 — Cảng cạn (`/dry-port`): sửa "Tình trạng" mà badge không đổi + payload còn bỏ key rỗng

**Hiện tượng:** ở Drawer Chỉnh sửa Cảng cạn, xóa/đổi một trường rồi lưu thành công, nhưng kiểm tra lại thấy y như cũ.

**Nguyên nhân — 3 lỗi thật, có dẫn chứng dòng:**

1. **Form ghi `portStatus` nhưng giao diện hiển thị `operationalStatus`.** `trangThaiHoatDongBadge(status, opStatus)` (`frontend/src/pages/port/dry-port/schema.ts:113-119`) **ưu tiên `opStatus`**, chỉ khi `operationalStatus` rỗng mới xét `portStatus`. Badge được gọi với `trangThaiHoatDongBadge(record.portStatus, record.operationalStatus)` ở `DryPortListPage.tsx:1060,1064` và `DryPortDetailContent.tsx:298`; `DryPortResponse.java:25` trả `operationalStatus`. Nhưng `DryPortForm.tsx` **không hề gửi `operationalStatus`** (payload chỉ có `portStatus`) nên `DryPortService.update()` không bao giờ vào nhánh `setOperationalStatus` ⇒ cột `operational_status` giữ nguyên giá trị cũ (cột có từ `V20260803370000:4010`, và `V105.1` đã backfill `port_status` TỪ `operational_status`) ⇒ sửa "Tình trạng" xong badge vẫn y cũ.
2. **Payload còn bỏ hẳn key rỗng** — `DryPortForm.tsx:700-702` (`Object.keys(payload).forEach(key => { if (payload[key] === undefined) delete payload[key]; })`). Đúng cơ chế đã ghi nhận cho `/port`, `/berth`, `/pier` (comment `clearableText/clearableNumber/clearableUuid` trong `frontend/src/services/port/PortListPage.tsx:145-153`): `JSON.stringify` bỏ key `undefined`, server (`isFieldPresent`) không phân biệt được "đã xóa trắng" với "không gửi" ⇒ giữ giá trị cũ.
3. **`provinceId` thiếu chốt `>= 0`:** `VIETNAM_PROVINCES.indexOf(provinceName) + 1` ⇒ tên tỉnh không có trong danh sách cho ra **`provinceId = 0`** (bản `/transfer-area` đã có chốt `indexOf >= 0 ? ... : undefined`).

**Khắc phục:**

- `frontend/src/pages/port/dry-port/payload.ts` (mới): `normalizeDryPortPayload()` — chế độ SỬA gửi `null` TƯỜNG MINH cho trường nghiệp vụ rỗng; trường định danh/bắt buộc (`dryPortCode`, `dryPortName`, `orgUnitId`, `provinceId`, `portStatus`) vẫn bỏ key để không null hoá mất dữ liệu. Kèm `mapPortStatusToOperationalStatus()` (0/1/2 ⇄ NOT_YET_OPERATIONAL/OPERATIONAL/SUSPENDED).
- `DryPortForm.tsx`: dùng `normalizeDryPortPayload()`; gửi kèm `operationalStatus` suy từ `portStatus` để badge và dashboard khớp giá trị người dùng vừa sửa; thêm chốt `indexOf >= 0` cho `provinceId`.

**Đính chính test:** `frontend/src/services/dryPortClearField.test.ts` bản cũ có **case 01 là test giả** — chép lại `cleanString`/`cleanNumber`/`cleanDecimal` và cả object payload vào thân test rồi assert lên bản sao của chính nó (cùng họ ~10 file giả agent-1 đã rà ra). Đã viết lại: import trực tiếp `dry-port/payload.ts` + lớp `updateDryPort` thật.


## 2026-09-24 — Cơ sở sửa chữa, đóng tàu (`/ship-repair-yard`): effect nạp dữ liệu GHI ĐÈ lại giá trị cũ vừa bị xóa

**Hiện tượng:** ở Drawer Chỉnh sửa Cơ sở sửa chữa, đóng tàu, xóa triệt để một trường đang có giá trị rồi
bấm lưu thì trường đó "không hề có gì thay đổi", không hiện lỗi nào. Lỗi lúc tái hiện được, lúc không.

**Nguyên nhân GỐC — `ShipRepairYardForm.tsx:439-511` (effect nạp dữ liệu khi SỬA):**
effect gọi `shipRepairYardCRUD.findById(id)` rồi `form.setFieldsValue({...25 trường...})` (dòng 483-498)
nhưng **phụ thuộc `symbols`** (dòng 502: `}, [isEdit, id, symbols]);`). `symbols` (danh sách biểu tượng bản
đồ) nạp **BẤT ĐỒNG BỘ**, nên khi nó về muộn effect **chạy lại lần hai**: `findById` lần nữa và
`setFieldsValue()` **ghi đè giá trị CŨ của bản ghi lên toàn bộ form** — xóa sạch đúng những ô người dùng
vừa sửa/xóa. Payload sau đó mang chính giá trị cũ ⇒ server ghi lại y hệt ⇒ "xóa trường không thay đổi".
Vì phụ thuộc timing (độ trễ tải biểu tượng) nên không tái hiện 100%.

**Đã kiểm tra để lần sau không chẩn đoán nhầm:** hai lớp còn lại của màn này **ĐÃ ĐÚNG sẵn** —
`cleanString/cleanNumber/cleanDecimal` (dòng 638-651) trả `null` tường minh khi `isEdit`, BE đã
presence-aware qua `FieldPresenceTrackedRequest.isFieldPresent(...)`, và `isEdit = !!id` (dòng 279) đúng.
Gốc lỗi nằm ở **effect ghi đè**, không nằm ở hợp đồng payload.

**Hai lỗi cùng cụm sửa kèm:**
1. `ShipRepairYardForm.tsx:655` — `shipRepairYardName` là trường DUY NHẤT không đi qua `cleanString()`,
   luôn gửi `''` khi xóa trắng; rule (dòng 757-758) thiếu `whitespace: true` nên tên chỉ gồm khoảng trắng
   lọt qua validate. BE biến `''` → `trimToNull` → `null` vào cột **NOT NULL** `ship_repair_yard_name`
   (`ShipRepairYard.java:50`) ⇒ `saveAndFlush` vi phạm ràng buộc ⇒ **ROLLBACK cả lượt lưu** (mọi thay đổi
   hợp lệ khác trong cùng lượt cũng mất). Cùng lớp ở `port_id` (`ShipRepairYard.java:53`, NOT NULL):
   nhánh `else { entity.setPortId(null); }`.
2. `detailedLocation` cũng thiếu `whitespace: true` (cột nullable nên không rollback, nhưng giá trị chỉ
   gồm khoảng trắng bị lưu thành NULL).

**Sửa (C0 — 2 file sản phẩm + journal):**
- `ShipRepairYardForm.tsx`: thêm `prefilledIdRef` — **chỉ nạp dữ liệu bản ghi MỘT LẦN cho mỗi `id`**; các
  lần effect chạy lại (khi `symbols` về muộn) không còn `setFieldsValue()` ghi đè form. Thêm
  `whitespace: true` cho rule `shipRepairYardName` và `detailedLocation`.
- `ShipRepairYardService.java`: `shipRepairYardName` rỗng ném
  `IllegalArgumentException("Tên cơ sở sửa chữa, đóng tàu không được để trống")`; nhánh `portId` null ném
  `IllegalArgumentException("Thuộc cảng biển không được để trống")` — trả 400 tiếng Việt thay vì để CSDL
  chặn rồi rollback cả lượt lưu.

**Kiểm chứng:** `mvnw.cmd -Dtest=ShipRepairYardServiceTest test` → **BUILD SUCCESS, exit 0** (không hồi quy
luồng update); `npx tsc --noEmit` (frontend) → exit 0. Chưa chạy backend thật (quy ước dự án cấm tự khởi
động BE) nên **chưa UAT end-to-end trong DB** — cần người dùng thao tác lại trên UI để xác nhận.

**Còn tồn:** `ShipRepairYardService.create:91` chưa chặn tên rỗng (chỉ `update` sửa lần này);
`shipRepairYardCode` bất biến theo thiết kế (input `disabled`, BE không có handler). Pattern "effect prefill
phụ thuộc dữ liệu nạp async" chỉ xuất hiện ở màn này trong `frontend/src/pages` (đã grep) — các màn khác
dùng `[isEdit, id]` nên không dính.

## 2026-09-24 — Nhà trạm vận hành Phao, tiêu (`/buoy-station`): xóa hết tọa độ không được lưu

**Hiện tượng:** ở Drawer Chỉnh sửa Nhà trạm, xóa triệt để tọa độ GPS rồi lưu thì dữ liệu không đổi, nhưng
API vẫn trả về thành công.

**Nguyên nhân:**
1. **BE — `BuoyStationService.update` dòng 351:**
   `if (coordinates != null && !coordinates.trim().isEmpty()) { ...createOrUpdate... }` **không có nhánh
   `else`** ⇒ khi vị trí bị xóa trắng thì `gisSpatialObjectService.delete(...)` **không bao giờ được gọi**
   ⇒ spatial object cũ (và hình học cũ) vẫn còn nguyên. (Dòng 431-433 có `delete` nhưng nằm trong
   `softDelete`, không phải `update`.)
2. **FE — `BuoyStationFormContent.tsx` dòng 501 + 503:** `coordinates: ... : undefined` rồi
   `Object.keys(p).forEach(k => { if (p[k] === undefined) delete p[k]; })` ⇒ key `coordinates` bị **xóa hẳn
   khỏi body** ⇒ BE nhận `null` ⇒ nhánh 351 cũng bỏ qua. `latitude`/`longitude` (dòng 500) cũng bị dọn mất
   nên nhánh tổng hợp `POINT(lon lat)` ở dòng 346-348 không chạy.
3. `name` (BE dòng 272) — FE gửi `name?.trim()` (dòng 490, không có `|| undefined`) và rule antd thiếu
   `whitespace: true` ⇒ tên chỉ gồm khoảng trắng **ghi chuỗi rỗng vào CSDL** mà vẫn báo thành công.

**Sửa (C0 — 2 file):**
- `BuoyStationFormContent.tsx`: sau dòng dọn key, gán `if (manualCoords.length === 0) p.coordinates = '';`
  — gửi chuỗi rỗng **tường minh** thay vì để key bị dọn mất; rule `name` thêm `whitespace: true`.
- `BuoyStationService.java`: thêm nhánh **xóa spatial object** khi `coordinates` là chuỗi rỗng tường minh
  (`gisSpatialObjectService.delete(entity.getSpatialId())` + `entity.setSpatialId(null)`); `name` rỗng nay
  ném `IllegalArgumentException("Tên nhà trạm không được để trống")`. Dòng 345 là
  `String coordinates = request.getCoordinates();` — **giữ nguyên giá trị gốc**, không `trimToNull`, nên
  chuỗi rỗng tường minh không bị mất trước khi tới nhánh xử lý.

**Kiểm chứng:** `mvnw.cmd -q -DskipTests compile` → exit 0; `npm run build` (vite) → exit 0. **Chưa chạy
backend** (quy ước dự án) nên chưa xác nhận end-to-end trong DB.

**Còn tồn (không sửa — cần BA/SA chốt theo ma trận trường):**
- `type` (BE dòng 273) — **không có ô nhập** trong `BuoyStationFormContent` và cũng không có trong payload
  ⇒ trường này không bao giờ thay đổi được qua màn Chỉnh sửa.
- `unitId` (BE dòng 284) — FE map từ `orgUnitId`, mà ô đó `disabled={isEdit}` + `required` (dòng 557) nên
  không thể xóa từ UI; guard `!= null` giữ nguyên giá trị cũ khi thiếu.

## 2026-09-24 — Khu tránh, trú bão (`/storm-shelter`): xóa hết tọa độ không được lưu

**Hiện tượng:** ở Drawer Chỉnh sửa Khu tránh trú bão, xóa triệt để tọa độ GPS rồi lưu thì dữ liệu không
đổi, nhưng API vẫn trả về thành công.

**Nguyên nhân:**
1. **BE — `StormShelterAreaService.persistGisAndMooring` dòng 842:**
   `if (wkt != null && !wkt.trim().isEmpty()) { ...createOrUpdate... }` **không có nhánh `else`** ⇒ khi vị
   trí bị xóa trắng thì `gisSpatialObjectService.delete(...)` **không bao giờ được gọi** ⇒ spatial object
   cũ (và hình học cũ) vẫn còn nguyên. (Dòng 395 có `delete` nhưng nằm trong `softDelete`, không phải `update`.)
2. **FE — `StormShelterForm.tsx` dòng 1170 + 1177:** `coordinates: wktCoordinates || undefined` rồi
   `Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; })` ⇒ key
   `coordinates` bị **xóa hẳn khỏi body** ⇒ BE nhận `null` ⇒ nhánh 842 cũng bỏ qua.
3. `stormShelterName` (BE dòng 164) là trường BẮT BUỘC nhưng rule antd thiếu `whitespace: true`, còn FE
   gửi `vals.stormShelterName?.trim()` (không có `|| undefined`) ⇒ tên chỉ gồm khoảng trắng **ghi chuỗi
   rỗng vào CSDL** mà vẫn báo thành công.

**Sửa (C0 — 2 file):**
- `StormShelterForm.tsx`: gửi `coordinates: wktCoordinates || ''` **tường minh** (chuỗi rỗng = "đã xóa
  trắng vị trí", khác `null` = "không gửi trường"); rule `stormShelterName` thêm `whitespace: true`;
  bổ sung comment tại dòng dọn key.
- `StormShelterAreaService.java`: thêm nhánh `else if (coordinates != null)` **xóa spatial object**
  (`gisSpatialObjectService.delete` + `spatialId = null` + save). Chỉ chuỗi rỗng TƯỜNG MINH mới kích hoạt
  — `coordinates = null` giữ nguyên hành vi cũ để không xóa dữ liệu GIS của client khác. `stormShelterName`
  rỗng nay ném `IllegalArgumentException("Tên khu tránh, trú bão không được để trống")`.

**Kiểm chứng:** `mvnw.cmd -q -DskipTests compile` → exit 0; `npm run build` (vite) → exit 0. Đã đọc trực
tiếp `StormShelterAreaService.java:150` để xác nhận `coordinates = request.getCoordinates()` **giữ nguyên
bản gốc** (không `trimToNull`) nên chuỗi rỗng tường minh không bị mất trước khi tới nhánh xử lý. **Chưa
chạy backend** (quy ước dự án) nên chưa xác nhận end-to-end trong DB.

**Còn tồn:** `/port` (`PortService.java:721`) vẫn thiếu nhánh xóa spatial object — lý do **không** được sửa
máy móc như ở đây đã ghi ở mục Bến cảng (`/berth`) phía dưới.

## 2026-09-23 — Khu chuyển tải (`/transfer-area`): xóa trắng một trường khi Chỉnh sửa không được lưu

**Hiện tượng:** ở Drawer Chỉnh sửa Khu chuyển tải, xóa trắng một ô đang có giá trị rồi lưu thì bản ghi không đổi.

**Nguyên nhân — 2 lỗi thật (có nguồn dòng cụ thể, không suy đoán):**

1. **Frontend bỏ hẳn key rỗng khỏi body.** `TransferAreaForm.handleSave` chạy `Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; })`. Backend phân biệt "người dùng đã xóa trắng" với "trường không được gửi" bằng `FieldPresenceTrackedRequest.isFieldPresent(...)` — `UpdateTransferAreaRequest` chỉ đánh dấu field khi setter được gọi (kể cả `null`) và `TransferAreaService.update()` chỉ ghi `null` khi key CÓ mặt trong body. Key bị bỏ ⇒ server giữ nguyên giá trị cũ. Đúng lớp lỗi đã gặp ở `/berth` và `/port`.
2. **Backend ghi đè `orgUnitId` âm thầm.** Trong `TransferAreaService.update()`, nhánh `portId` gọi `entity.setOrgUnitId(parent.getOrgUnitId())` và chạy TRƯỚC khối `orgUnitId`; vì frontend luôn gửi `portId` mỗi lần lưu, đơn vị quản lý do người dùng gửi bị ghi đè mà không báo lỗi.

**Khắc phục:**

- `frontend/src/pages/transfer-area/transferAreaPayload.ts` (mới): `normalizeClearedFields()` — ở chế độ SỬA, trường nghiệp vụ rỗng được gửi `null` TƯỜNG MINH; trường định danh/bắt buộc (`orgUnitId`, `portId`, `transferAreaName`, `provinceId`) vẫn bỏ key để không null hoá mất dữ liệu.
- `TransferAreaForm.tsx`: thay vòng lặp `delete` bằng `normalizeClearedFields()`.
- `TransferAreaService.update()`: chuyển việc suy ra đơn vị quản lý từ cảng biển xuống SAU khối `orgUnitId`, chỉ chạy khi bản ghi chưa có đơn vị — giá trị client gửi luôn thắng.

**Đính chính test:** `frontend/src/services/transferAreaClearField.test.ts` bản cũ **không kiểm chứng gì** — nó chép lại `cleanString`/`cleanNumber`/`cleanDecimal` và cả object payload vào thân test rồi assert lên bản sao của chính nó, không import một dòng code production nào (vì vậy lỗi này lọt qua). Bản mới import trực tiếp `normalizeClearedFields` + lớp `transferAreaCRUD` thật; test thuần bổ sung tại `frontend/src/services/transferAreaPayload.test.ts` (lưu ý: `vitest.config.ts` chỉ nhận `src/pages/**/*.test.tsx`, nên test `.ts` phải đặt trong `src/services/`, `src/utils/`, `src/store/` hoặc `src/config/`).

## 2026-09-23 — Khu neo đậu (`/anchorage`): RÀ SOÁT "xóa trường không lưu" — KHÔNG tái hiện được lỗi

**Bối cảnh:** cùng báo cáo "xóa triệt để một trường rồi lưu mà dữ liệu không đổi" như `/port`, `/berth`,
`/pier`. Kết quả rà soát `/anchorage` **KHÁC BA màn kia**: đường ghi ở đây đúng.

**Đã kiểm chứng bằng đọc trực tiếp mã nguồn (không dùng grep — xem mục cuối):**
1. **Payload FE** (`AnchorageForm.tsx:1123-1157`): đủ 26/26 trường của form. Mọi trường xóa được đều
   được gửi `null` **tường minh** khi sửa qua helper `cleanString`/`cleanNumber`/`cleanDecimal` hoặc
   `|| (isEdit ? null : undefined)`.
2. **DTO** (`UpdateAnchorageRequest`): **mọi** setter gọi `markFieldPresent("...")` ⇒ Jackson nạp đúng
   `presentFields`, nên `isFieldPresent()` phản ánh đúng key có mặt trong body.
3. **Service** (`AnchorageService.update`): áp dụng strictly theo `isFieldPresent` ⇒ `null` có mặt =
   xóa, vắng mặt = giữ. Tên rỗng ném lỗi rõ ràng (dòng 178-180). `shouldClearLocation` (240-246) xóa
   `mapSymbolId`/`coordinateSystem`/`displayRule`; `persistGisAndMooring` xóa spatial object;
   `replaceMooringWaterAreas` **xóa trước** khi `if (requests.isEmpty()) return;` (919-924) nên xóa hết
   dòng "Khu nước neo buộc tàu" vẫn đúng.
4. **Tệp đính kèm**: `handleRemoveFile` (793) **có** đẩy id vào `pendingDeletedAttachmentIds`, vòng xóa
   (1177-1183) có chạy — không lỗi (khác nghi vấn ban đầu của tôi, đã đính chính).
5. `orgUnitId`/`portId` có `disabled={isEdit}` + `required` (1242-1268) ⇒ không thể xóa từ UI.

**Sửa (C0 — 1 file):** `AnchorageForm.tsx` — 3 khoá `orgUnitId`, `portId`, `anchorageName` là **những
khoá duy nhất không theo hợp đồng presence** (ghi thẳng `vals.x`), trong khi mọi khoá anh em đều có
nhánh null-on-edit. Nay đã đưa về đúng hợp đồng (`?? (isEdit ? null : undefined)` và `cleanString`).
Đây là **lỗ hổng tiềm ẩn** (hôm nay bị `disabled` che), không phải nguyên nhân triệu chứng đang báo.

**Kết luận trung thực:** trên `/anchorage` **tôi KHÔNG tái hiện được** lỗi "xóa trường mà dữ liệu không
đổi" — mọi trường hoặc xóa được, hoặc báo lỗi rõ ràng. Cần người dùng nêu **tên trường cụ thể** (hoặc
dòng request `PUT` trong tab Network) để khoanh đúng chỗ.

**⚠️ GOTCHA công cụ (ghi lại để lần sau không mắc):** grep theo từ khoá đã **bỏ sót** một match có thật
— tìm `pendingDeletedAttachmentIds` trong `AnchorageForm.tsx` trả về 4 kết quả ("Found 4 matches",
không cảnh báo cắt) nhưng **thiếu dòng 793** nơi `setPendingDeletedAttachmentIds(...)` được gọi. Tôi
đã kết luận sai "setter chưa bao giờ được gọi" và phải đính chính. **Trước khi kết luận một ký hiệu
KHÔNG tồn tại, phải đọc thẳng vùng mã, không chỉ dựa vào grep** — đặc biệt khi repo đang được nhiều
phiên sửa song song (index có thể cũ).

## 2026-09-23 — Bến phao (`/buoy-berth`): xóa trắng một trường khi "Chỉnh sửa" bị bỏ qua âm thầm

**Hiện tượng:** ở Drawer Chỉnh sửa Bến phao, xóa triệt để một ô đang có giá trị rồi bấm lưu thì dữ
liệu không đổi, nhưng API vẫn trả về "Cập nhật thành công".

**Nguyên nhân — hai lớp, cùng một hệ quả (giống `/port`, `/berth`, `/pier`):**
1. **FE — `BuoyBerthForm.tsx` (`handleSave`, khối dựng payload):** payload dựng bằng
   `values.x || undefined` / `toNumber()` / `toDateString()` nên ô bị xóa trắng thành `undefined`,
   rồi `Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; })`
   **xóa hẳn key khỏi body** ⇒ server không phân biệt được "người dùng đã xóa trắng" với "trường
   không được gửi".
2. **BE — `BuoyBerthService.update:165-166`:** `buoyBerthName` là trường BẮT BUỘC
   (`buoy_berth_name` NOT NULL) nhưng guard `!= null` xử lý tên chỉ gồm khoảng trắng một cách âm
   thầm; rule antd của `buoyBerthName` thiếu `whitespace: true` nên `'   '` lọt qua validate, rồi
   `String(values.buoyBerthName || '').trim()` gửi `''` ⇒ **ghi chuỗi rỗng vào CSDL** mà vẫn báo
   thành công.
3. `operationalStatus` (`BuoyBerthService.update:179-180`) cũng có guard `!= null`; **giữ nguyên có
   chủ đích** vì `operational_status` là cột nullable nhưng Drawer đã CHẶN xóa trắng trường này
   (rule `required` + kiểm tra trong `handleSave`), nên `null` ở đây nghĩa là "không gửi trường".

**Sửa (C1 — 2 file + journal):**
- `BuoyBerthForm.tsx`: thay `delete payload[k]` bằng `finalizePayloadForSubmit(payload)` — **mọi ô
  rỗng đi kèm request dưới dạng `null` tường minh** (key vẫn còn trong JSON), áp cho cả payload tạo
  mới lẫn chỉnh sửa (đúng chuẩn đã áp ở `/port`); rule `buoyBerthName` thêm `whitespace: true`.
- `BuoyBerthService.java`: `buoyBerthName` rỗng nay ném
  `IllegalArgumentException("Tên bến phao không được để trống")` thay vì ghi chuỗi rỗng; bổ sung
  comment giải thích guard `operationalStatus`.
- `BuoyBerthFormClearFields.test.tsx` (mới): hồi quy hợp đồng payload — trường bị xóa phải còn key
  và mang giá trị `null`.

**Kiểm chứng:** `npx vitest run src/pages/buoy-berth/BuoyBerthFormClearFields.test.tsx` → 3/3 pass,
exit 0; `mvnw.cmd -q -DskipTests compile` → exit 0; `npx tsc --noEmit` (frontend) → exit 0;
`npm run build` (vite) → exit 0. Chưa chạy backend (quy định dự án cấm tự khởi động BE) nên chưa
xác nhận end-to-end trong DB.

**Còn tồn (chưa sửa — ngoài phạm vi, cần BA/SA chốt):** `BuoyBerthListPage.tsx:895`
(`handleConfirmSubmit`) gọi `buoyBerthCRUD.update({ id, saveAction: 'SUBMIT' })` — body CHỈ có `id` +
`saveAction`, mọi trường khác là `null` ⇒ `BuoyBerthService.update:175-200` ghi `null` cho ~25 trường
(địa điểm, phân cấp, toạ độ, mọi ô số/ngày, 3 ô 2000 ký tự, `mapSymbolId`, `coordinateSystem`,
`displayRule`…). Hành động "Gửi phê duyệt" từ danh sách vì vậy **xoá trắng dữ liệu bản ghi**. Hướng
xử lý: chuyển sang gọi `POST /v1/buoy-berth/{id}/submit` (đã có sẵn ở controller) hoặc gửi full
payload. Ngoài ra `BuoyBerthService.create` vẫn chưa chặn tên rỗng (chỉ `update` được sửa lần này);
FE đã chặn bằng `whitespace: true`.

## 2026-09-23 — Cầu cảng (`/pier`): xóa hết tọa độ không được lưu (nhánh xóa GIS bị FE vô hiệu)

**Hiện tượng:** ở Drawer Chỉnh sửa Cầu cảng, xóa triệt để một trường (điển hình: xóa hết dòng trong
bảng "Tọa độ GPS") rồi lưu thì dữ liệu không đổi, nhưng API vẫn trả về thành công.

**Nguyên nhân:**
1. **FE — `PierForm.tsx` dòng 628 + 630 (nguyên nhân gốc):**
   `(payload as any).coordinates = wktCoordinates || undefined;` rồi
   `Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k]; });`
   Xóa hết tọa độ ⇒ `coordinates` thành `undefined` ⇒ **bị xóa hẳn khỏi body** ⇒ server nhận `null`.
2. **BE — `PierService.update` dòng 477:** nhánh xóa spatial object **đã có sẵn**
   (`if (request.getCoordinates() != null) { if (trim().isEmpty()) { gisSpatialObjectService.delete(...) } }`)
   nhưng **không bao giờ chạy** vì điều kiện `null != null` là false. Tệ hơn: code rơi vào nhánh
   `else if (entity.getSpatialId() != null && request.getPierName() != null)` — nhánh này **TÁI TẠO**
   spatial object từ hình học CŨ, nên tọa độ cũ vừa không bị xóa, vừa được ghi lại.
3. `pierName` (BE dòng 404) là trường bắt buộc nhưng guard `!= null` + FE gửi `vals.pierName?.trim()`
   (không có `|| undefined`) ⇒ tên chỉ gồm khoảng trắng lọt qua rule antd (thiếu `whitespace: true`)
   rồi **ghi chuỗi rỗng vào CSDL** mà vẫn báo thành công.

**Sửa (C0 — 2 file):**
- `PierForm.tsx`: `coordinates: wktCoordinates || ''` (**chuỗi rỗng tường minh** = "đã xóa trắng vị
  trí", khác `null` = "không gửi trường") để kích hoạt nhánh xóa của BE; rule `pierName` thêm
  `whitespace: true`; bổ sung comment tại dòng dọn key.
- `PierService.java`: `pierName` rỗng nay ném `IllegalArgumentException("Tên cầu cảng không được để
  trống")` thay vì ghi chuỗi rỗng; bổ sung comment cho `operationalStatus` (FE đã chặn xóa trắng) và
  `conditionStatus` (Drawer không có ô nhập nên giữ nguyên giá trị cũ).

**Kiểm chứng:** `mvnw.cmd -q -DskipTests compile` → exit 0; `npm run build` (vite) → exit 0. Đã đọc lại
`PierService.java:477-482` để xác nhận gửi `''` **thật sự** rơi vào nhánh
`gisSpatialObjectService.delete(...)` chứ không phải nhánh `else` tái tạo hình học.

**Còn tồn (chưa sửa — cần BA/SA chốt theo ma trận trường):** `conditionStatus` (Tình trạng) không có
ô nhập ở Drawer Chỉnh sửa nên không thể sửa/xóa từ UI; `designLoad` và `pierType` cũng không có ô nhập
nhưng lại được set trực tiếp trong `PierService.update` nên mỗi lần lưu bị ghi `null`.

## 2026-09-23 — Bến cảng (`/berth`): xóa trắng trường / xóa hết tọa độ không được lưu

**Hiện tượng:** ở Drawer Chỉnh sửa Bến cảng, xóa trắng một ô (hoặc xóa hết dòng tọa độ GPS) rồi lưu
thì dữ liệu không đổi, nhưng API vẫn trả về thành công.

**Nguyên nhân:**
1. **FE — `BerthForm.handleSave` dòng 552:**
   `Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });`
   Ô bị xóa trắng thành `undefined` nên **bị xóa hẳn khỏi body**; server không phân biệt được "người
   dùng đã xóa trắng" với "trường không được gửi".
2. **BE — `BerthService.update` dòng 428:**
   `if (coordinates != null && !coordinates.trim().isEmpty()) { ...createOrUpdate... }` **không có
   nhánh `else`** ⇒ xóa hết tọa độ thì spatial object cũ **không bị xóa**, tọa độ cũ vẫn còn nguyên.
   FE lại xóa mất key `coordinates` khi rỗng nên BE nhận `null` và bỏ qua toàn bộ nhánh cập nhật GIS.
3. `berthName` (BE dòng 359–360) là trường BẮT BUỘC nhưng guard `!= null` khiến tên chỉ gồm khoảng
   trắng bị bỏ qua âm thầm; rule antd thiếu `whitespace: true` nên `'   '` lọt qua validate.

**Sửa (C1 — 2 file):**
- `BerthForm.tsx`: gửi `coordinates: wktCoordinates || ''` **tường minh** (chuỗi rỗng = "đã xóa trắng
  vị trí", khác `null` = "không gửi trường"); rule `berthName` thêm `whitespace: true`; bổ sung
  comment cảnh báo ngay tại dòng dọn key để không tái diễn.
- `BerthService.java`: thêm nhánh **xóa spatial object** khi `coordinates` là chuỗi rỗng tường minh
  (`gisSpatialObjectService.delete(saved.getSpatialId())` + `spatialId = null`); `berthName` rỗng nay
  ném `IllegalArgumentException("Tên bến cảng không được để trống")` thay vì bỏ qua âm thầm.

**Kiểm chứng:** `mvnw.cmd -q -DskipTests compile` → exit 0. `npm run build` (vite) → exit 0. LSP
diagnostics `BerthForm.tsx` không có cảnh báo nào tại vùng sửa (các cảnh báo biome còn lại đều có sẵn
ở dòng khác). **Chưa chạy backend** (quy định dự án cấm tự khởi động BE) nên chưa xác nhận end-to-end
trong DB.

**CHƯA sửa — cùng khiếm khuyết còn nguyên ở Cảng biển (`PortService.java:721`):** thiếu nhánh `else`
xóa spatial object. **Không thể áp máy móc như ở `/berth`**: payload của `/port` đọc
`values.gisLocation?.coordinates`, mà `gisLocation` **không phải Form.Item** nên luôn `undefined` ⇒
mọi lần lưu `/port` sẽ gửi `null`; nếu cho `null` kích hoạt nhánh xóa thì **toàn bộ tọa độ của mọi
cảng biển sẽ bị xóa sau mỗi lần sửa**. Phải sửa FE `/port` để lấy trạng thái tọa độ từ `gpsCoordList`
(như `/berth` lấy từ `coordinateList`) rồi mới thêm nhánh xóa — cần một thay đổi riêng.

## 2026-09-23 — Cảng biển (`/port`): xóa trắng một trường khi "Chỉnh sửa" bị bỏ qua âm thầm

**Hiện tượng:** ở Drawer Chỉnh sửa Cảng biển, xóa trắng một ô đang có giá trị rồi bấm lưu thì dữ
liệu không đổi, nhưng API vẫn trả về "Cập nhật cảng biển thành công".

**Nguyên nhân — hai lớp, cùng một hệ quả:**
1. **FE** — payload của `handleUpdateFinish` dựng bằng `(values.x as string) || undefined`: ô bị xóa
   trắng biến thành `undefined`, và `JSON.stringify` **loại bỏ hẳn key** khỏi body. Server vì vậy
   không phân biệt được "người dùng xóa trắng" với "trường không được gửi".
2. **BE** — `PortService.update` có các nhánh nuốt giá trị rỗng nhưng vẫn trả về thành công:
   `portName` (`!= null && !isBlank()`) và `orgUnitId` (`!= null`) — xóa trắng bị bỏ qua, giữ giá trị
   cũ mà không có lỗi nào.
   Ngoài ra payload còn đọc 3 key **không tồn tại** trong `PortForm` (`values.area`,
   `values.khaNangTiepNhan`, `values.operationalStatus`) nên `area`/`maxVesselCapacity`/
   `operationalStatus` không bao giờ được gửi; và helper `n()` trả `0` cho chuỗi rỗng
   (`Number('') === 0`) nên xóa trắng một ô số bị ghi thành `0` thay vì rỗng.

**Sửa (C1 — 3 file):** thêm bộ helper `clearableText` / `clearableNumber` / `clearableUuid` để **mọi ô
rỗng đi kèm request dưới dạng `null` tường minh** (key vẫn còn trong JSON), áp cho cả payload tạo mới
lẫn chỉnh sửa; thay helper `n()` (bỏ nhánh trả `0`, không còn trả `NaN`); trường bắt buộc bị xóa
trắng nay **báo lỗi rõ ràng** thay vì bỏ qua âm thầm — `PortService` ném `IllegalArgumentException`
cho `portName` rỗng và `orgUnitId` null; `PortForm` thêm `whitespace: true` để chặn tên cảng chỉ gồm
khoảng trắng (antd coi `'   '` là **không** rỗng nên trước đây lọt qua validate rồi bị server bỏ qua).

**Kiểm chứng:** `mvnw.cmd -q -DskipTests compile` → exit 0. `npm run build` (vite) → exit 0.
`npx tsc -b` giữ nguyên **990 lỗi có sẵn toàn dự án** (script `build` chỉ chạy `vite build` nên
baseline này chưa bao giờ xanh); `npx eslint` trên 2 file FE chỉ báo lỗi có sẵn, không có dòng nào
nằm trong vùng sửa; LSP diagnostics cũng không báo gì tại các dòng đã sửa.

**Chưa kiểm chứng:** chưa chạy backend (quy định dự án cấm tự khởi động BE) nên chưa xác nhận
end-to-end trong DB. `operationalStatus` vẫn **không thể xóa từ UI** vì Drawer Chỉnh sửa không có ô
nhập cho trường này — cần BA/SA chốt bổ sung ô nhập theo ma trận trường TKCT.

## 2026-09-23 — P1: Lịch sử tệp đính kèm không được tái dựng từ dữ liệu hiện tại

**Hiện tượng (P1):** `VhfApprovalService.getHistory` tải danh sách tệp **hiện tại** rồi suy ngược
`previousValue`/`newValue` cho các sự kiện cũ. Kịch bản upload A → upload B → xóa A khiến dòng
lịch sử của lần upload A bị bóp méo thành `B → B` (danh sách tệp lúc đó đã khác).

**Sửa:** lịch sử đọc thẳng snapshot đã lưu tại thời điểm thao tác
(`infrastructure_history.previous_value` / `new_value`) — đúng chuẩn
`.agents/skills/kcht-change-history-audit` (Attachment Snapshot Standard). Gỡ toàn bộ nhánh suy diễn
khỏi đường đọc lịch sử, gồm cả dependency truy vấn tệp hiện tại trong `VhfApprovalService`.

**Phạm vi (footprint C1 = 4 file):**

| File | Thay đổi |
| --- | --- |
| `src/main/java/com/hanghai/kchtg/vhf/service/VhfApprovalService.java` | Bỏ 2 nhánh tái dựng + truy vấn `AttachmentRepository`; gỡ constructor trung gian trùng chữ ký; giữ nguyên chữ ký constructor `@Autowired` còn 11 tham số |
| `src/test/java/com/hanghai/kchtg/vhf/service/VhfApprovalServiceTest.java` | Thay test khẳng định hành vi tái dựng bằng 2 test khẳng định **chỉ dùng snapshot đã lưu** (upload + xóa) |
| `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | Bỏ nhánh tái dựng tương tự trong `getHistory` (hunk của phiên agent-11) |
| `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelHistoryService.java` | Bỏ nhánh tái dựng tương tự trong `toHistoryEntry` (hunk của phiên agent-11) |

**Kiểm chứng:** `mvnw.cmd -B clean test-compile` → main sources biên dịch xanh (1512 file, 0 lỗi).
Chạy 2 test class chưa thực hiện được trong lượt này: `testCompile` dừng ở file test thuộc phiên khác
(`src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceTest.java` thiếu import
`Optional`, `InfrastructureType` và hằng `TEST_ID`) nên surefire không chạy. Cần chạy lại
`mvnw.cmd -B -Dtest=VhfApprovalServiceTest,NavigationChannelServiceTest test` sau khi file đó biên dịch được.

**Hợp nhất giữa các phiên — huddle hud_f339dd8c5ffegq5RarjZNL1qx7#2:** agent-11 giữ nguyên footprint C1
nêu trên và tự stage/commit hunk của mình; hai file `navigationchannel/service/*` đang chứa hunk chưa
commit của cả agent-11, agent-13 và agent-14 nên phiên sở hữu chúng commit phần còn lại.

## 2026-09-23 — P2: Luồng hàng hải có HAI đường lịch sử, đường mới là dead code

**Hiện tượng (P2):** `NavigationChannelController` có dòng `@GetMapping("/{id}/history")` nhưng gọi
`NavigationChannelService.getHistory(...)`, còn `NavigationChannelHistoryService` — nơi chứa logic gộp
phiên cập nhật LEVEL_1/LEVEL_2 và lọc theo từ khóa/khoảng ngày — chỉ được gọi từ `getPagedHistory(...)`,
một method **không có mapping**. Toàn bộ phần gộp/lọc của service mới không ai chạy; client gọi endpoint
thật vẫn nhận DTO `HistoryEntry` rời rạc.

**Quyết định (huddle `hud_f339dd8c5ffegq5RarjZNL1qx7`, chốt hướng A):** `NavigationChannelHistoryService`
là **đường lịch sử duy nhất** của luồng hàng hải. Trước khi nối phải gỡ 3 lỗi: (1) tái dựng lịch sử tệp
đính kèm từ dữ liệu hiện tại — agent-11 đã gỡ ở cả hai service (mục P1 phía trên); (2) lọc từ khóa SAU
phân trang; (3) query thiếu điều kiện loại trừ của truy vấn chuẩn.

**Sửa:**

| File | Thay đổi |
| --- | --- |
| `navigationchannel/controller/NavigationChannelController.java` | Endpoint `/{id}/history` nối sang `historyService.getHistory(...)` (nhận/trả `NavigationChannelHistoryEntry`, `fromDate`/`toDate` là `String` đúng chữ ký service); xoá 2 method không mapping `getApprovalHistory`, `getPagedHistory` + 2 import thành thừa |
| `navigationchannel/service/NavigationChannelHistoryService.java` | `loadRows` lọc + phân trang Ở CSDL bằng `InfrastructureHistoryRepository.searchHistory(...)` (bỏ lọc keyword sau phân trang; thừa hưởng bộ loại trừ chuẩn: bỏ `CREATED`, bỏ dòng chỉ đổi trạng thái duyệt, bỏ dòng `prev = new`); giữ `normalizedKeyword` truyền xuống SQL; xoá field `historyRepo` + helper `matchesKeyword`; thêm hằng `UNPAGED_HISTORY_LIMIT = 2000` |
| `navigationchannel/repository/NavigationChannelHistoryRepository.java` | **Xoá file** — chỉ phục vụ `loadRows` cũ, đã bị `searchHistory` thay thế |
| `frontend/src/services/navigationChannelService.ts` | Type trả về của `getHistory`/`getPagedHistory` đổi sang `NavigationChannelHistoryEntry` cho khớp payload thật |

**Kiểm chứng:** `mvnw.cmd -B -Dmaven.test.skip=true compile` → main sources biên dịch xanh (test sources
bị bỏ qua vì file test của phiên khác chưa biên dịch được — xem mục P1 phía trên). Grep toàn repo còn 0
tham chiếu tới repository đã xoá / `matchesKeyword` / 2 method controller vừa xoá. Frontend:
`node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` chạy xong, `navigationChannelService.ts`
KHÔNG nằm trong danh sách lỗi (baseline typecheck của repo vốn đã đỏ sẵn ở nhiều file khác).

**Đã trả nợ (quyết định #3 — huddle hud_f339dd8c5ffegq5RarjZNL1qx7#3):** xoá 3 overload
`NavigationChannelService.getHistory` + `getApprovalHistory` + 2 helper chỉ chúng dùng (`formatUserIdentity`,
`resolveUsers`) + import `Pageable`; giữ `normalizeSearchKeyword` (còn dùng bởi `toKeywordLike` cho
`searchDocuments`) và `formatDisplayValue` (còn dùng ở bước ghi lịch sử). Test hồi quy P2 được CHUYỂN sang
đường mới: `historyService_normalizesVietnameseKeywordBeforeSearchHistory` dựng
`NavigationChannelHistoryService(...)` và verify `InfrastructureHistoryRepository.searchHistory(...)` nhận
đúng từ khóa đã bỏ dấu — không viết lại logic vì service mới đã chuẩn hóa sẵn. Lần chạy đầu của test này
ĐỎ (`PotentialStubbingProblem`: mock channel thiếu `id` nên `loadRows` gọi `searchHistory(..., null, ...)`);
sửa bằng `NavigationChannel.builder().id(channelId)` rồi chạy lại xanh. Commit `e3cd8601` (fix normalize
phía service cũ) thành dead cùng method đã xoá — giữ nguyên trong lịch sử, không revert.

**Hợp nhất giữa các phiên — huddle hud_f339dd8c5ffegq5RarjZNL1qx7#1:** endpoint
`/{id}/history` dùng `NavigationChannelHistoryService` làm đường lịch sử duy nhất — đã thực hiện ở commit
`15f25d81` + `c0850e71`. Quyết định #3 (xoá `getHistory` cũ) còn nợ, chờ agent-14 di chuyển test hồi quy
normalize sang service mới.

## 2026-09-23 — P2: Tìm kiếm lịch sử Luồng hàng hải không khớp tiếng Việt có dấu

**Hiện tượng (P2):** `NavigationChannelService.normalizeSearchKeyword` chỉ `trim()` trong khi
`InfrastructureHistoryRepository.searchHistory` so vế CSDL bằng `immutable_unaccent(LOWER(...))` — gõ
"Đèn biển", "Tọa độ" hay chữ hoa luôn ra 0 kết quả (15 điểm gọi `searchHistory` còn lại đều đã unaccent).

**Sửa:** chuẩn hóa như các màn anh em (`Normalizer.Form.NFD` strip dấu + `toLowerCase(Locale.ROOT)` +
`đ→d`; KHÔNG bọc `%` vì repository tự CONCAT), `toKeywordLike` delegate lại helper. Commit `e3cd8601`
(main + test) và `73aefe1b` (sửa compile của test).

**Kiểm chứng:** `mvnw.cmd -B -q test-compile` → main + test biên dịch xanh (exit 0) sau cả hai commit.
Biểu thức chuẩn hóa chạy riêng trên JDK 17: `"  Đèn biển Hải Phòng  "` → `"den bien hai phong"`,
`"TỌA ĐỘ"` → `"toa do"`, `"   "` → `null`. Test `getHistory_normalizesVietnameseKeywordBeforeSearchHistory`
CHƯA chạy được: runtime chặn runner Maven (`-Dtest=… test` bị scope-parser từ chối), chỉ build phase chạy được.

**Sự cố kèm theo (bài học):** test thêm ở `e3cd8601` dùng `TEST_ID`/`Optional`/`InfrastructureType` của
một lớp test CÙNG TÊN nhưng KHÁC package (`…navigationchannel.service.NavigationChannelServiceTest`), nên
`testCompile` đỏ tại HEAD (~30 phút) và chặn `mvn test` của mọi phiên — đúng lỗi mà mục P1 phía trên ghi
nhận. Nguyên nhân: grep theo `include` tên file (không kèm path) trả kết quả của file khác package. Cách
tránh: mọi kết luận "file này đang có gì" phải xác nhận theo ĐƯỜNG DẪN ĐẦY ĐỦ, không dựa vào tên file trần.

**Chuyển giao:** theo hướng A, fix `normalizeSearchKeyword` phía service cũ sẽ thành dead cùng `getHistory` —
commit `e3cd8601` giữ nguyên trong lịch sử, không revert. Việc di chuyển test hồi quy sang service mới:
**agent-13 nhận** (thay cho agent-14 nêu ở mục P2 phía trên), làm sau `73aefe1b`.
