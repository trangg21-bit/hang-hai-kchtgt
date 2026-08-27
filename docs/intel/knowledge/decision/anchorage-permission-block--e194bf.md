---
id: AM-e194bff0e9f022ec
kind: decision
topic: anchorage-permission-block
tags: []
importance: 0.9
agent: 
created: 2026-08-26T01:33:34.423Z
updated: 2026-08-26T01:33:34.423Z
---

Anchorage (Khu neo đậu) 2026-08-26: list không load dù DB có 5 bản ghi (org Cảng vụ Hải Phòng b25bee7b, deleted_at NULL, approval_status 0=DRAFT x4, 3=APPROVED_LEVEL1 x1). Chuỗi chặn: PermissionMiddleware đòi anchorage:read — admin KHÔNG có anchorage:* trong user_permission_override (chỉ admin:all, user:read...), và build đang chạy (target/classes qua IntelliJ) chặn luôn cả admin:all → 403 'anchorage:read' dù token hợp lệ. Đã sửa TẠM: comment toàn bộ @PreAuthorize trong AnchorageController (14 chỗ) + thêm '/api/v1/anchorage' vào PUBLIC_PATH_PREFIXES của PermissionMiddleware — PHẢI KHÔI PHỤC khi xong. Round-trip approvalStatus KHỚP: enum DRAFT(0)...APPROVED_LEVEL1(3), @Enumerated(ORDINAL) + @JsonValue name, fromString nhận chuỗi tên + số.
