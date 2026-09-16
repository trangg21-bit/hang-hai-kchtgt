import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { useAuthStore, type User } from '../../store/authStore';

describe('BeaconStation Attachment PDF Preview (/beacon-stations)', () => {
  beforeEach(() => {
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
      id: 'att-pdf-1',
      fileName: 'ho-so-thiet-ke-den-bien.pdf',
      fileSize: 1024 * 500,
      fileType: 'application/pdf',
      uploadedByName: 'Nguyễn Văn A',
      uploadedDate: '2026-03-01T10:00:00Z',
    },
    {
      id: 'att-img-1',
      fileName: 'hinh-anh-tram-den.jpg',
      fileSize: 1024 * 250,
      fileType: 'image/jpeg',
      uploadedByName: 'Nguyễn Văn B',
      uploadedDate: '2026-03-02T11:00:00Z',
    },
    {
      id: 'att-doc-1',
      fileName: 'bien-ban-kiem-tra.docx',
      fileSize: 1024 * 300,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedByName: 'Nguyễn Văn C',
      uploadedDate: '2026-03-03T12:00:00Z',
    },
  ];

  it('renders PDF file icon and "Nhấp để xem trước PDF" in drawer Xem chi tiết (readonly mode)', () => {
    const html = renderToStaticMarkup(
      <InfrastructureAttachmentTab
        attachments={sampleAttachments}
        readonly={true}
        readonlyBerthLayout={true}
      />
    );

    // PDF filename and tooltip
    expect(html).toContain('ho-so-thiet-ke-den-bien.pdf');
    expect(html).toContain('Nhấp để xem trước PDF');
    // PDF action eye button title
    expect(html).toContain('title="Xem trước PDF"');

    // Image filename and tooltip
    expect(html).toContain('hinh-anh-tram-den.jpg');
    expect(html).toContain('Nhấp để xem chi tiết ảnh');
    expect(html).toContain('title="Xem chi tiết ảnh"');

    // Word doc should have download tooltip, not preview
    expect(html).toContain('bien-ban-kiem-tra.docx');
    expect(html).toContain('Nhấp để tải xuống');
  });

  it('renders "Xem trước PDF" button in drawer Thêm mới/Cập nhật (readonly=false)', () => {
    const html = renderToStaticMarkup(
      <InfrastructureAttachmentTab
        attachments={sampleAttachments}
        readonly={false}
      />
    );

    // Both image and PDF have preview action button
    expect(html).toContain('title="Xem trước PDF"');
    expect(html).toContain('title="Xem chi tiết ảnh"');
    expect(html).toContain('title="Tải xuống tệp đính kèm"');
    expect(html).toContain('title="Xóa tệp đính kèm"');
  });

  it('contains PDF preview modal referenced from /reports/F-161 in markup structure', () => {
    const html = renderToStaticMarkup(
      <InfrastructureAttachmentTab
        attachments={sampleAttachments}
        readonly={true}
      />
    );

    // Should include standard detail table and file size formatting
    expect(html).toContain('ho-so-thiet-ke-den-bien.pdf');
    expect(html).toContain('500.0 KB');
  });

  it('withPdfTitle correctly injects Unicode / Vietnamese /Title metadata via Incremental Update', async () => {
    const { withPdfTitle } = await import('../../components/shared/InfrastructureAttachmentTab');

    // Minimal valid PDF structure
    const rawPdf =
      '%PDF-1.4\n' +
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
      'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n' +
      'trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF\n';

    const pdfBlob = new Blob([rawPdf], { type: 'application/pdf' });
    const title = 'EGENE_HƯỚNG DẪN + BIỂU MẪU.pdf';

    const titledBlob = await withPdfTitle(pdfBlob, title);
    expect(titledBlob).toBeInstanceOf(Blob);
    expect(titledBlob.type).toBe('application/pdf');

    const resultBuffer = await titledBlob.arrayBuffer();
    const resultText = new TextDecoder('latin1').decode(resultBuffer);

    // Verify title object was appended with BOM FEFF
    expect(resultText).toContain('/Title <FEFF');
    // Verify Vietnamese chars encoded in hex
    expect(resultText).toContain('004500470045004E0045005F');
    // Verify xref and trailer incremental update structure
    expect(resultText).toContain('xref\n4 1\n');
    expect(resultText).toContain('/Info 4 0 R');
    expect(resultText).toContain('/Size 5');
    expect(resultText).toContain('/Prev 185');
    expect(resultText).toContain('startxref');
    expect(resultText).toContain('%%EOF');
  });

  it('createNamedPdfUrl generates safe named URL or fallback Blob URL and cleans up gracefully', async () => {
    const { createNamedPdfUrl, cleanupNamedPdfUrl } = await import('../../components/shared/InfrastructureAttachmentTab');

    const pdfBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    const fileName = 'EGENE_HƯỚNG DẪN + BIỂU MẪU.pdf';

    const url = await createNamedPdfUrl(pdfBlob, fileName, 'att-123');
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);

    // Clean up should not throw
    await expect(cleanupNamedPdfUrl(url)).resolves.toBeUndefined();
  });
});


