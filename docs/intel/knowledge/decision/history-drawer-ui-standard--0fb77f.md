---
id: AM-0fb77f300ad48fad
kind: decision
topic: history-drawer-ui-standard
tags: []
importance: 0.8
agent: 
created: 2026-08-20T08:23:53.120Z
updated: 2026-08-20T08:23:53.120Z
---

Chuẩn màn Lịch sử thay đổi (tham chiếu = BuoyListPage, áp dụng Berth/Pier/DryPort/VtsSystem/BuoyStation): Radio.Group chọn mode bị bọc <div style={{display:'none'}}> (ẩn, all-mode chỉ còn là code chết); DatePicker 'Từ/Đến ngày' phải có popupClassName='history-dt-popup' + <style> nhuộm .ant-picker-now-btn = actionPrimary; accent bar card luôn actionPrimary (KHÔNG theo isCreate); time/meta rows/info title dùng Typography.Text thay vì span trần; giá trị mapSymbolId render icon 18px + tên qua renderCell. BuoyStationList đã được sửa khớp chuẩn này (2026-08-20).
