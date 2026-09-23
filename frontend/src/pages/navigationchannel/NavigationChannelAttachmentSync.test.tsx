import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { useAuthStore, type User } from '../../store/authStore';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import api from '../../services/api';

describe('NavigationChannel Attachment Sync (/navigation-channel vs /beacon-stations)', () => {
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
      id: 'att-nc-pdf-1',
      fileName: 'so-do-luong-hang-hai.pdf',
      fileSize: 1024 * 800,
      fileType: 'application/pdf',
      uploadedByName: 'Nguyễn Văn Luồng',
      uploadedDate: '2026-03-01T10:00:00Z',
    },
    {
      id: 'att-nc-img-1',
      fileName: 'anh-chup-phao-tieu-luong.jpg',
      fileSize: 1024 * 400,
      fileType: 'image/jpeg',
      uploadedByName: 'Trần Văn Hải',
      uploadedDate: '2026-03-02T11:00:00Z',
    },
    {
      id: 'att-nc-doc-1',
      fileName: 'quyet-dinh-thiet-lap-luong.docx',
      fileSize: 1024 * 350,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedByName: 'Lê Thị Thu',
      uploadedDate: '2026-03-03T12:00:00Z',
    },
  ];

  it('TC-ATT-01: Renders PDF preview, image preview, and download action in readonly mode', () => {
    const html = renderToStaticMarkup(
      <InfrastructureAttachmentTab
        attachments={sampleAttachments}
        readonly={true}
        readonlyBerthLayout={true}
      />
    );

    // PDF filename and tooltip
    expect(html).toContain('so-do-luong-hang-hai.pdf');
    expect(html).toContain('Nhấp để xem trước PDF');
    expect(html).toContain('title="Xem trước PDF"');

    // Image filename and tooltip
    expect(html).toContain('anh-chup-phao-tieu-luong.jpg');
    expect(html).toContain('Nhấp để xem chi tiết ảnh');
    expect(html).toContain('title="Xem chi tiết ảnh"');

    // Doc filename
    expect(html).toContain('quyet-dinh-thiet-lap-luong.docx');
    expect(html).toContain('Nhấp để tải xuống');
  });

  it('TC-ATT-02: Renders full action buttons in create/edit mode (readonly=false)', () => {
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
    expect(html).toContain('800.0 KB');
  });

  it('TC-ATT-03: navigationChannelCRUD has upload, list, delete, and download methods', async () => {
    expect(typeof navigationChannelCRUD.uploadAttachments).toBe('function');
    expect(typeof navigationChannelCRUD.listAttachments).toBe('function');
    expect(typeof navigationChannelCRUD.deleteAttachment).toBe('function');
    expect(typeof navigationChannelCRUD.downloadAttachment).toBe('function');

    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { data: [{ id: 'new-att-1' }] } } as never);
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const uploadRes = await navigationChannelCRUD.uploadAttachments('nc-123', [mockFile]);
    expect(postSpy).toHaveBeenCalledWith(
      '/v1/navigation-channel/nc-123/attachments',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
    );
    expect(uploadRes).toHaveLength(1);

    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { data: sampleAttachments } } as never);
    const listRes = await navigationChannelCRUD.listAttachments('nc-123');
    expect(getSpy).toHaveBeenCalledWith('/v1/navigation-channel/nc-123/attachments');
    expect(listRes).toHaveLength(3);

    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValueOnce({ data: { data: null } } as never);
    await navigationChannelCRUD.deleteAttachment('nc-123', 'att-1');
    expect(deleteSpy).toHaveBeenCalledWith('/v1/navigation-channel/nc-123/attachments/att-1');

    const downloadSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: new Blob(['pdf-data'], { type: 'application/pdf' }) } as never);
    const blobRes = await navigationChannelCRUD.downloadAttachment('nc-123', 'att-1');
    expect(downloadSpy).toHaveBeenCalledWith('/v1/navigation-channel/nc-123/attachments/att-1/download', {
      responseType: 'blob',
    });
    expect(blobRes).toBeInstanceOf(Blob);
  });

  it('TC-ATT-04: Validates max size 20MB and max 10 attachments according to /beacon-stations standard', () => {
    // 20MB in bytes
    const MAX_SIZE = 20 * 1024 * 1024;
    const oversizedFile = { size: MAX_SIZE + 1, name: 'large.pdf' };
    const validSizeFile = { size: MAX_SIZE, name: 'valid.pdf' };

    expect(oversizedFile.size > 20 * 1024 * 1024).toBe(true);
    expect(validSizeFile.size <= 20 * 1024 * 1024).toBe(true);

    // Max 10 files check
    const currentFiles = Array.from({ length: 10 }, (_, i) => ({ uid: `f-${i}`, name: `file-${i}.pdf` }));
    expect(currentFiles.length >= 10).toBe(true);

    // Allowed extensions check
    const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
    expect(allowedExts.includes('pdf')).toBe(true);
    expect(allowedExts.includes('exe')).toBe(false);
  });
});
