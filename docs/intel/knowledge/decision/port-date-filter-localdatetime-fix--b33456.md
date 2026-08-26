---
id: AM-b3345654af6caa14
kind: decision
topic: port-date-filter-localdatetime-fix
tags: []
importance: 0.8
agent: 
created: 2026-08-14T09:31:10.291Z
updated: 2026-08-14T09:31:10.291Z
---

Filter ngày (Từ ngày - Đến ngày) của Cảng biển (PortListPage) đã SỬA 2026-08-14: PortRepository.searchPorts so sánh LocalDateTime updatedAt với tham số String 'YYYY-MM-DD HH:mm' (dấu cách, không ISO) → Hibernate6/Postgres lỗi khi lọc. Fix theo pattern Berth: PortService.findAll parse LocalDateTime.parse(x.replace(' ','T')) + PortRepository đổi @Param sang java.time.LocalDateTime + CAST AS java.time.LocalDateTime. Caller KchtGis155Service truyền null/null (không vỡ), PortServiceTest dùng isNull() (không vỡ). Pier và DryPort vẫn CHƯA có filter ngày. Lỗi phụ: updatedTo chỉ tới phút + showTime mặc định 00:00 → chọn 1 ngày gần như rỗng (chưa sửa).
