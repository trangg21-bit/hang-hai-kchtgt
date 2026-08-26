---
id: AM-575b66071bfdd3f4
kind: gotcha
topic: mvn-command-path
tags: []
importance: 0.9
agent: 
created: 2026-08-18T08:09:45.340Z
updated: 2026-08-18T08:09:45.340Z
---

Máy manhhv1 KHÔNG có mvn trên PATH (chỉ JDK 17 Adoptium). Maven chạy được qua IntelliJ bundled: "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" -q -DskipTests compile (đã verify exit 0 2026-08-18). Không có mvnw wrapper (thư mục .mvn/wrapper rỗng).
