---
id: AM-85142188d68182a9
kind: decision
topic: dryport-history-port-standard
tags: []
importance: 0.8
agent: 
created: 2026-08-18T04:30:50.464Z
updated: 2026-08-18T04:30:50.464Z
---

Lịch sử thay đổi Cảng cạn (frontend/src/pages/port/DryPortList.tsx) đã đồng bộ chuẩn Cảng biển 2026-08-18: Modal → Drawer size 880 + title Space + HistoryOutlined navy + badge 'Tổng cộng N' (historyGroupCount), tab Radio.Group ẩn display:none, filter Input + 2 DatePicker popupClassName history-dt-popup + nút Tìm kiếm, timeline renderDryPortHistoryTimeline dùng token history* (historyGroupGridStyle/historyInfoCardStyle/historyBadgeStyle...) + HISTORY_FIELD_ORDER theo thứ tự form cảng cạn; IIFE cũ giữ làm comment STALE_RENDER đóng bằng `*/}`. Backend DryPort đã có sẵn /v1/dry-ports/history/all + /{id}/history nên chỉ sửa FE.
