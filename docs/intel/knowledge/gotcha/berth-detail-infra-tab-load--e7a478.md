---
id: AM-e7a4783d26c74724
kind: gotcha
topic: berth-detail-infra-tab-load
tags: []
importance: 0.8
agent: 
created: 2026-08-21T06:53:46.049Z
updated: 2026-08-21T06:53:46.049Z
---

Tab 'Danh sách kết cấu hạ tầng khác thuộc bến cảng' (BerthDetailContent.tsx) load dữ liệu động giống mẫu Cảng biển: pierCRUD.search({berthId, pageSize:50}) → dòng {id, infraName: pierName||pierCode, infraType:'Pier'}; BerthResponse backend KHÔNG có infrastructureList (chỉ Port có) nên prop infrastructureList luôn rỗng — không được dựa vào prop. Nút mắt/tên → drawer lồng PierDetailContent (findById + documentApi.listByEntity('pier', id)). waterwayMap/organizations là prop optional (PortListPage drawer lồng không truyền).
