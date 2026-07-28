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
   * GET /api/interconnect/integration
   * Danh sách kết nối tích hợp
   */
  async listIntegrations(params?: {
    connectionName?: string;
    senderSystem?: string;
    status?: string;
  }): Promise<IntegrationConnection[]> {
    const resp = await api.get('/interconnect/integration', { params });
    return extractData<IntegrationConnection[]>(resp) || [];
  },

  /**
   * GET /api/interconnect/integration/{id}/history
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
    const resp = await api.get(`/interconnect/integration/${id}/history`, { params });
    return extractData<IntegrationTransaction[]>(resp) || [];
  },

  /**
   * GET /api/interconnect/integration/history/{id}/sent-content
   * Nội dung gửi của một giao dịch
   */
  async getSentContent(id: string): Promise<string> {
    const resp = await api.get(`/interconnect/integration/history/${id}/sent-content`);
    const data = extractData<string>(resp);
    return data ?? '';
  },

  /**
   * GET /api/interconnect/integration/history/{id}/received-content
   * Nội dung nhận của một giao dịch
   */
  async getReceivedContent(id: string): Promise<string> {
    const resp = await api.get(`/interconnect/integration/history/${id}/received-content`);
    const data = extractData<string>(resp);
    return data ?? '';
  },

  /**
   * PUT /api/interconnect/integration/{id}
   * Cập nhật thông tin kết nối
   */
  async updateConnection(
    id: string,
    payload: { connectionName?: string; password?: string; status?: string },
  ): Promise<IntegrationConnection> {
    const resp = await api.put(`/interconnect/integration/${id}`, payload);
    return extractData<IntegrationConnection>(resp);
  },

  /**
   * GET /api/interconnect/sharing
   * Danh sách nhật ký chia sẻ dữ liệu
   */
  async listSharingLogs(): Promise<DataSharingLog[]> {
    const resp = await api.get('/interconnect/sharing');
    return extractData<DataSharingLog[]>(resp) || [];
  },

  /**
   * GET /api/interconnect/sharing/{id}
   * Chi tiết nhật ký chia sẻ dữ liệu
   */
  async getSharingLogDetail(id: string): Promise<DataSharingLog> {
    const resp = await api.get(`/interconnect/sharing/${id}`);
    return extractData<DataSharingLog>(resp);
  },
};
