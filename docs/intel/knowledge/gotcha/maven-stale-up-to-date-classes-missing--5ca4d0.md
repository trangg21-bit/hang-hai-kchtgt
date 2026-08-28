---
id: AM-5ca4d039379246b6
kind: gotcha
topic: maven-stale-up-to-date-classes-missing
tags: []
importance: 0.9
agent: 
created: 2026-08-21T07:46:25.990Z
updated: 2026-08-21T07:46:25.990Z
---

Khi Maven báo 'Nothing to compile - all classes are up to date' mà vẫn thấy lỗi 'cannot find symbol' ở IDE: target/classes đã bị xóa tay nhưng target/maven-status còn state cũ → Maven skip compile nhưng class thực tế thiếu. Fix: mvn clean compile (xóa target hoàn toàn rồi recompile). Lưu ý: glob tool KHÔNG thấy file trong target/ vì .gitignore — phải dùng list để kiểm tra target.
