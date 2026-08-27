---
id: AM-4ebe6f66b9947876
kind: decision
topic: buoy-forms-no-showcount
tags: []
importance: 0.6
agent: 
created: 2026-08-20T01:13:57.584Z
updated: 2026-08-20T01:13:57.584Z
---

User yêu cầu 2026-08-20: GỠ showCount (bộ đếm 0/255, 0/500, 0/2000...) khỏi form thêm mới/chỉnh sửa phao tiêu (BuoyFormContent.tsx, 10 chỗ) và nhà trạm phao tiêu (BuoyStationFormContent.tsx, 2 chỗ) — GIỮ NGUYÊN maxLength (vẫn giới hạn nhập). Modal Từ chối phê duyệt (BuoyListPage.tsx / BuoyStationList.tsx) vẫn giữ showCount — ngoài phạm vi. Gate: npm run build exit 0.
