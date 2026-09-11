import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import { fetchInfraAssetAttachments } from '../../services/assetmovement/api';
import { documentApi } from '../../app/document/api';
import type { DocumentEntityType } from '../../app/document/types';

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
  entityType?: DocumentEntityType,
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

    const fetchInfraPromise = fetchInfraAssetAttachments(assetId);
    const fetchDocPromise = entityType
      ? documentApi.listByEntity(entityType, assetId)
      : Promise.resolve(null);

    Promise.allSettled([fetchInfraPromise, fetchDocPromise])
      .then(([infraRes, docRes]) => {
        if (!isMounted) return;
        const items: InfrastructureAttachmentItem[] = [];
        const seen = new Set<string>();

        if (infraRes.status === 'fulfilled' && Array.isArray(infraRes.value)) {
          for (const attachment of infraRes.value) {
            items.push({
              id: attachment.id,
              fileName: attachment.fileName,
              fileSize: attachment.fileSize,
              fileType: attachment.contentType,
              uploadedByName: attachment.uploadedByName || updatedByName || '—',
              uploadedDate:
                attachment.uploadedAt ||
                (updatedAt ? dayjs(updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${assetId}/attachments/${attachment.id}/download`,
            });
            seen.add(attachment.fileName);
          }
        }

        if (
          docRes.status === 'fulfilled' &&
          docRes.value &&
          Array.isArray(docRes.value.data)
        ) {
          for (const doc of docRes.value.data) {
            if (!seen.has(doc.fileName)) {
              items.push({
                id: doc.id,
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                fileType: doc.mimeType,
                uploadedByName: doc.uploadedBy || updatedByName || '—',
                uploadedDate: doc.createdAt || (updatedAt ? dayjs(updatedAt).toISOString() : dayjs().toISOString()),
                minioKey: doc.minioKey,
                filePath: documentApi.downloadUrl(doc.minioKey),
              });
              seen.add(doc.fileName);
            }
          }
        }

        const resolved = items.length > 0 ? items : legacyAttachments;
        setLoaded({ assetId, items: resolved });
      })
      .catch(() => {
        if (isMounted) setLoaded({ assetId, items: legacyAttachments });
      });

    return () => {
      isMounted = false;
    };
  }, [assetId, attachmentName, updatedAt, updatedByName, entityType]);

  return assetId && loaded.assetId === assetId ? loaded.items : EMPTY_ATTACHMENTS;
}

