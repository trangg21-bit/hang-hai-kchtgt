import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { seaportThroughputService } from './seaportThroughputService';
import type { SeaportThroughputNumbers, SeaportThroughputPayload } from './seaportThroughputService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

/**
 * seaportThroughputService unit tests (M-028 / F-301).
 * Mocks the HTTP layer (services/api.ts); exercises the REAL service —
 * asserts endpoint paths, query-param mapping, envelope unwrap (content/totalElements
 * vs raw array) và payload/FormData pass-through.
 */

/** 24 cột DECIMAL + passenger_trips — mặc định 0 như backend lưu. */
const zeroNumbers = (): SeaportThroughputNumbers => ({
  domesticContainerTon: 0,
  domesticContainerTonKm: 0,
  domesticDryTon: 0,
  domesticDryTonKm: 0,
  domesticLiquidTon: 0,
  domesticLiquidTonKm: 0,
  domesticOtherTon: 0,
  domesticOtherTonKm: 0,
  foreignContainerTon: 0,
  foreignContainerTonKm: 0,
  foreignDryTon: 0,
  foreignDryTonKm: 0,
  foreignLiquidTon: 0,
  foreignLiquidTonKm: 0,
  foreignOtherTon: 0,
  foreignOtherTonKm: 0,
  routeContainerTon: 0,
  routeContainerTonKm: 0,
  routeDryTon: 0,
  routeDryTonKm: 0,
  routeLiquidTon: 0,
  routeLiquidTonKm: 0,
  routeOtherTon: 0,
  routeOtherTonKm: 0,
  passengerTrips: 0,
});

const makePayload = (overrides: Partial<SeaportThroughputPayload> = {}): SeaportThroughputPayload => ({
  orgUnitId: 'org-1',
  reportMonth: '2026-08',
  note: undefined,
  ...zeroNumbers(),
  ...overrides,
});

