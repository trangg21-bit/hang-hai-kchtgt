---
name: kcht-dynamic-form-sidebar
description: >-
  Quy chuẩn và hướng dẫn áp dụng component DynamicFormSidebar theo chuẩn mefobase-core cho form Drawer Thêm mới / Chỉnh sửa hồ sơ KCHT.
  Kích hoạt khi tạo mới, refactor form Drawer thêm/sửa hoặc chuyển đổi form thủ công sang schema khai báo FormFieldConfig[].
---

# KCHT Dynamic Form Sidebar Standard & Automation Skill

## 1. Giới thiệu & Phạm vi áp dụng

Skill này hướng dẫn AI tự động áp dụng component **`DynamicFormSidebar`** vào các màn hình Thêm mới / Chỉnh sửa (Create / Edit Drawer) trong dự án Quản lý Kết cấu hạ tầng giao thông Hàng hải (BXD/Cục Hàng hải).

Thiết kế học tập từ triết lý kiến trúc **`DynamicFormSidebarComponent`** của dự án `mefobase-core`, chuyển đổi toàn bộ mã JSX form thủ công dài hàng trăm dòng sang mô hình hướng cấu hình (declarative schema) thông qua `FormFieldConfig[]`, `FormSectionConfig[]`, `FormTabConfig[]` và `FormSidebarAction[]`.

### Vị trí & Cách import
Component được đặt tại `frontend/src/components/shared/dynamic-form-sidebar/` và đã được re-export tập trung tại `frontend/src/components/list-view`:

```tsx
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormFieldConfig,
  type FormSectionConfig,
  type FormTabConfig,
  type FormSidebarAction,
  type DynamicFormSidebarProps,
} from '@/components/list-view';
// hoặc import từ:
import {
  DynamicFormSidebar,
  FormFieldType,
} from '@/components/shared/dynamic-form-sidebar';
```

---

## 2. Các quy tắc chuẩn mực bắt buộc (MANDATORY)

1. **Tuân thủ `erasableSyntaxOnly` (CẤM dùng TypeScript enum)**:
   Mọi kiểu trường dữ liệu phải dùng `const object as const` và `type alias`:
   ```ts
   export const FormFieldType = {
     Text: 'text',
     Number: 'number',
     Select: 'select',
     TreeSelect: 'treeSelect',
     Date: 'date',
     Year: 'year',
     TextArea: 'textarea',
     Custom: 'custom',
     Readonly: 'readonly',
   } as const;
   export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];
   ```

