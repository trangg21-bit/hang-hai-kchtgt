---
id: AM-791b2588c4e4fa88
kind: gotcha
topic: antd-v6-inputnumber-integer
tags: []
importance: 0.9
agent: 
created: 2026-08-18T08:43:36.341Z
updated: 2026-08-18T08:43:36.341Z
---

AntD v6 (antd ^6.4.4) InputNumber: parser PHẢI trả về number (không phải string như v5) — trả string gây ~12 lỗi TS trên cùng dòng JSX. precision={0} chỉ định dạng hiển thị (display-only), KHÔNG chặn nhập thập phân — muốn chỉ nhập số nguyên phải dùng parser trả number (vd parseInteger: bỏ dấu phẩy, cắt phần thập phân, rỗng -> 0).
