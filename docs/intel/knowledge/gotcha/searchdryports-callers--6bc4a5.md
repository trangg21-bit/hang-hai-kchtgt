---
id: AM-6bc4a551bed4a474
kind: gotcha
topic: searchDryPorts-callers
tags: []
importance: 0.7
agent: 
created: 2026-08-17T06:44:33.630Z
updated: 2026-08-17T06:44:33.630Z
---

(scope: M-002) Khi đổi chữ ký DryPortRepository.searchDryPorts (thêm tham số Integer provinceId), nhớ có caller thứ 3: KchtGis155Service.java dòng ~509 (GIS search, case DRY_PORT) — đã sửa 2026-08-17 bằng cách truyền null (caller này không lọc theo tỉnh). Grep searchDryPorts toàn cây trước khi đổi chữ ký repository.
