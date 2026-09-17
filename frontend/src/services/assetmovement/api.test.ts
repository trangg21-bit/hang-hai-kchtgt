import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api';
import {
  deleteInfraAssetAttachment,
  isPersistedInfraAssetAttachmentId,
  fetchStationAssets,
  createStationAsset,
  updateStationAsset,
  deleteStationAsset,
  fetchDryPortAssets,
  createDryPortAsset,
  updateDryPortAsset,
  deleteDryPortAsset,
} from './api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('infra asset attachment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call the UUID endpoint for a legacy display-only attachment ID', async () => {
    const legacyAttachmentId = 'att-0-1789110944990';

    expect(isPersistedInfraAssetAttachmentId(legacyAttachmentId)).toBe(false);

    await deleteInfraAssetAttachment(
      '805e43e7-eda1-47dd-8682-a7aa59f3da96',
      legacyAttachmentId,
    );

    expect(api.delete).not.toHaveBeenCalled();
  });

  it('calls the endpoint for a persisted UUID attachment ID', async () => {
    const assetId = '805e43e7-eda1-47dd-8682-a7aa59f3da96';
    const attachmentId = '6fb4b13e-bcf0-4aba-9887-0a2e018ae017';
    vi.mocked(api.delete).mockResolvedValue({
      data: undefined,
    } as Awaited<ReturnType<typeof api.delete>>);

    expect(isPersistedInfraAssetAttachmentId(attachmentId)).toBe(true);

    await deleteInfraAssetAttachment(assetId, attachmentId);

    expect(api.delete).toHaveBeenCalledWith(
      `/v1/asset/infra-assets/${assetId}/attachments/${attachmentId}`,
    );
  });
});

describe('station asset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches station assets with correct query parameters', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { content: [], totalElements: 0 } },
    } as Awaited<ReturnType<typeof api.get>>);

    await fetchStationAssets({ page: 0, size: 20 }, 'LRIT_STATION');

    expect(api.get).toHaveBeenCalledWith(
      '/v1/asset/lrit-assets?page=0&size=20&assetType=LRIT_STATION',
    );
  });

  it('creates, updates and deletes station asset', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { data: { id: 'station-1', assetName: 'Đài LRIT 1' } },
    } as Awaited<ReturnType<typeof api.post>>);
    vi.mocked(api.put).mockResolvedValue({
      data: { data: { id: 'station-1', assetName: 'Đài LRIT 1 cập nhật' } },
    } as Awaited<ReturnType<typeof api.put>>);
    vi.mocked(api.delete).mockResolvedValue({
      data: undefined,
    } as Awaited<ReturnType<typeof api.delete>>);

    const created = await createStationAsset(
      { assetName: 'Đài LRIT 1' } as never,
      'LRIT_STATION',
    );
    expect(created.id).toBe('station-1');
    expect(api.post).toHaveBeenCalledWith('/v1/asset/lrit-assets', {
      assetName: 'Đài LRIT 1',
      assetType: 'LRIT_STATION',
    });

    const updated = await updateStationAsset(
      'station-1',
      { assetName: 'Đài LRIT 1 cập nhật' } as never,
      'LRIT_STATION',
    );
    expect(updated.id).toBe('station-1');
    expect(api.put).toHaveBeenCalledWith('/v1/asset/lrit-assets/station-1', {
      assetName: 'Đài LRIT 1 cập nhật',
      assetType: 'LRIT_STATION',
    });

    await deleteStationAsset('station-1');
    expect(api.delete).toHaveBeenCalledWith('/v1/asset/infra-assets/station-1');
  });
});

describe('dry port asset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches dry port assets with DRY_PORT assetType', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { content: [], totalElements: 0 } },
    } as Awaited<ReturnType<typeof api.get>>);

    await fetchDryPortAssets({ page: 0, size: 10 });

    expect(api.get).toHaveBeenCalledWith(
      '/v1/asset/dry-port-assets?page=0&size=10&assetType=DRY_PORT',
    );
  });

  it('creates, updates and deletes dry port asset', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { data: { id: 'dp-1', assetName: 'Cảng cạn 1' } },
    } as Awaited<ReturnType<typeof api.post>>);
    vi.mocked(api.put).mockResolvedValue({
      data: { data: { id: 'dp-1', assetName: 'Cảng cạn 1 cập nhật' } },
    } as Awaited<ReturnType<typeof api.put>>);
    vi.mocked(api.delete).mockResolvedValue({
      data: undefined,
    } as Awaited<ReturnType<typeof api.delete>>);

    await createDryPortAsset({ assetName: 'Cảng cạn 1' } as never);
    expect(api.post).toHaveBeenCalledWith('/v1/asset/dry-port-assets', {
      assetName: 'Cảng cạn 1',
      assetType: 'DRY_PORT',
    });

    await updateDryPortAsset('dp-1', { assetName: 'Cảng cạn 1 cập nhật' } as never);
    expect(api.put).toHaveBeenCalledWith('/v1/asset/dry-port-assets/dp-1', {
      assetName: 'Cảng cạn 1 cập nhật',
      assetType: 'DRY_PORT',
    });

    await deleteDryPortAsset('dp-1');
    expect(api.delete).toHaveBeenCalledWith('/v1/asset/dry-port-assets/dp-1');
  });
});
