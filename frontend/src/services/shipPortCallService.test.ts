import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { shipPortCallCRUD } from './shipPortCallService';
import type { CreateShipPortCallRequest, ShipPortCallListParams } from '../types/shipPortCall';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

/**
 * ShipPortCallService unit tests (M-025 / F-300).
 * Mocks the HTTP layer (services/api.ts); exercises the REAL shipPortCallService.ts —
 * asserts query-param mapping của bộ lọc list, unwrap envelope và payload create pass-through.
 */
describe('shipPortCallCRUD Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('maps every list filter to the correct GET query param', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            content: [
              {
                id: '1',
                orgUnitId: 'org-1',
                orgUnitName: 'Cảng vụ Hải Phòng',
                reportDate: '2026-09-01',
                reportCode: 'SPC-0001',
                reportName: 'Báo cáo tháng 9',
                reportPeriod: '2026-09',
                shipName: 'Tàu Hoa Sen',
              },
            ],
            totalElements: 1,
            number: 0,
            size: 20,
          },
        },
      };
      (api.get as any).mockResolvedValueOnce(mockResponse);

      const params: ShipPortCallListParams = {
        page: 0,
        size: 20,
        orgUnitId: 'org-1',
        keyword: 'Hoa Sen',
        reportDateFrom: '2026-09-01',
        reportDateTo: '2026-09-30',
        arrivalDateFrom: '2026-09-02',
        arrivalDateTo: '2026-09-29',
        departureDateFrom: '2026-09-03',
        departureDateTo: '2026-09-28',
      };
      const result = await shipPortCallCRUD.list(params);

      expect(api.get).toHaveBeenCalledWith('/v1/ship-port-call', {
        params: {
          page: 0,
          size: 20,
          orgUnitId: 'org-1',
          keyword: 'Hoa Sen',
          reportDateFrom: '2026-09-01',
          reportDateTo: '2026-09-30',
          arrivalDateFrom: '2026-09-02',
          arrivalDateTo: '2026-09-29',
          departureDateFrom: '2026-09-03',
          departureDateTo: '2026-09-28',
        },
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].shipName).toBe('Tàu Hoa Sen');
      expect(result.total).toBe(1);
    });

    it('omits empty/undefined filters and defaults page/size', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: { content: [], totalElements: 0 } },
      });

      const result = await shipPortCallCRUD.list({ orgUnitId: '', keyword: undefined });

      expect(api.get).toHaveBeenCalledWith('/v1/ship-port-call', {
        params: { page: 0, size: 20 },
      });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('falls back to total 0 when the envelope has no total field', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: [{ id: '1', orgUnitId: 'org-1' }] },
      });

      const result = await shipPortCallCRUD.list({ page: 0, size: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('posts the trimmed 45-field payload unchanged and unwraps the created record', async () => {
      // Payload được page xây sau khi trim (tên field/giá trị đúng ma trận lean-spec §4.2).
      const payload: CreateShipPortCallRequest = {
        orgUnitId: 'org-1',
        reportDate: '2026-09-01',
        shipName: 'Tàu Hoa Sen',
        callSign: 'XVLS',
        imoNumber: '9123456',
        nationality: 'Việt Nam',
        exportTons: 120.5,
        exportTeus: 10,
        transshipmentTons: 50,
        transshipmentTeus: 4,
        arrivalDate: '2026-09-01',
        departureDate: '2026-09-03',
        islandRoute: 'YES',
        dangerousGoods: 'NO',
        enterpriseCode: 'EP-001',
      };
      (api.post as any).mockResolvedValueOnce({
        data: { success: true, data: { id: '123', ...payload } },
      });

      const result = await shipPortCallCRUD.create(payload);

      expect(api.post).toHaveBeenCalledWith('/v1/ship-port-call', payload);
      expect(result?.id).toBe('123');
      expect(result?.shipName).toBe('Tàu Hoa Sen');
      // Service không thêm/tái tạo khoảng trắng hay field nào ngoài payload đã trim.
      expect(result?.enterpriseCode).toBe('EP-001');
    });

    it('returns null when the envelope data is empty', async () => {
      (api.post as any).mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      const result = await shipPortCallCRUD.create({
        orgUnitId: 'org-1',
        reportDate: '2026-09-01',
        shipName: 'Tàu Hoa Sen',
      });
      expect(api.post).toHaveBeenCalledWith(
        '/v1/ship-port-call',
        expect.objectContaining({ shipName: 'Tàu Hoa Sen' }),
      );
      expect(result).toBeNull();
    });
  });
});
