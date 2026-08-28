---
id: AM-4965cdd7e11a85be
kind: gotcha
topic: province-id-mapping-bug
tags: []
importance: 0.8
agent: 
created: 2026-08-19T07:56:04.599Z
updated: 2026-08-19T07:56:04.599Z
---

BUG ánh xạ tỉnh đã sửa (BuoyListPage): form lưu provinceId = MÃ TCTK (77=BRVT theo VIETNAM_PROVINCE_IDS, chuẩn bảng provinces migration V108) nhưng cột danh sách render VIETNAM_PROVINCES[provinceId-1] (coi là index) → mọi mã >63 hiển thị '—'; bộ lọc tỉnh gửi indexOf+1 thay vì mã → lọc không ra. Fix: map qua VIETNAM_PROVINCE_OPTIONS (value=mã) cho cột + filter. CẢNH BÁO: BerthList/BerthForm có thể cùng bug (render VIETNAM_PROVINCES[v-1]) — chưa xác minh form berth gửi mã hay index.
