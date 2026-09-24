import { describe, it, expect, vi, beforeEach } from 'vitest';

const putMock = vi.fn(() => Promise.resolve({ data: { data: {} } }));

vi.mock('./api', () => ({
  default: {
    put: (...args: unknown[]) => putMock(...args),
    post: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    get: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    delete: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}));

import { transferAreaCRUD } from './portService';
import { normalizeClearedFields } from '../pages/transfer-area/transferAreaPayload';

/**
 * Test THẬT cho payload PUT /v1/transfer-area.
 *
 * Phiên bản trước của file này KHÔNG test được gì: nó chép lại `cleanString`/`cleanNumber`/
 * `cleanDecimal` và cả object payload vào thân test rồi assert lên bản sao đó — không import
 * một dòng code production nào. Vì vậy lỗi "xóa trắng trường không lưu được" đã lọt qua
 * (xem docs/JOURNAL.md, mục /berth và /port cùng lớp lỗi này).
 *
 * Bản này dùng đúng hàm `normalizeClearedFields` mà TransferAreaForm.handleSave gọi
 * (frontend/src/pages/transfer-area/TransferAreaPayload.ts) và đúng lớp transferAreaCRUD.
 */
describe('Khu chuyển tải — xóa trắng trường được gửi tới server dưới dạng null', () => {
  beforeEach(() => {
    putMock.mockClear();
  });

  it('TC-CLEAR-AREA-01: PUT body chứa null tường minh cho trường bị xóa trắng', async () => {
    const formValue = {
      orgUnitId: 'ou-1',
      portId: 'port-1',
      transferAreaName: 'Khu chuyển tải A',
      provinceId: 1,
      detailedLocation: undefined,
      shapeDescription: undefined,
      remarks: undefined,
      area: undefined,
      saveAction: 'DRAFT',
    };

    const body = normalizeClearedFields(formValue, { isEdit: true });
    await transferAreaCRUD.update({ ...body, id: 'ta-1' } as never);

    expect(putMock).toHaveBeenCalledTimes(1);
    const [url, sent] = putMock.mock.calls[0] as [string, Record<string, unknown>];

    expect(url).toBe('/v1/transfer-area');
    expect(sent.id).toBe('ta-1');
    expect(sent).toHaveProperty('detailedLocation', null);
    expect(sent).toHaveProperty('shapeDescription', null);
    expect(sent).toHaveProperty('remarks', null);
    expect(sent).toHaveProperty('area', null);
    expect(sent).toHaveProperty('transferAreaName', 'Khu chuyển tải A');
  });

  it('TC-CLEAR-AREA-02: giá trị còn giữ thì không bị null hoá', async () => {
    const body = normalizeClearedFields(
      { remarks: 'vẫn còn', detailedLocation: 'Vị trí B', saveAction: 'SUBMIT' },
      { isEdit: true },
    );
    await transferAreaCRUD.update({ ...body, id: 'ta-2' } as never);

    const [, sent] = putMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(sent.remarks).toBe('vẫn còn');
    expect(sent.detailedLocation).toBe('Vị trí B');
  });
});
