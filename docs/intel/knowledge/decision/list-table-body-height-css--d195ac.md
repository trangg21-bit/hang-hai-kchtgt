---
id: AM-d195acdfb0adc1ff
kind: decision
topic: list-table-body-height-css
tags: []
importance: 0.8
agent: 
created: 2026-08-14T04:11:13.764Z
updated: 2026-08-14T07:37:33.655Z
---

DataTable.tsx (list-view) fitMode (CẬP NHẬT 2026-08-14 chiều): cơ chế co sát nội dung thay vì luôn lấp đầy. Guard: canMeasureHeight = isNumericScrollY || scroll.y == null — chỉ đo khi y là số hoặc trang không truyền y (fallback theme); trang tự truyền y chuỗi (vd calc(100vh - 450px)) giữ nguyên. Empty state (dataSource.length===0) → setFitMode('content') trực tiếp. Nội dung ngắn hơn availH → 'content' (y=undefined, shell flex 0 0 auto, class list-view-table-shell fit-content); cao hơn → fill (y=availH−header). tableScroll.y = fitMode==='content' ? undefined : fitMode ?? requestedScrollY. index.css thêm override .list-view-table-shell.fit-content .ant-table-placeholder > td { height:auto !important } để ô empty state không bị ép cao var(--list-table-scroll-y)=calc(100vh-350px). PortListPage/BerthList/PierList truyền y số (550/550/500) + parent flex (.filter-table-spin .ant-spin-container) nên được đo; PermissionsPage/LogsPage (parent block) không đo → giữ nguyên. Verify: npm run build (vite) pass. LƯU Ý LỊCH SỬ: user yêu cầu 'ít nội dung thì mép dưới bảng co lại' nhưng buổi sáng 2026-08-14 từng sửa SAI bỏ nhánh 'content' → luôn lấp đầy (thân bảng luôn kéo sát đáy); KHÔNG lặp lại.
