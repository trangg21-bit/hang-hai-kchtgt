---
id: AM-9505e68fc0e529db
kind: decision
topic: dryport-modal-inline-structure
tags: []
importance: 0.75
agent: 
created: 2026-08-14T09:34:19.449Z
updated: 2026-08-14T09:34:19.449Z
---

Cảng cạn (DryPort) đã chuyển sang cấu trúc modal inline giống Cảng biển (2026-08-14): DryPortForm.tsx giờ nhận props {id?, onClose} (bỏ useParams/useNavigate, 4 chỗ navigate('/dry-port') → onClose()); DryPortList.tsx render <DryPortForm id={formEditId} onClose={closeFormModal}> khi formModalOpen; 'Thêm mới'/'Chỉnh sửa' mở modal thay vì navigate; App.tsx bỏ 2 route /dry-port/create + /dry-port/:id/edit. closeFormModal (useCallback) đóng modal + fetchData + fetchCounts để refresh list. DryPortForm vẫn còn ép cứng geometryType='POINT' trong initialValues + setFieldsValue (khác Port đã sửa sang || undefined) — issue tồn đọng riêng.
