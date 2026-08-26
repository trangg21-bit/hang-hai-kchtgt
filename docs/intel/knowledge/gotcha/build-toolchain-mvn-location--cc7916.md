---
id: AM-cc7916d2b8f428b5
kind: gotcha
topic: build-toolchain-mvn-location
tags: []
importance: 0.9
agent: 
created: 2026-08-25T10:09:41.145Z
updated: 2026-08-25T10:09:41.145Z
---

mvn KHÔNG có trên PATH trong shell non-interactive. Dùng Maven bundled của IntelliJ: set JAVA_HOME=C:\Users\manhhv1\.jdks\ms-17.0.19 && "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean compile. JDK 17 sẵn sàng; không có mvnw trong repo.
