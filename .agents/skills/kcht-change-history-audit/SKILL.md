---
name: kcht-change-history-audit
description: >-
  Quy chuẩn thiết kế, lưu vết và hiển thị Lịch sử thay đổi (Audit Trail / Change Tracking) chuẩn /berth cho toàn bộ phân hệ KCHT hàng hải.
  Kích hoạt khi bổ sung, refactor tính năng lưu lịch sử thay đổi, xử lý audit log, API getHistory hoặc Drawer xem lịch sử thay đổi.
---

# KCHT Change History & Audit Trail Standard

## 1. Giới thiệu & Phạm vi áp dụng

Skill này định nghĩa quy chuẩn **kiến trúc bất biến** cho cơ chế ghi nhận (Change Tracking) và hiển thị Lịch sử thay đổi (Audit Trail) trong toàn bộ hệ thống Quản lý Kết cấu hạ tầng giao thông Hàng hải (BXD / Cục Hàng hải).

Hệ thống tuân thủ mô hình chuẩn mực từ màn hình mẫu:
- **`http://localhost:3001/berth`** (`frontend/src/pages/port/BerthListPage.tsx`)
- Phân hệ tài sản KCHT: `frontend/src/pages/assetmovement/PortTerminalAssetList.tsx`

---

## 2. Phân định ranh giới kiến trúc (Separation of Concerns)

| Tầng | Trách nhiệm bắt buộc | Điều TUYỆT ĐỐI CẤM |
|---|---|---|
| **Backend (BE)** | • Chụp snapshot & so sánh entity cũ vs mới.<br>• Lưu dữ liệu thô (FieldCode, UUID) vào bảng tập trung `infrastructure_history`.<br>• Bảo vệ tính toàn vẹn dữ liệu quy trình duyệt (chặn ghi đè `null`).<br>• API `GET .../{id}/history` trả về `changeHistory` và `approvalLog`. | ❌ KHÔNG lưu chuỗi tiếng Việt hardcode vào DB.<br>❌ KHÔNG dùng `BeanUtils.copyProperties` ghi đè trường duyệt.<br>❌ KHÔNG ghi nhận trường duyệt (`departmentApprovedAt`...) vào `changedField`.<br>❌ KHÔNG fallback query sang các bảng cũ (`change_logs`, `approval_logs`). |
| **Frontend (FE)** | • Mở Drawer lịch sử từ menu dòng (`rowActions`).<br>• Dùng `renderStandardHistoryCards` từ `changeHistoryRenderer.tsx`.<br>• Localization nhãn trường tiếng Việt qua `GLOBAL_KCHT_FIELD_LABELS`.<br>• Resolve UUID sang tên đơn vị/hạ tầng qua `orgName` Map trong `formatValue`.<br>• Hiển thị tên đơn vị quản lý ở header card qua `resolveUnitName`. | ❌ KHÔNG hiển thị chuỗi UUID trần (`00000000-...`).<br>❌ KHÔNG để lộ mã trường tiếng Anh (`parentOrgUnitId`...).<br>❌ KHÔNG bọc trường nhập liệu tùy tiện qua custom wrapper làm mất data binding dẫn đến mất mát dữ liệu và sinh lịch sử ảo. |

---

## 3. Quy chuẩn Backend (Spring Boot)

### 3.1. Chặn lỗi ghi đè dữ liệu quy trình duyệt (`copyEditableFields`)
Khi cập nhật entity, client chỉ gửi dữ liệu thuộc tính nghiệp vụ, không quản lý trường thời gian/người duyệt. Dùng `BeanUtils.copyProperties` **BẮT BUỘC** loại trừ toàn bộ trường hệ thống và phê duyệt:

```java
private void copyEditableFields(InfraAssetRequest source, InfraAsset target) {
    BeanUtils.copyProperties(source, target,
            "assetCode", "status", "approvalStatus", "remainingValue",
            "createdAt", "createdBy", "updatedAt", "updatedBy",
            "submittedBy", "submittedAt",
            "portAuthorityApprovedBy", "portAuthorityApprovedAt", "portAuthorityApprovalContent",
            "departmentApprovedBy", "departmentApprovedAt", "departmentApprovalContent",
            "approvedBy", "approvedAt", "approvedRemarks");

    // Chỉ cập nhật ngày duyệt Cục khi duyệt mới (nếu trước đó chưa có)
    if (status == ApprovalStatus.APPROVED) {
        if (target.getDepartmentApprovedAt() == null) {
            target.setDepartmentApprovedAt(Instant.now());
        }
    }
}
```

### 3.2. Loại trừ trường phê duyệt khỏi Lịch sử biến động dữ liệu (`ChangeHistoryService`)
Các trường phê duyệt thuộc về luồng quy trình duyệt (đã có `approvalLog` riêng), **tuyệt đối không ghi nhận vào `changedField` của thay đổi dữ liệu**:

