---
id: AM-80d53aa217d1224d
kind: gotcha
topic: ai-kit-cli-broken
tags: []
importance: 0.9
agent: 
created: 2026-08-18T04:47:05.746Z
updated: 2026-08-18T04:47:05.746Z
---

ai-kit CLI không chạy được trên máy này cho user manhhv1: shim 'ai-kit' trên PATH trỏ nhầm sang C:\Users\trangtt1\.ai-kit\bin\ai-kit.mjs (không tồn tại), không có bản cài tại C:\Users\manhhv1\.ai-kit, npm global không có gói ai-kit, bun không có trên PATH bash. Hệ quả: lệnh máy-chỉ-định 'ai-kit sdlc migrate-legacy --strategy=normalize-frontmatter' (cần để mở lại module legacy-sealed như M-014) không thể chạy từ bất kỳ seat nào — chỉ còn đường chờ user sửa cài đặt hoặc làm thẳng ngoài pipeline.
