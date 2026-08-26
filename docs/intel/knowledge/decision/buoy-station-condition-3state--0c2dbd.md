---
id: AM-0c2dbd17e896404a
kind: decision
topic: buoy-station-condition-3state
tags: []
importance: 0.7
agent: 
created: 2026-08-20T01:17:03.380Z
updated: 2026-08-20T01:17:03.380Z
---

2026-08-20: Form thêm/sửa NHÀ TRẠM phao tiêu đổi Tình trạng từ Select isActive 2 giá trị (Hoạt động/Ngừng) → Select condition 3 giá trị 'Chưa khai thác/vận hành'/'Đang khai thác/vận hành'/'Dừng khai thác/vận hành' (dùng CONDITION_OPTIONS từ ../buoy/schema, đã import sẵn). Chỉ sửa BuoyStationFormContent L309 (name isActive→condition); dòng submit L243 ĐÃ map sẵn condition + isActive = (condition==='Đang khai thác/vận hành'). Backend KHÔNG cần đổi: entity/DTO/service đã map condition+isActive từ trước, column condition có sẵn từ migration V20260819180000. List+Detail đã hiển thị condition 3 trạng thái. LƯU Ý: bản ghi cũ condition=NULL (form cũ không gửi) → list hiển thị '—', chưa backfill (cần user duyệt vì là thay đổi dữ liệu). Gate: npm run build exit 0.
