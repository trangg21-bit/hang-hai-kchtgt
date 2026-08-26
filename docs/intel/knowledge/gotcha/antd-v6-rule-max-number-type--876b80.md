---
id: AM-876b80f396ae7f81
kind: gotcha
topic: antd-v6-rule-max-number-type
tags: []
importance: 0.9
agent: 
created: 2026-08-22T08:33:03.572Z
updated: 2026-08-22T08:33:03.572Z
---

GOTCHA antd v6 (@rc-component/async-validator 6.0.0): rule Form `{ max: X }` KHÔNG có `type` sẽ mặc định type 'string' (getType trả rule.type || 'string') → với InputNumber (value là number) luôn FAIL type-check → form hiện message của rule dù giá trị nhỏ (vd nhập 2 vẫn báo 'Tối đa 20 chữ số'). BẮT BUỘC khai `type: 'number'` trong rule max/min cho trường InputNumber. Đã xác minh bằng node test trên validator thật: không type → 2/20 FAIL; type:'number' → 2/20 PASS, 21 chữ số FAIL đúng.
