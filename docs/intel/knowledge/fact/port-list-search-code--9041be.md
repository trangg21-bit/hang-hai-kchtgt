---
id: AM-9041be08641e5568
kind: fact
topic: port-list-search-code
tags: []
importance: 0.7
agent: 
created: 2026-08-20T10:07:01.020Z
updated: 2026-08-20T10:07:01.020Z
---

Port (Cảng biển) list: cột 'Mã cảng biển' bị ẩn cố ý (PortListPage.tsx, comment 'Ẩn cột mã cảng theo yêu cầu'); ô tìm kiếm 'Tìm theo tên cảng' gửi param search mà backend PortRepository.searchPorts match CẢ portCode lẫn portName (OR LIKE) — không có ô lọc mã riêng trên UI nhưng chức năng tìm theo mã vẫn hoạt động.
