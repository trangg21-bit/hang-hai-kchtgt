import api from '../../../services/api';
import type {
  DryPort,
  DryPortFilterParams,
  CreateDryPortRequest,
  UpdateDryPortRequest,
  DryPortAttachment,
} from './types';
import toast from '../../../components/ToastNotification';

export interface DryPortListResponse {
  data: DryPort[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchDryPortList(params: DryPortFilterParams): Promise<DryPortListResponse> {
  const query: Record<string, any> = {
    page: (params.page ?? 1) - 1,
    size: params.size ?? 20,
    search: params.search || undefined,
    code: params.code || undefined,
    orgUnitId: params.orgUnitId && params.orgUnitId !== '__all__' ? params.orgUnitId : undefined,
    provinceId: params.provinceId,
    region: params.region || undefined,
    portStatus: params.portStatus,
    transportCorridor: params.transportCorridor || undefined,
    approvalStatus: params.approvalStatus || undefined,
    updatedFrom: params.updatedFrom,
    updatedTo: params.updatedTo,
  };

  Object.keys(query).forEach((key) => {
    if (query[key] === undefined || query[key] === null || query[key] === '') {
      delete query[key];
    }
  });

  const res = await api.get('/v1/dry-ports', { params: query });
  const pageData = res.data?.data ?? res.data;
  return {
    data: Array.isArray(pageData?.content) ? pageData.content : Array.isArray(pageData?.data) ? pageData.data : [],
    total: pageData?.totalElements ?? pageData?.total ?? 0,
    page: (pageData?.number ?? 0) + 1,
    pageSize: pageData?.size ?? 20,
  };
}

export async function fetchDryPortById(id: string): Promise<DryPort> {
  const res = await api.get(`/v1/dry-ports/${id}`);
  return res.data?.data ?? res.data;
}

export async function generateDryPortCode(): Promise<string> {
  const res = await api.get('/v1/dry-ports/generate-code');
  return res.data?.data?.code ?? res.data?.data?.dryPortCode ?? '';
}

export async function createDryPort(data: CreateDryPortRequest): Promise<DryPort> {
  const res = await api.post('/v1/dry-ports', data);
  return res.data?.data ?? res.data;
}

export async function updateDryPort(data: UpdateDryPortRequest): Promise<DryPort> {
  const res = await api.put('/v1/dry-ports', data);
  return res.data?.data ?? res.data;
}

export async function deleteDryPort(id: string): Promise<void> {
  await api.delete(`/v1/dry-ports/${id}`);
}

export async function submitDryPort(id: string): Promise<void> {
  await api.put(`/v1/dry-ports/${id}/submit`);
}

export async function approveDryPort(id: string): Promise<void> {
  await api.post(`/v1/dry-ports/${id}/approve`);
}

export async function approveDryPortC1(id: string, reason?: string): Promise<void> {
  await api.post(`/v1/dry-ports/${id}/approve/c1`, null, { params: { reason } });
}

export async function approveDryPortC2(id: string, reason?: string): Promise<void> {
  await api.post(`/v1/dry-ports/${id}/approve/c2`, null, { params: { reason } });
}

export async function rejectDryPort(id: string, reason: string): Promise<void> {
  await api.post(`/v1/dry-ports/${id}/reject`, null, { params: { reason } });
}

export async function fetchDryPortHistory(id: string, params?: { page?: number; size?: number }): Promise<any> {
  const res = await api.get(`/v1/dry-ports/${id}/history`, { params });
  return res.data?.data ?? res.data;
}

export async function fetchDryPortAllHistory(params?: { page?: number; size?: number }): Promise<any> {
  const res = await api.get('/v1/dry-ports/history/all', { params });
  return res.data?.data ?? res.data;
}

// ── Attachments API ──────────────────────────────────────────────

export async function fetchDryPortAttachmentList(dryPortId: string): Promise<DryPortAttachment[]> {
  try {
    const res = await api.get(`/v1/dry-ports/${dryPortId}/attachments`);
    const list = res.data?.data ?? res.data;
    if (Array.isArray(list)) return list;
  } catch {
    // fallback sang documents nếu server chưa migrate
  }
  try {
    const [res1, res2] = await Promise.allSettled([
      api.get(`/v1/documents/entity/dryport/${dryPortId}`, { params: { page: 0, size: 50 } }),
      api.get(`/v1/documents/entity/dry-port/${dryPortId}`, { params: { page: 0, size: 50 } }),
    ]);
    const atts1 = res1.status === 'fulfilled' ? (res1.value.data?.data?.content || res1.value.data?.data || []) : [];
    const atts2 = res2.status === 'fulfilled' ? (res2.value.data?.data?.content || res2.value.data?.data || []) : [];
    return [
      ...(Array.isArray(atts1) ? atts1 : []),
      ...(Array.isArray(atts2) ? atts2 : []).filter((b: any) => !(Array.isArray(atts1) ? atts1 : []).some((a: any) => a.id === b.id)),
    ];
  } catch {
    return [];
  }
}

export async function uploadDryPortAttachments(dryPortId: string, files: any[]): Promise<number> {
  const newFiles = (files || []).filter((f: any) => f && (f.originFileObj || f instanceof File));
  if (newFiles.length === 0) return 0;
  const formData = new FormData();
  newFiles.forEach((fi: any) => {
    formData.append('files', (fi.originFileObj || fi) as File);
  });
  try {
    await api.post(`/v1/dry-ports/${dryPortId}/attachments`, formData, {
      headers: { 'Content-Type': undefined },
    });
    return newFiles.length;
  } catch {
    // Fallback sang documents nếu attachments endpoint chưa phản hồi
    let count = 0;
    for (const f of newFiles) {
      const rawFile = (f.originFileObj || f) as File;
      try {
        const fd = new FormData();
        fd.append('file', rawFile);
        await api.post(`/v1/documents/upload/dryport/${dryPortId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        count++;
      } catch (e) {
        console.error(e);
      }
    }
    return count;
  }
}

export async function deleteDryPortAttachment(dryPortId: string, attId: string): Promise<void> {
  try {
    await api.delete(`/v1/dry-ports/${dryPortId}/attachments/${attId}`);
  } catch {
    await api.delete(`/v1/documents/${attId}`).catch(() => {});
  }
}

export async function downloadDryPortAttachment(dryPortId: string, attId: string, fileName?: string): Promise<void> {
  try {
    const res = await api.get(`/v1/dry-ports/${dryPortId}/attachments/${attId}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    toast.error(`Không thể tải xuống tệp: ${fileName || ''}`);
  }
}
