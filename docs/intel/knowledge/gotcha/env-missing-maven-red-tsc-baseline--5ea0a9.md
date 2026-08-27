---
id: AM-5ea0a9d95c149a31
kind: gotcha
topic: env-missing-maven-red-tsc-baseline
tags: []
importance: 0.75
agent: 
created: 2026-08-22T05:31:16.746Z
updated: 2026-08-22T05:31:16.746Z
---

GOTCHA (môi trường máy user): Maven KHÔNG được cài trên máy này (không có mvn trên PATH, không MAVEN_HOME/M2_HOME, không mvnw wrapper, không ~/.m2) — không thể chạy mvn clean compile từ CLI; verify backend bằng đọc code hoặc nhờ user chạy. Ngoài ra: npx tsc --noEmit -p tsconfig.app.json (frontend/) baseline ĐANG ĐỎ sẵn ~60 file (App.tsx PierForm routes thiếu props, src/app/document GiayTo, WaterZoneListPage, BerthListPage 34 lỗi, PierListPage 31 lỗi...) — lỗi pre-existing, không liên quan change. Dispatch task subagent verify/BA cho brief gắn M-NNN bị engine từ chối (phải dùng pmo-software-project-manager).
