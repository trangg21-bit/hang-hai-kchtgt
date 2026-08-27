---
id: AM-e5d881d1721eb0d5
kind: gotcha
topic: maven-not-on-path-idea-bundled
tags: []
importance: 0.8
agent: 
created: 2026-08-20T08:51:42.433Z
updated: 2026-08-20T08:51:42.433Z
---

GOTCHA BUILD: mvn KHÔNG có trên PATH máy user (where mvn.cmd trống). Maven dùng được là bản đi kèm IntelliJ: 'C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd' (Java 17 Temurin có sẵn). Cách verify backend: mvn clean compile -q bằng đường dẫn đó; kết quả OK khi target/classes đầy đủ (lưu ý glob '**' có thể không khớp trên tool — dùng list thay).
