---
id: AM-c9087d0483ad19e2
kind: decision
topic: port-form-location-and-limits
tags: []
importance: 0.8
agent: 
created: 2026-08-22T09:07:12.426Z
updated: 2026-08-22T09:15:03.794Z
---

QUY ƯỚC ô số (chốt bởi user 2026-08-22): '0/5' với InputNumber = 5 KÝ TỰ gõ được (55555), KHÔNG phải max giá trị — mọi form (buoy, nhà trạm, cảng biển PortListPage) dùng maxLength ký tự (cảng biển: 10 ô số lượng maxLength=5, 3 ô chiều dài maxLength=20), KHÔNG dùng max giá trị. PortListPage: hook useAtMax(form,name,max) mặc định đếm ký tự; form cảng biển thật nằm trong PortListPage (create ~2116 + update ~2838, indent khác 4 spaces) — PortFormContent/PortCreatePage/PortUpdatePage là ORPHAN.
