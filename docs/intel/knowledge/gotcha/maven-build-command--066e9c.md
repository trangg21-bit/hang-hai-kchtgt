---
id: AM-066e9cff25fe01c5
kind: gotcha
topic: maven-build-command
tags: []
importance: 0.9
agent: 
created: 2026-08-25T10:39:26.886Z
updated: 2026-08-25T10:39:26.886Z
---

mvn không có trên PATH máy manhhv1 (cmd.exe). Dùng Maven kèm IntelliJ: "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean compile -q. JAVA_HOME đã trỏ JDK 17 (Eclipse Adoptium). Không có mvnw trong project.
