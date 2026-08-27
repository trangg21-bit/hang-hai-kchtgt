---
id: AM-682283057f863d13
kind: decision
topic: buoy-station-form-standard
tags: []
importance: 0.8
agent: 
created: 2026-08-18T07:24:37.526Z
updated: 2026-08-18T07:24:37.526Z
---

Form thêm/sửa nhà trạm phao tiêu (BuoyStationFormContent) đã chuẩn hóa theo BerthForm: 4 tab, 2 cột span=12, orgUnit→port động, mã tự sinh qua endpoint mới GET /v1/buoy-station/generate-code?portId= (backend: BuoyStationService.generateCode, prefix {portCode}-NTPT + 2 số, dùng PortRepository + findByPortIdAndDeletedAtIsNull), submit qua ref (createFormRef.submit('DRAFT'|'SUBMIT'|'APPROVED'), edit submit('UPDATE')), bảng GPS DMS + bảng file. API generateBuoyStationCode trong frontend/src/services/station/beacon/api.ts
