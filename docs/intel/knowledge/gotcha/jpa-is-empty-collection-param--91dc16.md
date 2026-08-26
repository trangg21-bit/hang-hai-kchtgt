---
id: AM-91dc16960d64f239
kind: gotcha
topic: jpa-is-empty-collection-param
tags: []
importance: 0.9
agent: 
created: 2026-08-21T03:10:34.662Z
updated: 2026-08-21T03:10:34.662Z
---

JPQL/Hibernate (Spring Boot 3.3.6): ':collectionParam IS EMPTY' bị JPA query validation REJECT (lỗi startup 'Could not create query... Validation failed') — IS EMPTY chỉ hợp lệ trên collection path, không phải bare param. Pattern ĐÚNG đang chạy trong project: boolean flag + IN, vd VtsSystemRepository '(:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)'. PortRepository.searchPorts đã dùng '(:includeAll = true OR p.orgUnitId IN :orgUnitIds)'.
