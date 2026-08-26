---
id: AM-d09732ce6490df47
kind: gotcha
topic: page-empty-serialization-500
tags: []
importance: 0.9
agent: 
created: 2026-08-20T07:46:53.941Z
updated: 2026-08-20T07:46:53.941Z
---

Lỗi 500 trên GET /api/v1/documents/entity/{type}/{id} khi entity KHÔNG có tài liệu: DocumentService trả Page.empty() -> bọc Pageable.unpaged() -> Jackson gọi Unpaged.getOffset() ném UnsupportedOperationException -> GlobalExceptionHandler catch-all trả 500 'Internal server error' (qua chain ApiResponse['data']->PageImpl['pageable']->Unpaged['offset']). FIX: thay Page.empty() bằng new PageImpl<>(List.of(), PageRequest.of(page,size), 0) — áp dụng cho DocumentService, BeaconHistoryController, BeaconHistoryService. CẤM dùng Page.empty() trong response controller.
