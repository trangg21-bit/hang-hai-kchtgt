import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import { fetchInfraAssetAttachments } from '../../services/assetmovement/api';

interface InfraAssetAttachmentSource {
  id?: string;
  attachmentName?: string;
  updatedByName?: string;
  updatedAt?: string;
}

interface LoadedAttachmentState {
  assetId: string;
  items: InfrastructureAttachmentItem[];
}

const EMPTY_ATTACHMENTS: InfrastructureAttachmentItem[] = [];

function buildLegacyAttachments(
  attachmentName?: string,
  updatedByName?: string,
  updatedAt?: string,
): InfrastructureAttachmentItem[] {
  if (!attachmentName) return EMPTY_ATTACHMENTS;

  return attachmentName.split(',').map((name, index) => ({
    id: `detail-att-${index}`,
    fileName: name.trim(),
    fileSize: 1024 * 1024,
    uploadedByName: updatedByName || '—',
    uploadedDate: updatedAt ? dayjs(updatedAt).toISOString() : dayjs().toISOString(),
  }));
}

export function useInfraAssetDetailAttachments(
  source?: InfraAssetAttachmentSource,
): InfrastructureAttachmentItem[] {
  const assetId = source?.id;
  const attachmentName = source?.attachmentName;
  const updatedByName = source?.updatedByName;
  const updatedAt = source?.updatedAt;
  const [loaded, setLoaded] = useState<LoadedAttachmentState>({
    assetId: '',
    items: EMPTY_ATTACHMENTS,
  });

  useEffect(() => {
    if (!assetId) return undefined;

    let isMounted = true;
    const legacyAttachments = buildLegacyAttachments(
      attachmentName,
      updatedByName,
      updatedAt,
    );

    void fetchInfraAssetAttachments(assetId)
      .then((attachments) => {
        if (!isMounted) return;
        const items = attachments.length > 0
          ? attachments.map((attachment) => ({
              id: attachment.id,
              fileName: attachment.fileName,
              fileSize: attachment.fileSize,
              fileType: attachment.contentType,
              uploadedByName: attachment.uploadedByName || updatedByName || '—',
              uploadedDate:
                attachment.uploadedAt ||
                (updatedAt ? dayjs(updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${assetId}/attachments/${attachment.id}/download`,
            }))
          : legacyAttachments;
        setLoaded({ assetId, items });
      })
      .catch(() => {
        if (isMounted) setLoaded({ assetId, items: legacyAttachments });
      });

    return () => {
      isMounted = false;
    };
  }, [assetId, attachmentName, updatedAt, updatedByName]);

  return assetId && loaded.assetId === assetId ? loaded.items : EMPTY_ATTACHMENTS;
}
