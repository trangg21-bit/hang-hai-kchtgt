# F-128 C2 Brief: Rename Vietnamese Enums to English + Validation + Scheduler

**Triage ID:** TRI-1785395119079-33e6
**Change Class:** C2 (reduced pipeline)
**Entry Point:** `/documents/legal` page

## WHAT
F-128: Rename Vietnamese enum values in `DocumentType` and `ValidityStatus` to English equivalents, add DB migration (V107), rename controller params from `tinhTrang`/`loai` to `status`/`type`, add validation rules (effectiveDate >= issueDate, block EXPIRED edits), add daily expiry scheduler (30-day warning → EXPIRING_SOON), and update all frontend references.

## ORACLE (done-when acceptance)

### 1. DocumentType enum rename
- `LUAT` → `LAW`
- `NGHI_DINH` → `DECREE`
- `THONG_TU` → `CIRCULAR`
- `QUYET_DINH` → `DECISION`

### 2. ValidityStatus enum rename
- `CON_HIEU_LUC` → `EFFECTIVE`
- `SAP_HET_HIEU_LUC` → `EXPIRING_SOON`
- `DA_HET_HIEU_LUC` → `EXPIRED`

### 3. Flyway V107 migration
- NEW file: `src/main/resources/db/migration/V107__rename_legal_doc_enums_to_english.sql`
- UPDATE `legal_documents.document_type` for all 4 old values
- UPDATE `legal_documents.status` for all 3 old values

### 4. Controller param rename
- `GET /api/v1/legal-documents/status/{tinhTrang}` → `status/{status}`
- `GET /api/v1/legal-documents/type/{loai}` → `type/{type}`
- `GET /api/v1/legal-documents/search?loai=...&tinhTrang=...` → `?type=...&status=...`
- Javadoc comments updated accordingly

### 5. Service parameter rename
- Local variable `tinhTrang` → `status` in all methods
- Local variable `loai` → `type` in all methods
- Method signatures in `LegalDocumentService`

### 6. Validation rules
- `create()` and `update()`: `effectiveDate >= issueDate` check
- Block UPDATE when `validityStatus == EXPIRED` (throw error)
- Block DELETE when `validityStatus == EXPIRED` (throw error)
- Added `@AssertTrue` validation in `LegalDocumentCreateRequest`

### 7. Expiry scheduler
- NEW file: `src/main/java/com/hanghai/kchtg/document/service/LegalDocumentExpiryScheduler.java`
- `@Service`, `@Scheduled(cron = "0 0 2 * * *")` (daily at 2 AM)
- Query docs where `expirationDate BETWEEN today AND today+30 days` AND `status = EFFECTIVE`
- Set `status = EXPIRING_SOON` for matched docs
- Log each update

### 8. Frontend updates
- `LegalDocumentList.tsx`: All 22 hardcoded enum values updated (renderers, filter Selects, form Selects, initialValue)
- `api.ts`: URL params `loai→type`, `tinhTrang→status`
- All Select option `value` props updated to English enum names

## Compile Gate
`mvn compile -q && npx tsc --noEmit` both pass.

## Files Modified
- `src/main/java/com/hanghai/kchtg/document/entity/DocumentType.java`
- `src/main/java/com/hanghai/kchtg/document/entity/ValidityStatus.java`
- `src/main/java/com/hanghai/kchtg/document/controller/LegalDocumentController.java`
- `src/main/java/com/hanghai/kchtg/document/service/LegalDocumentService.java`
- `src/main/java/com/hanghai/kchtg/document/dto/LegalDocumentCreateRequest.java`
- `src/main/java/com/hanghai/kchtg/document/service/LegalDocumentExpiryScheduler.java` (NEW)
- `src/main/resources/db/migration/V107__rename_legal_doc_enums_to_english.sql` (NEW)
- `src/test/java/com/hanghai/kchtg/document/LegalDocumentControllerTest.java`
- `frontend/src/pages/document/LegalDocumentList.tsx`
- `frontend/src/services/document/api.ts`
