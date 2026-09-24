import React from 'react';

export function extractHeaderLabel(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (React.isValidElement(value)) {
    if (value.type === 'br') return '\n';
    return extractHeaderLabel((value.props as { children?: React.ReactNode }).children);
  }
  if (Array.isArray(value)) return value.map(extractHeaderLabel).join('');
  return '';
}

export function isStatusOrConditionColumn(column: Record<string, unknown> | undefined): boolean {
  if (!column) return false;
  if (column.type === 'status') return true;
  const key = String(column.key || '').trim().toLowerCase();
  const dataKey = String(column.dataIndex || '').trim().toLowerCase();
  const statusKeys = [
    'status',
    'approvalstatus',
    'approval_status',
    'condition',
    'conditionstatus',
    'condition_status',
    'operationalstatus',
    'operational_status',
    'assetcondition',
    'portstatus',
    'port_status',
    'statusoperation',
    'status_operation',
    'operatingstatus',
    'operating_status',
    'validitystatus',
  ];
  if (statusKeys.includes(key) || statusKeys.includes(dataKey)) return true;

  const rawTitle = extractHeaderLabel(column.title ?? column.label).trim().toLowerCase();
  return rawTitle.includes('trạng thái')
    || rawTitle.includes('tình trạng')
    || rawTitle === 'status'
    || rawTitle === 'condition';
}
