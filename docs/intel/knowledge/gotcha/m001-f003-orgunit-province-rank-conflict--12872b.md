---
id: AM-12872b24e65179c1
kind: gotcha
topic: m001-f003-orgunit-province-rank-conflict
tags: []
importance: 0.9
agent: 
created: 2026-08-17T03:34:47.285Z
updated: 2026-08-17T05:20:08.276Z
---

M-001/F-003 (Quản lý đơn vị org-units): 2 luồng công việc đụng nhau trên cùng files (UnitList.tsx, UnitForm.tsx, OrgUnit.java, OrganizationService.java): TRI-1786936397148-3956 (rank 'Cấp đơn vị' + đợt correction đổi enum sang English DEPARTMENT/BRANCH/REPRESENTATIVE — phiên tab khác đang chạy, claim M-001 alive) và TRI-1786937364109-3e37 (chuẩn hóa Tỉnh/TP thành dropdown 63 tỉnh + province_id INT — đang queue, user đã chọn chờ). Khi triển khai province: KHÔNG dùng V110 (đã bị V110__create_dashboard_snapshot.sql chiếm), migration mới phải timestamp > V20260817100000 (rank). Pattern chuẩn: VtsSystemForm.tsx VIETNAM_PROVINCES + getProvinceIdByName; giữ address= tên tỉnh fallback + thêm province_id INT.
