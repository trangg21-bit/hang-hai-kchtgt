---
id: AM-74153a04bdaa09d1
kind: fact
topic: maven-location-manhhv1
tags: []
importance: 0.7
agent: 
created: 2026-08-20T02:07:31.826Z
updated: 2026-08-20T02:07:31.826Z
---

Maven KHÔNG có trên PATH của shell máy manhhv1 (mvn không nhận diện, không có mvnw wrapper). Bản cài duy nhất: C:\tools\apache-maven-3.9.16\bin\mvn.cmd — phải gọi full path khi compile backend từ shell. Người dùng chạy BE qua IntelliJ (compile riêng của IDE).
