---
id: AM-e0013e3b85006d1b
kind: gotcha
topic: maven-intellij-bundled-path
tags: []
importance: 0.8
agent: 
created: 2026-08-18T02:52:56.585Z
updated: 2026-08-18T02:52:56.585Z
---

Maven không có trong PATH và mvnw bị thiếu, nhưng Maven bundled IntelliJ IDEA 2026.1.4 tồn tại: "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" — dùng đường dẫn này để compile backend thay vì `mvn`.
