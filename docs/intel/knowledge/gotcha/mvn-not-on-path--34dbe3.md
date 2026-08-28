---
id: AM-34dbe343ed26d0fc
kind: gotcha
topic: mvn-not-on-path
tags: []
importance: 0.85
agent: 
created: 2026-08-17T06:32:32.250Z
updated: 2026-08-21T03:06:15.669Z
---

Máy manhhv1 KHÔNG có mvn trên PATH, không có mvnw wrapper (thư mục .mvn/wrapper rỗng), không tìm thấy ở Program Files\Apache\maven, chocolatey, scoop. Để biên dịch backend phải có đường dẫn Maven thật (vd IntelliJ bundled: plugins\maven\lib\maven3\bin\mvn.cmd). JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot. Lệnh verify: mvn clean compile -q -DskipTests. Lưu ý: project có lỗi compile CÓ SẴN ở package assetmovement (xem compile-verification-result.md).
