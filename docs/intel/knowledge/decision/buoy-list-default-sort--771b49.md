---
id: AM-771b496672932194
kind: decision
topic: buoy-list-default-sort
tags: []
importance: 0.7
agent: 
created: 2026-08-19T08:35:25.359Z
updated: 2026-08-19T08:35:25.359Z
---

Danh sách Phao tiêu mặc định sắp xếp theo updatedAt giảm dần: BuoyRepository.searchFiltered thêm 'ORDER BY b.updatedAt DESC' + BuoyListPage default sortField='updatedAt'/sortOrder='descend' (client-side sort chạy trước khi user bấm cột khác). Triage TRI-1787128434178-bb3d (C1, 5 file — bị tripwire chặn lần đầu vì BuoyRepository ngoài scope, đã re-triage).
