---
id: AM-c331c263f9912ca8
kind: decision
topic: dryport-file-attachment-fix
tags: []
importance: 0.8
agent: 
created: 2026-08-14T10:15:59.285Z
updated: 2026-08-14T10:15:59.285Z
---

Cảng cạn (frontend/src/pages/port/DryPortForm.tsx) tab File đính kèm đã sửa giống cảng biển (2026-08-14). Nguyên nhân gốc: endpoint cũ POST /v1/dry-ports/{id}/attachments là STUB — DryPortService.uploadAttachments() chỉ log.info, KHÔNG lưu file (file bị discard âm thầm dù toast báo thành công). Fix: upload từng file qua POST /v1/documents/upload/dryport/{id} (hệ thống documents chuẩn, entityType='dryport' khớp với list GET /v1/documents/entity/dryport/{id} mà DryPortList detail đang dùng). UI tab đổi sang pattern giống PortListPage: header + nút 'Thêm file' + empty state + Table (STT/Tên file/Xóa) + hint. Edit mode map file cũ vào uploadFileList (uid=a.id, KHÔNG có originFileObj) để skip re-upload; save chỉ upload file có originFileObj. Cảng biển dùng entityType='port' cho cùng hệ thống documents.
