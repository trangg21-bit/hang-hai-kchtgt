---
id: AM-f9dbe8fcbc6d46db
kind: gotcha
topic: mvn-path-intellij
tags: []
importance: 0.8
agent: 
created: 2026-08-19T07:39:14.427Z
updated: 2026-08-19T07:39:14.427Z
---

mvn KHÔNG nằm trên PATH của user manhhv1. Dùng Maven đi kèm IntelliJ: "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd". Cờ -q ẩn toàn bộ output (no output = success); để xác nhận dùng `mvn compile && echo BUILD_OK` (incremental, nhanh ~3s khi đã compile).
