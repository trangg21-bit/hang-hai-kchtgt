---
id: AM-63e12bff14a65a8f
kind: gotcha
topic: backend-build-mvn-missing
tags: []
importance: 0.7
agent: 
created: 2026-08-18T06:17:18.975Z
updated: 2026-08-18T06:17:18.975Z
---

mvn không có trên PATH và project bxd.hh.kcht không có mvnw wrapper (chỉ có .mvn/ + pom.xml) — không thể chạy 'mvn clean compile' từ shell trên máy này; backend verify chỉ bằng review thủ công hoặc build qua IDE/docker
