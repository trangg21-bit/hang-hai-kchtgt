import api from './api';

export interface Bcc157CreateRequest {
  orgUnitId: string;
  reportYear: number;
  nguonDuLieu?: string;

  // Section 1: Nguyên giá
  openingOriginalCostCode?: string;
  assetOpeningOriginalCost?: number;
  originalCostIncreaseCode?: string;
  assetOriginalCostIncrease?: number;
  originalCostDecreaseCode?: string;
  assetOriginalCostDecrease?: number;
  closingOriginalCostCode?: string;
  assetClosingOriginalCost?: number;

  // Section 2: Giá trị hao mòn lũy kế
  openingAccumulatedDepreciationCode?: string;
  assetOpeningAccumulatedDepreciation?: number;
  depreciationIncreaseCode?: string;
  assetDepreciationIncrease?: number;
  depreciationDecreaseCode?: string;
  assetDepreciationDecrease?: number;
  closingDepreciationCode?: string;
  assetClosingDepreciation?: number;

  // Section 3: Giá trị còn lại
  openingResidualValueCode?: string;
  assetOpeningResidualValue?: number;
  closingResidualValueCode?: string;
  assetClosingResidualValue?: number;
}

export interface Bcc157Response {
  id: string;
  orgUnitId: string;
  reportYear: number;
  nguonDuLieu: string;
  status: string;

  openingOriginalCostCode?: string;
  assetOpeningOriginalCost?: number;
  originalCostIncreaseCode?: string;
  assetOriginalCostIncrease?: number;
  originalCostDecreaseCode?: string;
  assetOriginalCostDecrease?: number;
  closingOriginalCostCode?: string;
  assetClosingOriginalCost?: number;

  openingAccumulatedDepreciationCode?: string;
  assetOpeningAccumulatedDepreciation?: number;
  depreciationIncreaseCode?: string;
  assetDepreciationIncrease?: number;
  depreciationDecreaseCode?: string;
  assetDepreciationDecrease?: number;
  closingDepreciationCode?: string;
  assetClosingDepreciation?: number;

  openingResidualValueCode?: string;
  assetOpeningResidualValue?: number;
  closingResidualValueCode?: string;
  assetClosingResidualValue?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface Bcc157SearchParams {
  orgUnitId?: string;
  reportYear?: number;
  nguonDuLieu?: string;
}

export const bcc157Service = {
  /**
   * Create a new BCC_157 report
   */
  async create(data: Bcc157CreateRequest): Promise<Bcc157Response> {
    const res = await api.post('/v1/bcc157', data);
    return res.data.data;
  },

  /**
   * Search BCC_157 reports with optional filters
   */
  async search(params: Bcc157SearchParams): Promise<Bcc157Response[]> {
    const res = await api.get('/v1/bcc157', { params });
    return res.data.data;
  },

  /**
   * Get a BCC_157 report by id
   */
  async getById(id: string): Promise<Bcc157Response> {
    const res = await api.get(`/v1/bcc157/${id}`);
    return res.data.data;
  },

  /**
   * Delete a BCC_157 report by id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/v1/bcc157/${id}`);
  },
};
