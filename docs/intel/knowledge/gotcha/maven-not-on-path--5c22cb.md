---
id: AM-5c22cbd0c4b58984
kind: gotcha
topic: maven-not-on-path
tags: []
importance: 0.8
agent: 
created: 2026-08-22T08:23:36.379Z
updated: 2026-08-22T08:23:36.379Z
---

Maven KHÔNG có trong PATH của bash tool (win32/cmd) ở workspace này: cả PATH hệ thống lẫn HKCU\Environment đều không chứa mvn; các vị trí chuẩn (C:\Program Files\Apache\maven, chocolatey, scoop) đều không tồn tại — `mvn compile` không chạy được trong session AI, chỉ có JDK 17 (Eclipse Adoptium) + node. Verify backend bắt buộc nhờ user chạy terminal hoặc tìm maven bundled trong IntelliJ.
