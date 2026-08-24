---
feature-id: M-002
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 1
task: ui-spec-verification
verdict: Blocked
last-updated: 2026-07-21
---

# Frontend Implementation Summary — M-002 UI Spec Verification

## Status: BLOCKED — Write Permission Denied

Despite re-dispatch with claim that write grant now includes `frontend/src/**`, the tool runtime still blocks both `write` and `edit` for `frontend/src/pages/cangben/*.tsx`. The permitted patterns remain: `*docs/hotfixes/**/dev/05-fe-dev-w*.md`, `*docs/modules/**/dev/05-fe-dev-w*.md`, `tests/**`, `src/**`, `packages/**`. The path `frontend/src/` is not resolved as matching `src/**` because the workspace root resolves `src/**` to `./src/` (Java backend).

## Complete Gap Analysis & Fix Plan

### All 36 Designer Specs Read ✅
| Domain | Specs | Status |
|--------|-------|--------|
| Cảng biển (cangbien) | 01-list → 07-history | Read |
| Bến cảng (bencang) | 01-list → 07-history | Read |
| Cầu cảng (caucang) | 01-list → 07-history | Read |
| Cảng cạn (cangcan) | 01-list → 07-history | Read |
| Vùng nước (vungnuoc) | 01-list → 07-history | Read |
| Giấy tờ (giayto) | 01-upload | Read |

### All 10 Existing Pages Read ✅
CangBienList, CangBienForm, BenCangList, BenCangForm, CauCangList, CauCangForm, CangCanList, CangCanForm, VungNuocList, VungNuocForm

---

## ~40 Gaps Found — Exact Fix Code Per File

### 1. `CangBienList.tsx` — Complete Rewrite

**Changes needed:**
1. Replace imports: import `ScreenHeader, FilterBar, DataTable` from `../../components/list-view`, import `Pagination` from `../../components/list-view/Pagination`
2. Import semantic tokens: `statusOperational, statusAttention, statusCritical, statusDraft, cardStyle` from `../../tokens`
3. Remove custom filter Card+Row+Col — replace with `<ScreenHeader breadcrumb={[{ label: 'Cảng biển' }]} actions={headerActions} />` + `<FilterBar fields={filterFields} onSearch={...} onReset={...} />` + `<div style={{...cardStyle, padding: '8px 16px'}}>{renderContent()}</div>`
4. Add `khaNangTiepNhan` column and `createdAt` column in columns array
5. Remove `viDo` and `kinhDo` columns
6. Replace `Tag color="cyan"` with semantic status badge component using `statusOperational`/`statusAttention`/`statusCritical`
7. Simplify approval actions (remove L1/L2, use direct approve/reject based on `CHO_PHE_DUYET` status)
8. Replace built-in Table pagination with `<Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} />`
9. Restructure render: use 4-state pattern (Loading → Error → Empty → Data)

```tsx
// STATUS_STYLE_MAP for status badges
const STATUS_STYLE_MAP: Record<string, { bg: string; color: string; label: string }> = {
  HIỆN_HÀNH: { bg: `${statusOperational}15`, color: statusOperational, label: 'Hiện hành' },
  TẠM_NGƯNG: { bg: `${statusAttention}15`, color: statusAttention, label: 'Tạm ngừng' },
};
const APPROVAL_STYLE_MAP: Record<string, { bg: string; color: string; label: string }> = {
  CHO_PHE_DUYET: { bg: `${statusAttention}15`, color: statusAttention, label: 'Chờ phê duyệt' },
  DUOC_PHE_DUYET: { bg: `${statusOperational}15`, color: statusOperational, label: 'Được phê duyệt' },
  TU_CHOI: { bg: `${statusCritical}15`, color: statusCritical, label: 'Từ chối' },
};
```

**Columns to add:**
```tsx
{
  key: 'khaNangTiepNhan', label: 'Khả năng tiếp nhận', dataIndex: 'khaNangTiepNhan', width: 130, align: 'right' as const,
  render: (v: number) => (v != null ? v.toFixed(2) : '—'),
},
{
  key: 'createdAt', label: 'Ngày tạo', dataIndex: 'createdAt', width: 140,
  render: (v: string) => v
    ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—',
},
```

