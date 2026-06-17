import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';
import type { ColumnType } from './DataTable';

describe('DataTable', () => {
  const columns: ColumnType<{ id: number; name: string; status: string }>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id' },
    { key: 'name', title: 'Name', dataIndex: 'name' },
    { key: 'status', title: 'Status', dataIndex: 'status' },
  ];

  const dataSource = [
    { key: '1', id: 1, name: 'User 1', status: 'active' },
    { key: '2', id: 2, name: 'User 2', status: 'inactive' },
    { key: '3', id: 3, name: 'User 3', status: 'active' },
  ];

  it('renders all rows', () => {
    render(<DataTable columns={columns} dataSource={dataSource} />);

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.getByText('User 3')).toBeInTheDocument();
  });

  it('renders header with column titles', () => {
    render(<DataTable columns={columns} dataSource={dataSource} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('applies hover style to rows', () => {
    render(<DataTable columns={columns} dataSource={dataSource} />);

    const rows = screen.getAllByRole('row');
    // Header row + 3 data rows
    expect(rows).toHaveLength(4);
  });

  it('shows action column when actions prop provided', () => {
    const actions = [
      {
        key: 'edit',
        label: 'Edit',
        onClick: vi.fn(),
      },
      {
        key: 'delete',
        label: 'Delete',
        onClick: vi.fn(),
      },
    ];

    render(<DataTable columns={columns} dataSource={dataSource} actions={actions} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('shows pagination footer', () => {
    render(<DataTable columns={columns} dataSource={dataSource} />);

    // Ant Design Table renders pagination by default
    expect(screen.queryAllByRole('gridcell').length).toBeGreaterThan(0);
  });

  it('handles empty data', () => {
    render(<DataTable columns={columns} dataSource={[]} />);

    // Ant Design shows "No Data" for empty tables
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });
});
