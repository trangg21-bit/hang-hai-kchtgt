---
id: AM-8852040a04f34fc3
kind: fact
topic: port-form-csv
tags: []
importance: 0.7
agent: 
created: 2026-08-20T10:09:26.433Z
updated: 2026-08-20T10:09:26.433Z
---

Form Port (modal trong services/port/PortListPage.tsx, tab general/gis/infra/files) đã khớp 100% danh sách trường CSV 'QL Cảng biển' (30 trường 1-30, không thừa không thiếu). area/maxVesselCapacity/khaNangTiepNhan/operationalStatus chỉ là code chết trong payload create/update (values.* luôn undefined, KHÔNG có Form.Item). PortUpdatePage.tsx và PortDetailPage.tsx là file legacy KHÔNG còn được route trong App.tsx (chỉ /port, /port/:id/approve, /port/:id/delete).
