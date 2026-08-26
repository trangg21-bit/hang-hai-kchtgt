---
id: AM-94cadee625b8e1ff
kind: gotcha
topic: anchorage-diag-jwt-db
tags: []
importance: 0.85
agent: 
created: 2026-08-26T01:33:35.260Z
updated: 2026-08-26T01:33:35.260Z
---

Diagnose backend đang chạy (PID qua IntelliJ, profile local): JWT secret = default base64 trong application.yml (JWT_SECRET env KHÔNG set); mock-token 'mock-jwt-token-2026' KHÔNG được nhận (build có thể cũ hơn source — nhận được thì xác thực thành admin); JWT tự sinh (HS256, claims sub+user_id+permissions) vượt được JwtAuthFilter tới PermissionMiddleware (403 JSON có requiredPermission). Redis localhost:6379 không chạy → userSecurityCache miss → load DB. DB dev: 10.0.229.20:5432 vmd_csdl_v2_dev (admin/Etc@1234 trong .env) — user entity map bảng app_users (KHÔNG phải users); org_units ORDER BY path, root path rỗng đứng đầu; bảng anchorages org_unit_id đầy đủ.
