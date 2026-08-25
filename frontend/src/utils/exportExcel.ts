export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportTableToExcel(
  columns: ExportColumn[],
  data: Record<string, any>[],
  filename: string = 'export'
) {
  if (!data || data.length === 0) {
    return;
  }

  const headers = columns.map((c) => `"${(c.header || '').replace(/"/g, '""')}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