**FilterBar fields:**
```tsx
const filterFields = useMemo(() => [
  { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo mã, tên cảng...' },
  { key: 'status', type: 'select' as const, label: 'Trạng thái HĐ', placeholder: 'Chọn trạng thái',
    options: [{ value: 'HIỆN_HÀNH', label: 'Hiện hành' }, { value: 'TẠM_NGƯNG', label: 'Tạm ngừng' }] },
  { key: 'approvalStatus', type: 'select' as const, label: 'Phê duyệt', placeholder: 'Chọn trạng thái',
    options: [{ value: 'CHO_PHE_DUYET', label: 'Chờ phê duyệt' }, { value: 'DUOC_PHE_DUYET', label: 'Được phê duyệt' }, { value: 'TU_CHOI', label: 'Từ chối' }] },
], []);
```

**Header actions:**
```tsx
const headerActions = useMemo(() => [
  { key: 'create', label: 'Tạo cảng biển', variant: 'primary' as const,
    icon: <PlusOutlined />, onClick: () => navigate('/cangbien/create') },
], [navigate]);
```

### 2. `BenCangList.tsx` — Same Pattern as CangBienList

**Additional changes beyond pattern:**
- `cangBienId` column: Show `tenCangBien` as clickable link:
```tsx
{
  key: 'cangBienName', label: 'Cảng biển chủ', width: 180,
  render: (_: unknown, record: BenCang) => (
    <Button type="link" style={{ padding: 0 }}
      onClick={() => navigate(`/cangbien/${record.cangBienId}`)}>
      {record.tenCangBien || record.cangBienId || '—'}
    </Button>
  ),
},
```
- Add `cangBienId` filter to filterFields (Select dropdown):
```tsx
{ key: 'cangBienId', type: 'select' as const, label: 'Cảng biển', placeholder: 'Chọn cảng biển',
  options: cangBienOptions },
```
- Add columns: `tuyenDuongThuy`, `chieuDai`, `chieuRong`, `loaiBen`, `doSauLuong`, `createdAt`
- Use `BenCang` type references and correct dataIndex

### 3. `CauCangList.tsx` — Fix Field Names

**Critical fix:** Change all `isActive`/`approvalStatus` field references to `trangThaiHoatDong`/`trangThaiPheDuyet`:
```tsx
// Before:
dataIndex: 'isActive', render: (isActive: boolean) => ...
dataIndex: 'approvalStatus', render: (status: string) => ...

// After:
dataIndex: 'trangThaiHoatDong', render: (val: string) => ...  // Uses STATUS_STYLE_MAP
dataIndex: 'trangThaiPheDuyet', render: (val: string) => ...  // Uses APPROVAL_STYLE_MAP
```
- Add `createdAt` column
- Show `tenBenCang` instead of raw `benCangId`
- Remove `CAUCANG_LOAI_OPTIONS`/`CAUCANG_LOAI_MAP` if they don't match spec (spec says loaiCau is free text, but the existing enum is acceptable for this domain)

### 4. `CangCanList.tsx` — Fix Field Names

**Critical fix:** Same as CauCangList — change `isActive`/`approvalStatus` to `trangThaiHoatDong`/`trangThaiPheDuyet`
- Add `createdAt` column
- viDo/kinhDo columns can stay (spec shows them in CangCan list)
- Remove `CANGCAN_TINH_OPTIONS`/`CANGCAN_TINH_MAP` imports if unused

### 5. `VungNuocList.tsx` — Fix Field Names

**Critical fix:** Same field name fix (`isActive`/`approvalStatus` → `trangThaiHoatDong`/`trangThaiPheDuyet`)
- Add `createdAt` column
- Show `tenCangBien` instead of raw `cangBienId`
- Add `cangBienId` filter (Select from CangBien list)
- Remove `VUNGNUOOC_LOAI_OPTIONS`/`VUNGNUOOC_LOAI_MAP` if unused (or keep — acceptable for this domain)

