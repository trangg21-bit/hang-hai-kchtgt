---
id: AM-7b17b8a8dd18b23f
kind: fact
topic: anchorage-attachment-upload-bug
tags: []
importance: 0.9
agent: 
created: 2026-08-26T03:50:08.784Z
updated: 2026-08-26T03:50:08.784Z
---

BUG UPLOAD FILE ĐÍNH KÈM KHU NEO ĐẬU (2026-08-26, TRI-1787716073634-ea9b): upload POST /api/v1/anchorage/{id}/attachments trả 500 (test live: BERTH 200 OK, ANCHORAGE 500; không có folder uploads/attachments/ANCHORAGE). Nguyên nhân: AnchorageService.uploadAttachments dùng Paths.get(attachmentPath) RELATIVE (không .toAbsolutePath().normalize() như BerthService:639) → Tomcat Part.write với path relative resolve theo multipart location → lỗi. ĐÃ SỬA khớp Berth: thêm @Transactional + check max 10 file + toAbsolutePath().normalize() + originalFilename null-safe + System.currentTimeMillis() naming; và sửa deleteAttachment:365 so UUID.equals(entityId) thay vì .equals(entityId.toString()) (bản cũ luôn false → delete luôn lỗi). LƯU Ý: devtools KHÔNG tự reload khi mvn compile ghi ngoài IntelliJ — phải user Rebuild Project + restart app mới có hiệu lực.
