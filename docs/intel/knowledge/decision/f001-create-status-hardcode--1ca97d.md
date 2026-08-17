---
id: AM-1ca97dea5d2ab406
kind: decision
topic: f001-create-status-hardcode
tags: []
importance: 0.7
agent: 
created: 2026-08-14T05:51:01.093Z
updated: 2026-08-14T05:51:01.093Z
---

F-001 form-reshape WO-02 (2026-08-14): FE create path no longer hardcodes status — userService.ts create() sends status: payload.status?.toUpperCase() + address/department/position/note; UsersPage create drawer has 11-field order with status Select (initialValues active) + 4 profile fields; detail drawer shows 4 rows null->'—'. Backend UserService.java:431 user.setStatus(ACTIVE) hardcode remains until WO-01 lands (backend DTO/entity work mid-flight: UserDetailResponse/UserResponse reference getAddress() etc. not yet defined).