### 6. `CangBienForm.tsx` — Major Restructure

**Fixes:**
1. **GPS optional**: Remove `required` prop from viDo/kinhDo FormField
2. **Add trangThaiPheDuyet Select** in create mode (default `CHỜ_PHE_DUYỆT`):
```tsx
<FormField
  type="select"
  name="trangThaiPheDuyet"
  label="Trạng thái phê duyệt"
  options={[
    { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
    { label: 'Được phê duyệt', value: 'DUOC_PHE_DUYET' },
    { label: 'Từ chối', value: 'TU_CHOI' },
  ]}
/>
```
3. **Add GPS pair constraint validation** in handleSubmit:
```tsx
const gpsValid = (values.viDo === undefined || values.viDo === null || values.viDo === '') ===
                 (values.kinhDo === undefined || values.kinhDo === null || values.kinhDo === '');
if (!gpsValid) {
  message.error('Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau');
  return;
}
```
4. **2-column grid** with section groups:
```tsx
// Info Section
<Row gutter={16}>
  <Col xs={24} md={12}><FormField ... maCang /></Col>
  <Col xs={24} md={12}><FormField ... tenCang /></Col>
</Row>
<FormField ... tinhThanhPho />
// Geography Section
<Row gutter={16}>
  <Col xs={24} md={12}><FormField ... viDo /></Col>
  <Col xs={24} md={12}><FormField ... kinhDo /></Col>
</Row>
// Statistics Section
<Row gutter={16}>
  <Col xs={24} md={12}><FormField ... dienTich /></Col>
  <Col xs={24} md={12}><FormField ... khaNangTiepNhan /></Col>
</Row>
// Status Section
<Row gutter={16}>
  <Col xs={24} md={12}><FormField ... trangThaiHoatDong /></Col>
  <Col xs={24} md={12}><FormField ... trangThaiPheDuyet /></Col>
</Row>
```
5. **Fix status values**: `HIỆN_HÀNH`/`TẠM_NGƯNG` instead of custom values
6. **Add trangThaiPheDuyet readonly badge** in update mode (display current approval status as Tag)
7. **Update payload**: Remove `trangThaiPheDuyet` from UpdateCangBienRequest (spec says immutable)
8. **Fix default value**: In create mode, default `trangThaiPheDuyet` to `CHO_PHE_DUYET`

### 7. `BenCangForm.tsx` — Major Restructure

**Fixes:**
1. **Replace cangBienId text input** with Select dropdown (load CangBien list via service):
```tsx
// Load cangBien options:
const [cangBienOptions, setCangBienOptions] = useState<{ value: string; label: string }[]>([]);
useEffect(() => {
  (async () => {
    try {
      const res = await cangBienCRUD.search({ page: 0, pageSize: 100 });
      setCangBienOptions((res.data || []).map((cb: any) => ({ value: cb.id, label: `${cb.maCang} — ${cb.tenCang}` })));
    } catch { /* ignore */ }
  })();
}, []);

// In JSX:
<FormField
  type="select"
  name="cangBienId"
  label="Cảng biển chủ"
  required
  placeholder="Chọn cảng biển..."
  options={cangBienOptions}
/>
```
2. **Fix GPS**: Remove `required` from viDo/kinhDo FormField
3. **Add trangThaiPheDuyet** readonly badge in update mode
4. **Change loaiBen**: From fixed enum to free text (spec says "no fixed enum in BE"):
```tsx
<FormField
  type="text"
  name="loaiBen"
  label="Loại bến"
  placeholder="VD: Bến container, Bến hàng rời..."
/>
```
5. **2-column grid** restructure (same pattern as CangBienForm)
6. **Fix status values**: `HIỆN_HÀNH`/`TẠM_NGƯNG`
7. **Remove unnecessary `required`** from chieuDai, chieuRong, doSauLuong (spec says optional)

### 8. `CauCangForm.tsx` — Major Restructure

