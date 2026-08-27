---
id: AM-e7298acb4466f657
kind: gotcha
topic: mvn-path-manhhv1
tags: []
importance: 0.9
agent: 
created: 2026-08-19T10:23:52.041Z
updated: 2026-08-19T10:23:52.041Z
---

Máy manhhv1 KHÔNG có mvn trên PATH và không có mvnw trong repo — dùng maven cache wrapper: C:\Users\manhhv1\.m2\wrapper\dists\apache-maven-3.9.9-bin\33b4b2b4\apache-maven-3.9.9\bin\mvn.cmd (JDK 17 tại C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot, đã có trên PATH). Gate backend: '<path>\mvn.cmd -q -DskipTests compile' cwd=root; gate frontend: 'npm run build' cwd=frontend.
