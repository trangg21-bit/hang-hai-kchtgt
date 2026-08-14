---
id: AM-e00ce703d631e013
kind: gotcha
topic: F-001-user-profile-expansion
tags: []
importance: 0.7
agent: 
created: 2026-08-14T05:30:01.145Z
updated: 2026-08-14T05:30:01.145Z
---

F-001 (Quản lý tài khoản người dùng) scope expansion TRI-1786681457834-5887: create() hardcodes ACTIVE at BOTH ends — UserService.java:431 `user.setStatus(UserStatus.ACTIVE)` and frontend userService.ts:98 `status: 'ACTIVE'` in POST body; CreateUserRequest has NO status field while UpdateUserRequest already has status. Expansion adds 4 nullable columns address/department/position/note to app_users via Flyway V20260814120000__add_user_profile_columns.sql and takes create status from form (order: username, password, orgUnit, email, fullName, phone, address, department, position, status, note).