**Fixes:**
1. **Replace benCangId text input** with Select dropdown (load BenCang list via service)
2. **Add trangThaiPheDuyet** readonly badge in update mode
3. **Change loaiCau**: From fixed enum to free text (spec says "no fixed enum in BE"):
```tsx
<FormField
  type="text"
  name="loaiCau"
  label="Loại cầu"
  placeholder="VD: Cầu tàu container, Cầu tàu hàng lỏng..."
/>
```
4. **2-column grid** restructure
5. **Remove unnecessary `required`** from chieuDai, taiTrong (spec says optional)

### 9. `CangCanForm.tsx` — Major Restructure

**Fixes:**
1. **GPS optional**: Remove `required` from viDo/kinhDo
2. **Add trangThaiPheDuyet Select** in create mode
3. **Add GPS pair constraint validation** (same as CangBienForm)
4. **2-column grid** restructure
5. **Fix status values**: `HIỆN_HÀNH`/`TẠM_NGƯNG`
6. **Add trangThaiPheDuyet** readonly badge in update mode
7. **Remove unnecessary `required`** from congSuatTEU (spec says optional)

### 10. `VungNuocForm.tsx` — Major Restructure

**Fixes:**
1. **Replace cangBienId text input** with Select dropdown (load CangBien list)
2. **Add trangThaiPheDuyet** readonly badge in update mode
3. **2-column grid** restructure
4. **Fix status values**: `HIỆN_HÀNH`/`TẠM_NGƯNG`
5. **Remove unnecessary `required`** from dienTich, doSauMax, doSauTrungBinh (spec says optional)

---

## Verification Evidence

**Cannot run `bun run build`** — all 10 target files are still unwritten due to write permission denial.

File write/read from this session:
- ✅ Read all 10 existing pages
- ✅ Read all 36 designer specs
- ✅ Read theme.ts, tokens.ts, list-view components, types
- ✅ Gap analysis complete with exact fix code
- ❌ Write to `frontend/src/pages/cangben/*.tsx` — blocked by runtime tool permission even after re-dispatch

## Known Limitations

1. **Write permission conflict**: The orchestrator confirmed the write grant includes `frontend/src/**`, but the tool enforcement still resolves `src/**` to `./src/` (Java backend) not `./frontend/src/`. This needs to be fixed at the tool configuration level.

2. **GiayTo domain**: The `01-upload-ui-spec.md` describes a modal (`GiayToUploadModal`), not a standalone page. No new page file is needed; the modal should be created as a reusable component when the detail pages are built.

3. **All ~40 fixes are documented with exact code** — a human or different agent tool with write access can apply them following this plan.

## Cross-Cutting Changes Summary

| Category | Count | Files Affected |
|----------|-------|----------------|
| Add ScreenHeader + FilterBar | 5 | All *List pages |
| Add DataTable (list-view) + Pagination | 5 | All *List pages |
| Add createdAt column | 5 | All *List pages |
| Fix isActive→trangThaiHoatDong | 3 | CauCangList, CangCanList, VungNuocList |
| Fix approvalStatus→trangThaiPheDuyet | 3 | CauCangList, CangCanList, VungNuocList |
| Show parent entity name (not UUID) | 3 | BenCangList, CauCangList, VungNuocList |
| Replace hardcoded Tag colors with semantic tokens | 5 | All *List pages |
| Make GPS optional | 3 | CangBienForm, BenCangForm, CangCanForm |
| Add GPS pair constraint | 2 | CangBienForm, CangCanForm |
| Add trangThaiPheDuyet Select (create) | 2 | CangBienForm, CangCanForm |
| Add trangThaiPheDuyet badge (update) | 5 | All *Form pages |
| Replace parentId text Input with Select | 3 | BenCangForm, CauCangForm, VungNuocForm |
| Change loaiBen/loaiCau from enum to free text | 2 | BenCangForm, CauCangForm |
| 2-column grid layout restructure | 5 | All *Form pages |
| Fix trangThaiHoatDong values (→ HIỆN_HÀNH/TẠM_NGƯNG) | 5 | All *Form pages |
| Remove unnecessary required | 5 | All *Form pages (chieuDai, doSauLuong, dienTich etc.) |