```java
// Trong ChangeHistoryService.java:
private boolean isSkippedField(Field field, Object oldEntity, Object newEntity) {
    String name = field.getName();
    return name.equals(EntityFields.ID)
            || name.equals(EntityFields.CREATED_AT)
            || name.equals(EntityFields.UPDATED_AT)
            || name.equals(EntityFields.DELETED_AT)
            || name.equals("approvalStatus")
            || name.equals("submittedAt")
            || name.equals("submittedBy")
            || name.equals("portAuthorityApprovedBy")
            || name.equals("portAuthorityApprovedAt")
            || name.equals("portAuthorityApprovalContent")
            || name.equals("departmentApprovedBy")
            || name.equals("departmentApprovedAt")
            || name.equals("departmentApprovalContent")
            || name.equals("approvedBy")
            || name.equals("approvedAt");
}
```

### 3.3. API Lịch sử chuẩn duy nhất
- Truy vấn duy nhất từ bảng tập trung `infrastructure_history` theo `refId` giảm dần:
  ```java
  List<InfrastructureHistory> list = historyRepository.findByRefIdOrderByApprovedDateDesc(id);
  ```
- Tự động gom danh sách `user_id` và query `userRepository.findAllById(userIds)` để map sang họ tên hiển thị (`fullName` hoặc `username`).
- Tách rõ ràng 2 danh sách trong DTO:
  - `changeHistory`: Biến động trường dữ liệu (`changedField != null`).
  - `approvalLog`: Lịch sử phê duyệt (`changedField == null && status != null`).

---

## 4. Quy chuẩn Frontend (React / TypeScript)

### 4.1. Nhãn tiếng Việt độc lập cho từng màn hình (`fieldLabels`) — TUYỆT ĐỐI KHÔNG để chung vào Global
- `GLOBAL_KCHT_FIELD_LABELS` trong `changeHistoryRenderer.tsx` **CHỈ CHỨA các trường cơ sở dùng chung toàn hệ thống** (`code`, `name`, `status`, `address`, `province`, `attachments`...). **TUYỆT ĐỐI KHÔNG** dồn cục các trường đặc thù của từng module vào file global làm phình to (monolithic) và xung đột ngữ cảnh.
- **Mỗi màn hình BẮT BUỘC định nghĩa một từ điển `fieldLabels` độc lập** và truyền vào prop `fieldLabels` của `renderStandardHistoryCards`:

```ts
// Khai báo độc lập ngay trong file màn hình (VD: TransferAreaAssetList.tsx)
const TRANSFER_AREA_ASSET_FIELD_LABELS: Record<string, string> = {
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  transferAreaId: 'Mã khu chuyển tải',
  dikeRevetmentId: 'Mã đê/kè',
  assetType: 'Loại tài sản',
  types: 'Phân loại tài sản',
  assetCode: 'Mã tài sản',
  assetName: 'Tên tài sản',
  barcode: 'Barcode',
  assetCondition: 'Tình trạng tài sản',
  usageStatus: 'Hiện trạng sử dụng',
  originalValue: 'Nguyên giá (VNĐ)',
  // ...
};
```

### 4.2. Khử chuỗi UUID sang Tên tiếng Việt & Định dạng số (`formatValue`)
Tuyệt đối không để lộ chuỗi UUID thô (`00000000-0000...`) trong thẻ thay đổi. Khi resolve qua Map cache:
- **BẮT BUỘC kiểm tra đúng tên thuộc tính trong interface TypeScript** (VD: `TransferArea` dùng `transferAreaCode` & `transferAreaName`, `StormShelterArea` dùng `stormShelterCode` & `stormShelterName`... **TUYỆT ĐỐI KHÔNG giả định dùng `.name`** vì sẽ bị `undefined` và fallback về UUID thô).
- Định dạng hiển thị chuẩn: `${item.code} - ${item.name}`.

```tsx
renderStandardHistoryCards({
  records: filteredHistoryRecords,
  fieldLabels: TRANSFER_AREA_ASSET_FIELD_LABELS, // ✅ Truyền từ điển nhãn độc lập của màn hình
  resolveUnitName: () => {
    const targetOrgId = historyTarget?.orgUnitId || historyTarget?.parentOrgUnitId;
    return targetOrgId ? (orgName.get(targetOrgId) || '') : '';
  },
  formatValue: (fn, raw) => {
    if (isBlankOrDash(raw)) return '';
    const normKey = (fn || '').toLowerCase();

    // Map UUID đơn vị sang Tên tiếng Việt
    if (normKey.includes('orgunitid') || normKey.includes('donvi')) {
      return orgName.get(raw!) || raw;
    }

    // Map hạ tầng liên kết (khớp đúng trường model của interface)
    if (fn === 'transferAreaId') {
      const item = transferAreaMap.get(raw!);
      return item ? `${item.transferAreaCode} - ${item.transferAreaName}` : raw;
    }

    // Định dạng số tiền có phân cách hàng nghìn
    if (
      fn === 'originalValue' ||
      fn === 'remainingValue' ||
      fn === 'accumulatedDepreciation' ||
      fn === 'monthlyDepreciation' ||
      fn === 'value'
    ) {
      return formatHistoryNumber(raw);
    }
    return undefined;
  },
})
```

