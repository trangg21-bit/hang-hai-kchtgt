---
id: AM-5ceef7ae0ceb24be
kind: gotcha
topic: backend-verify-without-maven
tags: []
importance: 0.7
agent: 
created: 2026-08-18T03:52:47.046Z
updated: 2026-08-18T03:52:47.046Z
---

Backend Spring Boot không compile-verify được từ CLI trên máy này: `mvn` không trên PATH, không có Maven Wrapper (mvnw.cmd absent), jdtls báo cần JDK 21+ chưa cài. Cách verify backend khả dụng: rà soát thủ công + sửa lỗi phát hiện (vd findAllById trả Iterable phải dùng StreamSupport). Frontend verify được bằng npx tsc --noEmit + npm run build.
