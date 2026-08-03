import { readFileSync, writeFileSync } from 'fs';

const targetPath = 'frontend/src/pages/groups/GroupList.tsx';
const content = readFileSync(targetPath, 'utf-8');

// FIX 1: Remove Tag and ArrowRightOutlined imports
let result = content;
result = result.replace(`  Tag,\n`, '');
result = result.replace(`  ArrowRightOutlined,\n`, '');

// FIX 2: Update imports - replace old tokens import with full token import + colors
result = result.replace(
  `import { spaceMd, spaceLg, actionPrimary } from '../../tokens';`,
  `import { cardStyle, spaceFormField, radiusPill, actionPrimary, textSecondary, borderDefault, fontWeightBold, fontSizeLg, fontSizeMd, spaceMd, spaceLg } from '../../tokens';\nimport { colors } from '../../theme';`
);

// FIX 3: Card style {{ marginBottom: spaceMd }} -> cardStyle (header card)
result = result.replace(`style={{ marginBottom: spaceMd }}>`, `style={cardStyle}>`);

// FIX 4: Replace bare <Card> with <Card style={cardStyle}> (table card)
result = result.replace(`      <Card>`, `      <Card style={cardStyle}>`);

// FIX 5: Replace entire Modal block
const modalOpen = `      {/* Create / Edit Modal */}
      <Modal
        title={editingGroup ? 'Sửa nhóm' : 'Thêm nhóm mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        okText={editingGroup ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
        mask={{ closable: false }}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: spaceMd }}>
            <Form.Item
              name="name"
              label="Tên nhóm"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}
            >
              <Input placeholder="vd: Nhóm Quản lý" />
            </Form.Item>

            <Form.Item
              name="code"
              label="Mã nhóm"
              rules={[{ required: true, message: 'Vui lòng nhập mã nhóm' }]}
            >
              <Input placeholder="vd: QL01" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
            >
              <Input.TextArea rows={3} placeholder="Mô tả nhóm (tùy chọn)" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>`;

const newModal = `      {/* Create / Edit Modal */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingGroup ? 'Sửa nhóm' : 'Thêm nhóm mới'}</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        width={600}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleSubmit} loading={submitting}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>
            {editingGroup ? 'Cập nhật' : 'Tạo mới'}
          </Button>,
        ]}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: spaceMd }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}>
            <Form.Item name="name" label="Tên nhóm"
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}>
              <Input placeholder="vd: Nhóm Quản lý" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="code" label="Mã nhóm"
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập mã nhóm' }]}>
              <Input placeholder="vd: QL01" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="description" label="Mô tả"
              style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={3} placeholder="Mô tả nhóm (tùy chọn)" style={{ borderRadius: radiusPill }} />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>`;

result = result.replace(modalOpen, newModal);

writeFileSync(targetPath, result, 'utf-8');
console.log('File written successfully');
console.log('Result length:', result.length);
