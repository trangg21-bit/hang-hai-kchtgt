---
id: AM-d73695cc91135167
kind: fact
topic: dryport-detail-tabs
tags: []
importance: 0.7
agent: 
created: 2026-08-26T02:34:00.037Z
updated: 2026-08-26T02:34:00.037Z
---

DryPortDetailContent.tsx có 8 tab chi tiết, trong đó 3 tab bảng tham chiếu (Vận hành khai thác / Bảo trì / Sự cố) render qua DryPortRefTable, mirror chính xác cảng biển PortListPage.tsx PortRefTable (cột incident: incidentCode/incidentType/incidentLocation/incidentTime). Build seat không được write trực tiếp vào docs/modules/** (bị chặn — stage artifacts chỉ do specialist được dispatch viết).
