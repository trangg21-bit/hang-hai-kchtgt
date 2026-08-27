---
id: AM-77436061b0f7730f
kind: decision
topic: buoy-station-csv-frontend-package-2026-08-19
tags: []
importance: 0.85
agent: 
created: 2026-08-19T09:38:57.915Z
updated: 2026-08-19T09:38:57.915Z
---

Gói frontend theo CSV 'QL Nhà trạm phao tiêu' ĐÃ SỬA (2026-08-19, user chọn gói frontend): FORM — Đơn vị khai thác, Thuộc luồng hàng hải, Số lượng nhân sự bố trí thêm required; Tình trạng đổi Switch→Select 2 giá trị Hoạt động/Ngừng (map isActive, required); Tên nhà trạm + Địa điểm chi tiết đổi Input→Input.TextArea; Năm bảo trì đổi InputNumber→DatePicker picker='year' (payload: dayjs.year(), prefill dayjs(`${year}-01-01`)). LIST — tách cột Mã (Tag cyan) + Tên riêng (link); thêm cột Thuộc luồng hàng hải (waterwayMap từ lineObjectService WATERWAY); thêm bộ lọc Thuộc luồng + Tình trạng (client-side, backend search KHÔNG nhận waterwayId/isActive). GOTCHA: LineObject.ObjectType là ENUM (giá trị) — PHẢI import { LineObject } không được import type (runtime TypeError, options luồng rỗng). CÒN LẠI (backend, user hoãn): 4 section detail (Danh sách phao tiêu 34-38, Vận hành 39-42, Bảo trì 43-46, Sự cố 47-50 — entity nhà trạm không có field), Nội dung phê duyệt (30,33), format mã NT-{seq} (hiện {portCode}-NTPT{02}), cột Phân loại 34-36 trên list. Gate: npm run build exit 0.