describe('seaportThroughputService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('maps list filters to GET query params and unwraps the paged envelope', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            content: [
              {
                id: '1',
                orgUnitId: 'org-1',
                orgUnitName: 'Cảng vụ Hải Phòng',
                reportMonth: '2026-08',
                approvalStatus: 'DRAFT',
                updatedDate: '2026-09-01T10:00:00',
                ...zeroNumbers(),
              },
            ],
            totalElements: 1,
          },
        },
      };
      (api.get as any).mockResolvedValueOnce(mockResponse);

      const result = await seaportThroughputService.list({
        orgUnitId: 'org-1',
        keyword: 'Hải Phòng',
        reportMonth: '2026-08',
        updatedFrom: '2026-09-01',
        updatedTo: '2026-09-30',
        approvalStatus: 'DRAFT',
        page: 1,
        size: 10,
      });

      expect(api.get).toHaveBeenCalledWith('/v1/seaport-throughput', {
        params: {
          orgUnitId: 'org-1',
          keyword: 'Hải Phòng',
          reportMonth: '2026-08',
          updatedFrom: '2026-09-01',
          updatedTo: '2026-09-30',
          approvalStatus: 'DRAFT',
          page: 1,
          size: 10,
        },
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].orgUnitName).toBe('Cảng vụ Hải Phòng');
      expect(result.total).toBe(1);
    });

    it('unwraps a raw-array envelope and falls back to total = item count', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: [{ id: '1', orgUnitId: 'org-1' }] },
      });

      const result = await seaportThroughputService.list({ page: 1, size: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('handles empty page envelope (total 0)', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: { content: [], totalElements: 0 } },
      });

      const result = await seaportThroughputService.list({});
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('POSTs the full 25-number payload to the resource and unwraps the created record', async () => {
      const payload = makePayload({ orgUnitId: 'org-2', reportMonth: '2026-09' });
      (api.post as any).mockResolvedValueOnce({
        data: { success: true, data: { id: 'abc', ...payload, approvalStatus: 'DRAFT' } },
      });

      const result = await seaportThroughputService.create(payload);

      expect(api.post).toHaveBeenCalledWith('/v1/seaport-throughput', payload);
      expect(result?.id).toBe('abc');
      expect(result?.approvalStatus).toBe('DRAFT');
      expect(result?.reportMonth).toBe('2026-09');
    });
  });

  describe('update', () => {
    it('PUTs partial payload to /{id}', async () => {
      (api.put as any).mockResolvedValueOnce({
        data: { success: true, data: { id: 'abc', domesticDryTon: 12.5, approvalStatus: 'DRAFT' } },
      });

      const result = await seaportThroughputService.update('abc', { domesticDryTon: 12.5 });
      expect(api.put).toHaveBeenCalledWith('/v1/seaport-throughput/abc', { domesticDryTon: 12.5 });
      expect(result?.domesticDryTon).toBe(12.5);
    });
  });

  describe('lifecycle mutations', () => {
    it('softDelete calls DELETE /{id}', async () => {
      (api.delete as any).mockResolvedValueOnce({ data: { success: true } });
      await seaportThroughputService.softDelete('abc');
      expect(api.delete).toHaveBeenCalledWith('/v1/seaport-throughput/abc');
    });

    it('submit / approve levels POST the action endpoints', async () => {
      (api.post as any)
        .mockResolvedValueOnce({ data: { success: true, data: { id: 'abc', approvalStatus: 'PENDING_APPROVAL' } } })
        .mockResolvedValueOnce({ data: { success: true, data: { id: 'abc', approvalStatus: 'APPROVED_LEVEL1' } } })
        .mockResolvedValueOnce({ data: { success: true, data: { id: 'abc', approvalStatus: 'APPROVED' } } });

      await seaportThroughputService.submit('abc');
      expect(api.post).toHaveBeenNthCalledWith(1, '/v1/seaport-throughput/abc/submit');

      await seaportThroughputService.approveLevel1('abc');
      expect(api.post).toHaveBeenNthCalledWith(2, '/v1/seaport-throughput/abc/approve/c1', { content: undefined });

      await seaportThroughputService.approveLevel2('abc');
      expect(api.post).toHaveBeenNthCalledWith(3, '/v1/seaport-throughput/abc/approve/c2', { content: undefined });
    });

    it('reject trims the reason and posts to the single /reject endpoint (level derived by backend)', async () => {
      (api.post as any).mockResolvedValueOnce({
        data: { success: true, data: { id: 'abc', approvalStatus: 'REJECTED_LEVEL1' } },
      });

      await seaportThroughputService.reject('abc', '  Số liệu chưa khớp hồ sơ  ');
      expect(api.post).toHaveBeenCalledWith('/v1/seaport-throughput/abc/reject', {
        reason: 'Số liệu chưa khớp hồ sơ',
      });
    });
  });

  describe('files & import', () => {
    it('uploadFile posts multipart FormData (field "files") to the module file endpoint', async () => {
      (api.post as any).mockResolvedValueOnce({
        data: { success: true, data: { id: 'f2', fileName: 'bang-tong-hop.pdf' } },
      });
      const file = new File(['data'], 'bang-tong-hop.pdf', { type: 'application/pdf' });

      await seaportThroughputService.uploadFile('abc', file);

      const [url, body, config] = (api.post as any).mock.calls[0];
      expect(url).toBe('/v1/seaport-throughput/abc/files');
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('files')).toBe(file);
      expect(config.headers['Content-Type']).toBe('multipart/form-data');
    });

    it('deleteFile DELETEs /{id}/files/{fileId}', async () => {
      (api.delete as any).mockResolvedValueOnce({ data: { success: true } });
      await seaportThroughputService.deleteFile('abc', 'f2');
      expect(api.delete).toHaveBeenCalledWith('/v1/seaport-throughput/abc/files/f2');
    });

    it('importExcel posts multipart FormData (field "file") to /import and returns the row-error report', async () => {
      (api.post as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            total: 2,
            successCount: 1,
            errorCount: 1,
            errors: [{ row: 3, message: 'Đã tồn tại số liệu sản lượng của đơn vị trong tháng này' }],
          },
        },
      });
      const file = new File(['a,b'], 'so-lieu.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const report = await seaportThroughputService.importExcel(file);

      const [url, body, config] = (api.post as any).mock.calls[0];
      expect(url).toBe('/v1/seaport-throughput/import');
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('file')).toBe(file);
      expect(config.headers['Content-Type']).toBe('multipart/form-data');
      expect(report.errorCount).toBe(1);
      expect(report.errors?.[0]?.row).toBe(3);
    });
  });

  describe('history & getById', () => {
    it('getById GETs /{id} and unwraps data', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: { id: 'abc', orgUnitId: 'org-1' } },
      });
      const record = await seaportThroughputService.getById('abc');
      expect(api.get).toHaveBeenCalledWith('/v1/seaport-throughput/abc');
      expect(record.id).toBe('abc');
    });

    it('history GETs /{id}/history', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: { changeHistory: [] } },
      });
      const resp = await seaportThroughputService.history('abc');
      expect(api.get).toHaveBeenCalledWith('/v1/seaport-throughput/abc/history');
      expect((resp as { changeHistory: unknown[] }).changeHistory).toEqual([]);
    });
  });
});
