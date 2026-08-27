---
id: AM-d204024bcede6871
kind: gotcha
topic: buoy-station-vs-buoy-coordsystem-fieldmap
tags: []
importance: 0.7
agent: 
created: 2026-08-20T03:08:32.667Z
updated: 2026-08-20T03:08:32.667Z
---

BuoyStation (nhà trạm phao tiêu) backend dùng String coordinateSystem ('WGS84'/'VN2000') và displayFormat, KHÁC Buoy (phao tiêu) dùng Integer coordinateSystem (1/2) và displayRule. Ở form BuoyStation, field form 'displayRule' map sang backend 'displayFormat' (payload displayFormat = values.displayRule), và khi prefill phải đọc data.displayFormat (KHÔNG phải data.displayRule).
