---
id: AM-194f1adcc6d1325a
kind: decision
topic: pier-history-parity-done
tags: []
importance: 0.7
agent: 
created: 2026-08-18T03:15:06.079Z
updated: 2026-08-18T03:42:11.189Z
---

Pier history display fixes (2026-08-18, tiếp): histVal đã map pierType (CONTAINER/TONG_HOP/HANH_KHACH/CHUYEN_DUNG_XANG_DAU/CHUYEN_DUNG_ROI_QUANG/KHAC theo options PierForm) + receivesLargeVessel true/false→Có/Không; format ngày cắt nano giây (LocalDateTime Java '2026-08-19T00:00:00.000000' → dayjs Invalid Date → replace /\\.\d+$/ trước khi parse); format số nguyên dùng n.toLocaleString('vi-VN') (99999 → 99.999). Ngoài ra: PierService.update setMapSymbolId đã thêm guard null (chống bản ghi 'Chia cắt → —' giả khi save không đổi); PierList lọc bản ghi history fieldName==='CREATE' (rác cũ từ insertChangeRecord cũ). Lưu ý: BerthList.tsx CÙNG pattern format ngày/số — chưa fix đồng bộ (ngoài footprint).
