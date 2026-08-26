---
id: AM-38e56211497aa537
kind: gotcha
topic: maven-build-command-win
tags: []
importance: 0.9
agent: 
created: 2026-08-22T03:58:20.407Z
updated: 2026-08-22T03:58:20.407Z
---

mvn KHÔNG có trên PATH của shell máy này. Dùng Maven bundled của IntelliJ: "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" (JDK 17 Adoptium, JAVA_HOME đã set). Lệnh verify backend: mvn compile -DskipTests từ thư mục gốc.
