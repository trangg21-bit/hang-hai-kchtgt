---
id: AM-53ed8588c8de8e7d
kind: decision
topic: buoy-station-port-approval-filter
tags: []
importance: 0.7
agent: 
created: 2026-08-22T09:24:01.648Z
updated: 2026-08-22T09:24:01.648Z
---

2026-08-22: BuoyStationFormContent.tsx loadPortOptions đã thêm approvalStatus:'APPROVED' khi load danh sách cảng biển theo Đơn vị quản lý (đồng bộ BerthForm.tsx) — chỉ hiển thị cảng đã phê duyệt + toast.warning 'Đơn vị quản lý chưa có cảng biển được phê duyệt' khi rỗng. Backend /v1/ports đã hỗ trợ param approvalStatus từ trước (PortService.findAll dùng ApprovalStatus.fromString).
