---
id: AM-2dd6bb9fd54c9bb5
kind: gotcha
topic: drawer-width-640-buoy
tags: []
importance: 0.8
agent: 
created: 2026-08-18T07:08:23.526Z
updated: 2026-08-18T07:08:23.526Z
---

Nguyên nhân form Phao tiêu trông khác Bến cảng: drawer tạo/sửa phao tiêu ghi đè size={640} trong khi drawerProps chuẩn (tokens.ts dòng 326) là size 1000 — Bến cảng dùng chuẩn 1000. Đã bỏ override ở 2 drawer form (giữ 800/880 cho drawer chi tiết/lịch sử) và thêm tabBarStyle sticky (position sticky, background surfaceCard) cho khớp BerthForm. Khi làm form KCHT mới: dùng drawerProps chuẩn, đừng ghi đè size dưới 1000.
