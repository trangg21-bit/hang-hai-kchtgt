import api from './api';

// ============================================================
// Types
// ============================================================
export interface IntegrationConnection {
  id: string;
  accountName: string;
  connectionName: string;
  senderSystem: string;
  receiverSystem: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationTransaction {
  id: string;
  connectionId: string;
  type: string;
  name: string;
  referenceNumber?: string;
  sentAt?: string;
  purpose?: string;
  organizationUnit?: string;
  sender?: string;
  receivedAt?: string;
  receiverCode?: string;
  sentContent?: string;
  receivedContent?: string;
}

export interface DataSharingLog {
  id: string;
  transactionCode: string;
  accountName: string;
  connectionName: string;
  senderSystem: string;
  receiverSystem: string;
  status: string;
  detailContent?: string;
  createdAt: string;
}

// ============================================================
// Helpers
// ============================================================
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

// ============================================================
// Service
// ============================================================
export const interconnectService = {
  /**
   * GET /api/lien-thong/tich-hop
   * Danh sách kết nối tích hợp
   */
  async listIntegrations(params?: {
    connectionName?: string;
    senderSystem?: string;
    status?: string;
  }): Promise<IntegrationConnection[]> {
    const resp = await api.get('/lien-thong/tich-hop', { params });
    return extractData<IntegrationConnection[]>(resp) || [];
  },

  /**
   * GET /api/lien-thong/tich-hop/{id}/lich-su
   * Lịch sử giao dịch của một kết nối
   */
  async getTransactionHistory(
    id: string,
    params?: {
      type?: string;
      referenceNumber?: string;
      from?: string;
      to?: string;
      receiverCode?: string;
      transactionId?: string;
      purpose?: string;
    },
  ): Promise<IntegrationTransaction[]> {
    const resp = await api.get(`/lien-thong/tich-hop/${id}/lich-su`, { params });
    return extractData<IntegrationTransaction[]>(resp) || [];
  },

  /**
   * GET /api/lien-thong/tich-hop/lich-su/{id}/noi-dung-gui
   * Nội dung gửi của một giao dịch
   */
  async getSentContent(id: string): Promise<string> {
    const resp = await api.get(`/lien-thong/tich-hop/lich-su/${id}/noi-dung-gui`);
    const data = extractData<string>(resp);
    return data ?? '';
  },

  /**
   * GET /api/lien-thong/tich-hop/lich-su/{id}/noi-dung-nhan
   * Nội dung nhận của một giao dịch
   */
  async getReceivedContent(id: string): Promise<string> {
    const resp = await api.get(`/lien-thong/tich-hop/lich-su/${id}/noi-dung-nhan`);
    const data = extractData<string>(resp);
    return data ?? '';
  },

  /**
   * PUT /api/lien-thong/tich-hop/{id}
   * Cập nhật thông tin kết nối
   */
  async updateConnection(
    id: string,
    payload: { connectionName?: string; password?: string; status?: string },
  ): Promise<IntegrationConnection> {
    const resp = await api.put(`/lien-thong/tich-hop/${id}`, payload);
    return extractData<IntegrationConnection>(resp);
  },

  /**
   * GET /api/lien-thong/chia-se
   * Danh sách nhật ký chia sẻ dữ liệu
   */
  async listSharingLogs(): Promise<DataSharingLog[]> {
    const resp = await api.get('/lien-thong/chia-se');
    return extractData<DataSharingLog[]>(resp) || [];
  },

  /**
   * GET /api/lien-thong/chia-se/{id}
   * Chi tiết nhật ký chia sẻ dữ liệu
   */
  async getSharingLogDetail(id: string): Promise<DataSharingLog> {
    const resp = await api.get(`/lien-thong/chia-se/${id}`);
    return extractData<DataSharingLog>(resp);
  },
};
