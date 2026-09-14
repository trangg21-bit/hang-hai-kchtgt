import React from 'react';
import { radiusPill, statusDraft } from '../../../themetokenchk';
import { APPROVAL_MAP } from './status-map.constants';

/**
 * Helper render badge trạng thái phê duyệt chuẩn hệ thống Hàng hải KCHTGT
 */
export const renderApprovalStatusBadge = (status?: string | null) => {
  if (!status) {
    return <span>—</span>;
  }
  const statusInfo = APPROVAL_MAP[status.toUpperCase()] ?? {
    color: statusDraft,
    label: status,
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 12px',
        borderRadius: radiusPill,
        fontSize: 13,
        fontWeight: 600,
        background: `${statusInfo.color}18`,
        border: `1px solid ${statusInfo.color}50`,
        color: statusInfo.color,
        whiteSpace: 'nowrap',
        lineHeight: '18px',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: statusInfo.color,
          flexShrink: 0,
        }}
      />
      {statusInfo.label}
    </span>
  );
};
