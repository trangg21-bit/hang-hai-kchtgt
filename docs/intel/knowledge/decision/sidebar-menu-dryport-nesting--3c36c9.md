---
id: AM-3c36c99c9cce47f2
kind: decision
topic: sidebar-menu-dryport-nesting
tags: []
importance: 0.7
agent: 
created: 2026-08-26T03:52:35.852Z
updated: 2026-08-26T05:53:11.528Z
---

Menu sidebar (2026-08-26, QUYẾT ĐỊNH CUỐI sau 2 lần đổi): Quản lý cảng cạn (/dry-port) nằm CÙNG CẤP với Quản lý cảng biển (port-parent) — đều là con trực tiếp của nhóm 'Quản lý KCHT Hàng Hải' (cangben), cạnh Quản lý vùng nước (/water-zone). KHÔNG nằm trong children port-parent. AppLayout.tsx: item /dry-port đứng sau block port-parent; openKeys ở /dry-port và /water-zone → ['cangben']; điều kiện hiển thị port-parent chỉ xét /port|/berth|/pier (không gồm dry-port).
