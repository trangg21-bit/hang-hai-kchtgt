---
id: AM-17343480c9d7c192
kind: decision
topic: buoy-station-field-length-validation
tags: []
importance: 0.8
agent: 
created: 2026-08-22T08:23:35.780Z
updated: 2026-08-22T08:33:51.389Z
---

Form nhà trạm phao tiêu (BuoyStationFormContent.tsx + Create/UpdateBuoyStationRequest.java) — validate độ dài FINAL (2026-08-22): name 255, address 500, totalArea/usableArea 20 chữ số, staffCount 5 chữ số, note 2000. TRƯỜNG SỐ chỉ dùng maxLength chặn gõ (InputNumber antd v6 spread maxLength xuống <input>), KHÔNG có rule max/message (user bỏ message vì maxLength đã chặn). TRƯỜNG STRING giữ maxLength + rule max có message đỏ (Tối đa 255/500/2000 ký tự). Backend: @Size/@Digits(integer=20,fraction=2)/@Max(99999) với message tiếng Việt. LƯU Ý: nếu sau này thêm rule max cho InputNumber PHẢI khai type:'number' (xem gotcha AM antd-v6-rule-max-number-type).
