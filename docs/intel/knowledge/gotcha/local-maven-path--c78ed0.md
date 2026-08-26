---
id: AM-c78ed04bb312d1eb
kind: gotcha
topic: local-maven-path
tags: []
importance: 0.8
agent: 
created: 2026-08-21T06:16:24.657Z
updated: 2026-08-21T06:16:24.657Z
---

mvn KHÔNG có trên PATH máy local. Maven khả dụng qua IntelliJ bundled: C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd (3.9.x, khớp image CI maven:3.9-eclipse-temurin-17). JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot.
