---
id: AM-89c1de20260914a
kind: decision
topic: vts-condition-3state-standard
tags: [vts, condition-status, kcht-standard, sdlc]
importance: 0.8
agent: 
created: 2026-09-14T13:12:00.000Z
updated: 2026-09-14T13:12:00.000Z
---

2026-09-14: Chuẩn hóa trường Tình trạng (conditionStatus) của Hệ thống VTS (M-003: F-062, F-063, F-066, F-067) từ 4 trạng thái cũ ('Đang hoạt động'/'Dừng hoạt động'/'Đang bảo trì'/'Đang xây dựng') sang bộ 3 trạng thái chuẩn dùng chung của phân hệ KCHT (TINH_TRANG):
- NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành' (vàng/cam)
- OPERATIONAL: 'Đang khai thác/vận hành' (xanh lá) - Giá trị mặc định khi tạo mới
- SUSPENDED: 'Dừng khai thác/vận hành' (đỏ)

Phạm vi thực hiện:
1. Frontend types (`vtsSystem.ts`): Bổ sung NOT_YET_OPERATIONAL, SUSPENDED vào enum ConditionStatus; cập nhật CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP, CONDITION_STATUS_TAG_MAP.
2. Theme Tokens (`themetokenchk.ts`): Cập nhật getConditionStatusLabel & getConditionStatusColor ưu tiên chuẩn 3 trạng thái.
3. Màn hình VTS (`VtsSystemList.tsx`, `VtsSystemForm.tsx`, `VtsSystemDetailContent.tsx`):
   - Table columns, form dropdowns, filters dùng 3 trạng thái chuẩn.
   - Màn hình Lịch sử (CommonHistoryDrawer): truyền formatValue ánh xạ chính xác conditionStatus / tinhtrang sang nhãn 3 trạng thái tiếng Việt.
4. Backend:
   - `ConditionStatus.java`: Thêm NOT_YET_OPERATIONAL, SUSPENDED; bổ sung @JsonCreator và @JsonValue để deserialize linh hoạt cả tên enum lẫn mã tiếng Việt.
   - `VtsSystemService.java`: Cập nhật hàm format history audit log hiển thị 3 trạng thái.
   - `KchtGis155Service.java`: Cập nhật switch expression hỗ trợ đầy đủ các giá trị ConditionStatus.
5. Tài liệu SDLC: Cập nhật F-062 (Tạo mới), F-063 (Cập nhật), F-066 (Chi tiết), F-067 (Lịch sử) đồng bộ chuẩn 3 trạng thái.
