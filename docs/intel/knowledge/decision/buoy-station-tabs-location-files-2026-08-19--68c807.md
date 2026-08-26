---
id: AM-68c80748ea057479
kind: decision
topic: buoy-station-tabs-location-files-2026-08-19
tags: []
importance: 0.8
agent: 
created: 2026-08-19T09:18:25.122Z
updated: 2026-08-19T09:18:25.122Z
---

2 tab của form Nhà trạm phao tiêu ĐÃ tái cấu trúc theo đúng khuôn BuoyFormContent (2026-08-19): (1) Tab Thông tin vị trí: thêm trường 'Biểu tượng' mapSymbolId (GIS symbols từ symbolService.list({page:1,pageSize:1000,status:'active'}), Select có ảnh, disabled khi chưa chọn Loại đối tượng, required khi đã chọn); coordinateSystem + displayFormat giờ DISABLED + auto-set 'WGS84'/'Độ, phút, giây (DMS)' khi đổi objectType (mọi loại, không chỉ POINT) + required khi chọn loại; GPS section theo mẫu buoy: header 'Tọa độ GPS *' + nút 'Thêm tọa độ' trên (disabled khi chưa chọn loại), empty-state dashed box, table giữ nguyên; edit mode tự pad số dòng tọa độ theo GEOMETRY_POINT_COUNT (giống buoy); validate fail nhảy đúng tab (location/technical/general). Payload gửi icon: values.mapSymbolId (backend ĐÃ nhận icon từ trước — service line 136/264, KHÔNG cần migration). (2) Tab File đính kèm: nút 'Chọn file' trên header (showUploadList={false} + multiple, chỉ hiện khi có file), empty-state dashed 'Chưa có file đính kèm.', bảng STT/Tên(FileOutlined)/Thao tác (BỎ cột Kích thước cho khớp chuẩn), hint uploadHintStyle. (3) List nạp symbols + symbolMap/symbolImageMap truyền DetailContent; detail dòng Biểu tượng hiển thị tên+ảnh như BuoyDetailContent. Gate: npm run build exit 0.