### 4.3. Loại trừ trường duyệt & Đếm số lần update cho badge "Tổng cộng" (Số lần update)
- **Quy chuẩn hiển thị**: Badge trên header Drawer Lịch sử thay đổi (`Tổng cộng {historyUpdateCount}`) **BẮT BUỘC ĐẾM SỐ LẦN UPDATE (số thẻ thay đổi/phiên cập nhật hiển thị trên UI)**, tuyệt đối **KHÔNG ĐẾM SỐ TRƯỜNG THAY ĐỔI / SỐ DÒNG DIFF THÔ** (`filteredHistoryRecords.length` hoặc `historyRecords.length`).
- Sử dụng hàm tiện ích chuẩn `countStandardHistoryCards` từ `changeHistoryRenderer.tsx`:
  ```tsx
  import { countStandardHistoryCards } from '../../utils/changeHistoryRenderer';

  const historyUpdateCount = useMemo(() => {
    return countStandardHistoryCards({
      records: filteredHistoryRecords,
      fieldLabels: YOUR_FEATURE_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => { /* format logic */ },
      resolveUnitName: (rec) => { /* resolve unit */ },
    });
  }, [filteredHistoryRecords, ...]);
  ```
- Hiển thị trên header Drawer:
  ```tsx
  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
    Tổng cộng {historyUpdateCount}
  </span>
  ```

---

## 5. Quy tắc Form: Chống mất Data Binding & Lịch sử thay đổi ảo

### ❌ Lỗi nghiêm trọng: Tự bọc trường chuẩn vào Custom Wrapper
```tsx
// ❌ SAI: Dùng customContent bọc <Form.Item> bên trong
{
  name: "quantityGroup",
  type: FormFieldType.Custom,
  customContent: () => (
    <div>
      <Form.Item name="quantity"><InputNumber /></Form.Item>
      <Form.Item name="quantityUnit"><Select /></Form.Item>
    </div>
  )
}
```
**Hậu quả**: `DynamicFormSidebar` không mount các trường này vào DOM -> `form.validateFields()` bỏ qua -> payload gửi `quantity = null` lên server -> DB bị xóa mất dữ liệu -> sinh ra lịch sử ảo `Số lượng: 640 -> (null)`!

### ✅ Giải pháp chuẩn: Khai báo trường phẳng độc lập
```tsx
// ✅ ĐÚNG: Khai báo trực tiếp các loại trường chuẩn của DynamicFormSidebar
{
  name: "quantity",
  label: "Số lượng",
  type: FormFieldType.Number,
  min: 0,
  formatter: fmtInputNumber,
  placeholder: "0",
  colSpan: 12,
},
{
  name: "quantityUnit",
  label: "Đơn vị tính",
  type: FormFieldType.Select,
  placeholder: "Chọn đơn vị tính",
  allowClear: true,
  options: UNITS.map((v) => ({ value: v, label: v })),
  colSpan: 12,
}
```

---

## 6. Danh sách kiểm tra nghiệm thu (Checklist)

1. [ ] **Backend Update**: `copyEditableFields` không ghi đè `null` vào ngày/người duyệt.
2. [ ] **Backend Change Tracking**: `isSkippedField` bỏ qua toàn bộ trường metadata phê duyệt.
3. [ ] **Backend Get History**: Chỉ query bảng `infrastructure_history`, resolve UUID người sửa sang họ tên.
4. [ ] **Frontend Form**: Các trường nhập liệu khai báo phẳng chuẩn (`Number`, `Select`), không dùng custom wrapper lồng `<Form.Item>`.
5. [ ] **Frontend History Drawer**: Dùng `renderStandardHistoryCards` chuẩn `/berth`.
6. [ ] **Frontend Tiếng Việt**: Mỗi màn hình định nghĩa từ điển `fieldLabels` độc lập, không nhồi nhét trường đặc thù vào `GLOBAL_KCHT_FIELD_LABELS`.
7. [ ] **Frontend UUID Resolution**: Khớp đúng trường code/name trong interface TypeScript (`transferAreaName`, `stormShelterName`...) để resolve sang tên tiếng Việt trong `formatValue`.
8. [ ] **Frontend Unit Header**: Có hiển thị tên đơn vị quản lý qua `resolveUnitName`.
9. [ ] **Badge Count**: Số lượng "Tổng cộng" trên header Drawer đếm chính xác số lần update (số thẻ hiển thị thực tế qua `countStandardHistoryCards`), không đếm số trường raw.
