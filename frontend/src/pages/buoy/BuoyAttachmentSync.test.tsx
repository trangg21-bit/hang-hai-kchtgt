import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { useAuthStore, type User } from '../../store/authStore';
import { buoyCRUD } from '../../services/beaconService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Buoy Attachment Flow Synchronized (/buoys)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockUser: User = {
      id: 'user-admin',
      userId: 'user-admin',
      username: 'admin',
      fullName: 'Cán bộ quản lý',
      role: 'ADMIN',
      status: 'ACTIVE',
      permissions: ['*'],
    };
    useAuthStore.setState({
      user: mockUser,
    });
  });

  const sampleAttachments = [
    {
      id: 'att-pdf-buoy-1',
      fileName: 'thong-so-ky-thuat-phao-tieu.pdf',
      fileSize: 1024 * 600,
      fileType: 'application/pdf',
      uploadedByName: 'Trần Văn Phao',
      uploadedDate: '2026-03-01T10:00:00Z',
    },
    {
      id: 'att-img-buoy-1',
      fileName: 'hinh-anh-thuc-te-phao.png',
      fileSize: 1024 * 350,
      fileType: 'image/png',
      uploadedByName: 'Nguyễn Văn Tiêu',
      uploadedDate: '2026-03-02T11:00:00Z',
    },
    {
      id: 'att-doc-buoy-1',
      fileName: 'bien-ban-nghiem-thu-phao.docx',
      fileSize: 1024 * 400,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedByName: 'Lê Văn Kiểm',
      uploadedDate: '2026-03-03T12:00:00Z',
    },
  ];

  it('renders standard readonly attachments in detail drawer (matching BeaconStation layout)', () => {
    const html = renderToStaticMarkup(
      <InfrastructureAttachmentTab
        attachments={sampleAttachments}
        readonly={true}
        readonlyBerthLayout={true}
      />
    );

    // Verify PDF filename, tooltip, and preview button
    expect(html).toContain('thong-so-ky-thuat-phao-tieu.pdf');
    expect(html).toContain('Nhấp để xem trước PDF');
    expect(html).toContain('title="Xem trước PDF"');

    // Verify Image preview button
    expect(html).toContain('hinh-anh-thuc-te-phao.png');
    expect(html).toContain('Nhấp để xem chi tiết ảnh');
    expect(html).toContain('title="Xem chi tiết ảnh"');

    // Verify Word doc download
    expect(html).toContain('bien-ban-nghiem-thu-phao.docx');
    expect(html).toContain('Nhấp để tải xuống');
  });

  it('renders standard editable attachments in create/update drawer (readonly=false)', () => {
    const html = renderToStaticMarkup(
      <InfrastructureAttachmentTab
        attachments={sampleAttachments}
        readonly={false}
      />
    );

    expect(html).toContain('title="Xem trước PDF"');
    expect(html).toContain('title="Xem chi tiết ảnh"');
    expect(html).toContain('title="Tải xuống tệp đính kèm"');
    expect(html).toContain('title="Xóa tệp đính kèm"');
  });

  it('buoyCRUD attachment methods call /buoys endpoints properly', async () => {
    const mockFiles = [new File(['dummy content'], 'test-buoy.pdf', { type: 'application/pdf' })];

    // 1. Upload
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });
    await buoyCRUD.uploadAttachments('buoy-123', mockFiles);
    expect(api.post).toHaveBeenCalledWith(
      '/buoys/buoy-123/attachments',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
    );

    // 2. List
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { data: [{ id: 'att-1', fileName: 'test-buoy.pdf' }] },
    });
    const list = await buoyCRUD.listAttachments('buoy-123');
    expect(api.get).toHaveBeenCalledWith('/buoys/buoy-123/attachments');
    expect(list).toEqual([{ id: 'att-1', fileName: 'test-buoy.pdf' }]);

    // 3. Delete
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });
    await buoyCRUD.deleteAttachment('buoy-123', 'att-1');
    expect(api.delete).toHaveBeenCalledWith('/buoys/buoy-123/attachments/att-1');

    // 4. Download
    const mockBlob = new Blob(['mock binary'], { type: 'application/pdf' });
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockBlob });
    const downloadedBlob = await buoyCRUD.downloadAttachment('buoy-123', 'att-1');
    expect(api.get).toHaveBeenCalledWith(
      '/buoys/buoy-123/attachments/att-1/download',
      { responseType: 'blob' }
    );
    expect(downloadedBlob).toBe(mockBlob);
  });
});
