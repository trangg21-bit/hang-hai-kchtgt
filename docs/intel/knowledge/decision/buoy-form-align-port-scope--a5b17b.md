---
id: AM-a5b17bb4edbcb90c
kind: decision
topic: buoy-form-align-port-scope
tags: []
importance: 0.8
agent: 
created: 2026-08-18T06:15:05.986Z
updated: 2026-08-18T06:15:05.986Z
---

Đồng bộ form Phao tiêu (M-013/F-075) theo Cảng biển được user chốt ở phạm vi: FRONTEND + sinh mã tự động — thêm endpoint GET /api/buoys/generate-code (format PT-XXXXXX, mirror PortService.generatePortCode, unique check cả buoyRepo lẫn beaconLightRepo vì code chia sẻ namespace), upload 20MB + tiff/tif, cảnh báo trùng mã/tên khi lưu (searchBuoys, không chặn). KHÔNG đổi Switch isActive → Select operationalStatus, KHÔNG thêm tab Công trình KCHT, KHÔNG bỏ typeLocked (BR-075-02), giữ GPS POINT. Triage: TRI-1787033683922-c54e.json.