2. **Quy chuẩn thẩm mỹ Design System**:
   - **Nhãn trường**: Tự động hiển thị bằng font chữ chuẩn, màu nhận diện `colors.sidebarBg` (#12468C), độ đậm `fontWeightBold` (600), cỡ chữ `fontSizeMd` (13.5px).
   - **Bo góc tròn viên thuốc (Pill standard)**: Tất cả `Input`, `Select`, `DatePicker`, `InputNumber`, `Button` **bắt buộc** dùng `borderRadius: radiusPill` (999px), chiều cao `height: 40`.
   - **Khung Section**: Hộp thẻ bo viền trắng `sectionBoxStyle` (nền `#ffffff`, viền `1px solid #e2e8f0`, bo góc 8px, padding `14px 18px 10px 18px`, bóng nhẹ), có tiêu đề kèm icon semantic màu `actionPrimary`.
   - **Lưới responsive**: Chia 2 cột cân xứng bằng `Row gutter={[24, 0]}` và `Col span={12}` (mặc định), trường dài như Vị trí / Địa chỉ / Ghi chú dùng `span={24}`.
   - **Vị trí cụm nút chân footer**: Cụm nút footer ("Lưu tạm", "Lưu và gửi phê duyệt", "Lưu và phê duyệt") **bắt buộc nằm ở chính giữa** (`footerAlign: 'center'`, `justifyContent: 'center'`).
   - **Placeholder tự động**: Nếu không truyền `placeholder`, component tự động sinh mặc định: `'Nhập ' + label` (cho Text, TextArea, Number) hoặc `'Chọn ' + label` (cho Select, TreeSelect).

3. **Chỉ lấy chuẩn 1 trường, không fallback toán tử linh tinh**:
   Tuyệt đối không dùng toán tử `??`, `||`, ternary bừa bãi khi mapping dữ liệu API/Form.

4. **Tự động tính toán (Computed Values)**:
   Các trường tính toán phụ thuộc (như `Giá trị còn lại = Nguyên giá - Khấu hao lũy kế`, `Khấu hao tháng = Nguyên giá / Số tháng`) phải cấu hình `type: FormFieldType.Readonly` kết hợp callback `computedValue` và `valueFormatter`, tự động cập nhật ngay lập tức khi người dùng nhập liệu.

---

## 3. Các loại trường hỗ trợ (`FormFieldType`)

| Type | Ý nghĩa | Các thuộc tính đặc thù |
|---|---|---|
| `FormFieldType.Text` | Ô nhập văn bản đơn | `placeholder`, `disabled`, `readOnly` |
| `FormFieldType.Number` | Ô nhập số định dạng VNĐ / tiền tệ | `min`, `max`, `formatter` (mặc định `fmtInputNumber`), `parser` |
| `FormFieldType.Select` | Dropdown chọn từ danh sách phẳng | `options: SelectOptionItem[]`, `allowClear`, `showSearch` |
| `FormFieldType.TreeSelect` | Dropdown dạng cây phân cấp đơn vị | `organizations: Organization[]`, `treeSelectProps` |
| `FormFieldType.Date` | Ô chọn ngày tháng (`DD/MM/YYYY`) | `format`, `datePickerProps` (tự động gắn `getDatePickerProps`) |
| `FormFieldType.Year` | Ô chọn năm (`YYYY`) | `format: 'YYYY'`, `picker: 'year'` |
| `FormFieldType.TextArea` | Khung nhập văn bản nhiều dòng | `rows` (mặc định 2), `colSpan: 24` |
| `FormFieldType.Readonly` | Ô hiển thị giá trị tính toán tự động | `computedValue: (form, values) => unknown`, `valueFormatter` |
| `FormFieldType.Custom` | Tùy biến JSX hoàn toàn | `customRender: ({ form, field, values }) => ReactNode` |

---

## 4. Cấu trúc Mẫu Chuẩn (Reference Implementation)

### 4.1. File cấu hình Form (`XxxAssetForm.tsx`)

```tsx
import React, { useMemo } from 'react';
import { Form, Select, InputNumber } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { BankOutlined, SlidersOutlined } from '@ant-design/icons';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '@/components/list-view';
import { fmtInputNumber } from '@/utils/numFmt';
import { colors, fontWeightBold, fontSizeMd, radiusPill, spaceSm, spaceFormField } from '@/themetokenchk';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '@/components/shared/InfrastructureAttachmentTab';

export interface AssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: Record<string, unknown>;
  form: FormInstance<Record<string, unknown>>;
  organizations: any[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function AssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: AssetFormProps) {
  // Cấu hình các Tabs & Sections
  const formTabs = useMemo<FormTabConfig[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin cơ bản & Quản lý vận hành',
            icon: <BankOutlined />,
            fields: [
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                rules: [{ required: true, message: 'Đơn vị quản lý là bắt buộc' }],
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: FormFieldType.Text,
                placeholder: 'Nhập tên tài sản',
                required: true,
                rules: [{ required: true, message: 'Tên tài sản là bắt buộc' }],
              },
              // Nhóm ghép đôi: Số lượng + Đơn vị tính
              {
                name: 'quantityGroup',
                label: '',
                type: FormFieldType.Custom,
                colSpan: 12,
                customRender: () => (
                  <div style={{ display: 'flex', gap: spaceSm }}>
                    <div style={{ flex: 1 }}>
                      <Form.Item name="quantity" label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Số lượng</span>} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={{ borderRadius: radiusPill, height: 40, width: '100%' }} />
                      </Form.Item>
                    </div>
                    <div style={{ width: 140 }}>
                      <Form.Item name="quantityUnit" label={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị tính</span>} style={{ marginBottom: spaceFormField }}>
                        <Select allowClear placeholder="Đơn vị" options={[{ value: 'Bộ', label: 'Bộ' }, { value: 'Cái', label: 'Cái' }]} style={{ borderRadius: radiusPill, height: 40, width: '100%' }} />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng',
                type: FormFieldType.Year,
                placeholder: 'Chọn năm',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                colSpan: 24,
                placeholder: 'Nhập vị trí',
              },
            ],
          },
          {
            key: 'depreciation_info',
            title: 'Thông tin giá trị & Khấu hao tài sản',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              // Trường tính toán tự động: Giá trị còn lại
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  if (values.originalValue == null) return undefined;
                  return Math.max(0, Number(values.originalValue) - (Number(values.accumulatedDepreciation) || 0));
                },
                valueFormatter: (val) => (val != null ? fmtInputNumber(Number(val)) : '—'),
              },
            ],
          },
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${attachments.length})`,
        customContent: (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
              readonly={false}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
              onDownload={onDownloadAttachment}
            />
          </div>
        ),
      },
    ];
  }, [organizations, attachments, onUploadAttachment, onDeleteAttachment, onDownloadAttachment]);

  // Cấu hình các nút chân Footer (Căn giữa mặc định)
  const footerActions = useMemo<FormSidebarAction[]>(() => {
    if (drawerMode === 'edit') {
      const isDraft = !selected?.approvalStatus || ['DRAFT', 'NHAP'].includes(String(selected.approvalStatus).toUpperCase());
      const actions: FormSidebarAction[] = [];
      if (isDraft) {
        actions.push({
          key: 'draft',
          label: 'Lưu tạm',
          variant: 'outline',
          loading: saving && saveAction === 'DRAFT',
          onClick: () => void onSave('DRAFT'),
        });
      }
      actions.push({
        key: 'approve',
        label: 'Lưu và phê duyệt',
        variant: 'success',
        loading: saving && saveAction === 'APPROVED',
        onClick: () => void onSave('APPROVED'),
      });
      return actions;
    }

    return [
      {
        key: 'draft',
        label: 'Lưu tạm',
        variant: 'outline',
        loading: saving && saveAction === 'DRAFT',
        onClick: () => void onSave('DRAFT'),
      },
      {
        key: 'submit',
        label: 'Lưu và gửi phê duyệt',
        variant: 'primary',
        loading: saving && saveAction === 'PENDING_APPROVAL',
        onClick: () => void onSave('PENDING_APPROVAL'),
      },
      {
        key: 'approve',
        label: 'Lưu và phê duyệt',
        variant: 'success',
        loading: saving && saveAction === 'APPROVED',
        onClick: () => void onSave('APPROVED'),
      },
    ];
  }, [drawerMode, selected, saving, saveAction, onSave]);

  const title = drawerMode === 'edit'
    ? `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản'}`
    : 'Thêm mới tài sản';

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
      width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
    />
  );
}
```

### 4.2. File danh sách (`XxxAssetList.tsx`)

Trong màn danh sách chính, chỉ cần gọi component form gọn gàng:

```tsx
<AssetForm
  open={drawerMode === 'create' || drawerMode === 'edit'}
  drawerMode={drawerMode}
  selected={selected}
  form={form}
  organizations={organizations}
  attachments={attachments}
  saving={saving}
  saveAction={saveAction}
  onClose={() => {
    setDrawerMode(undefined);
    form.resetFields();
  }}
  onSave={saveAsset}
  onUploadAttachment={handleUploadAttachment}
  onDeleteAttachment={handleDeleteAttachment}
  onDownloadAttachment={handleDownloadAttachment}
/>
```

---

## 5. Checklist Kiểm tra Hoàn tất (Zero Errors Verification)

Trước khi bàn giao bất kỳ màn hình nào áp dụng `DynamicFormSidebar`, AI **bắt buộc** thực hiện:
- [ ] 1. Kiểm tra không có `enum` trong toàn bộ code mới.
- [ ] 2. Kiểm tra `footerAlign="center"` để các nút footer luôn nằm ở giữa.
- [ ] 3. Kiểm tra tính toán `computedValue` của các trường phụ thuộc.
- [ ] 4. Dọn sạch 100% Unused Imports / Unused Variables (IDE Lint clean).
- [ ] 5. Chạy `npx tsc --noEmit` đạt mã 0 (0 lỗi).
- [ ] 6. Chạy `npx eslint` đạt mã 0 (0 errors, 0 warnings).
