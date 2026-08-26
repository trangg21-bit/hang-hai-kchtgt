---
id: AM-d04403ff177e8062
kind: gotcha
topic: maven-not-on-path-use-intellij-bundled
tags: []
importance: 0.8
agent: 
created: 2026-08-20T05:26:28.120Z
updated: 2026-08-20T05:26:28.120Z
---

Máy này KHÔNG có mvn trên PATH và không có Maven wrapper (mvnw) trong repo. Maven khả dụng duy nhất là bản đi kèm IntelliJ: C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd (JDK 17 Temurin tại JAVA_HOME). Build backend dùng lệnh: "...\mvn.cmd" -q clean compile.
