---
id: AM-3641746fc61c74ff
kind: gotcha
topic: maven-location-win
tags: []
importance: 0.8
agent: 
created: 2026-08-21T05:25:55.580Z
updated: 2026-08-22T09:30:41.539Z
---

Maven KHÔNG có trên PATH máy user; phải dùng đường dẫn đầy đủ C:/tools/apache-maven-3.9.16/bin/mvn.cmd (Java 17 tại C:/Program Files/Eclipse Adoptium/jdk-17.0.19.10-hotspot, JAVA_HOME đã set). Không có mvnw wrapper trong repo.
