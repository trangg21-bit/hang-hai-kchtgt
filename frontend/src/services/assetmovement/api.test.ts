import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api';
import {
  deleteInfraAssetAttachment,
  isPersistedInfraAssetAttachmentId,
} from './api';

vi.mock('../api', () => ({
  default: {
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
