---
id: AM-5e4d1677fb1bcbb5
kind: gotcha
topic: portlistpage-external-edit
tags: []
importance: 0.75
agent: 
created: 2026-08-17T09:55:18.296Z
updated: 2026-08-17T09:55:18.296Z
---

MỘT PROCESS KHÁC (người dùng/agent song song) đã sửa title drawer lịch sử Cảng biển trong PortListPage.tsx giữa chừng (git diff working copy so HEAD cho thấy +25 dòng không thuộc phiên này): title đổi từ actionPrimary/fontSize:20/fontSizeXl sang colors.sidebarBg + drawerTitleStyle + badge navy (fontSizeLg-1, fontWeightBold, background colors.sidebarBg). Lưu ý: khi đồng bộ UI từ Cảng biển sang màn khác, PHẢI đọc lại PortListPage working copy chứ không dùng bản HEAD/cũ.
