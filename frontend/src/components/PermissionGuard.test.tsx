import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermissionGuard from './PermissionGuard';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

// Mock permissions store
vi.mock('../stores/permissionsStore', () => ({
  usePermissionsStore: vi.fn(),
}));

import { usePermissionsStore } from '../stores/permissionsStore';

describe('PermissionGuard Component', () => {
  const mockHasPermission = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePermissionsStore).mockReturnValue({
      hasPermission: mockHasPermission,
      userPermissions: new Set(['USER_READ', 'USER_WRITE']),
    } as any);
  });

  it('renders children when user has permission', () => {
    mockHasPermission.mockReturnValue(true);

    render(
      <PermissionGuard permission="USER_READ">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks permission', () => {
    mockHasPermission.mockReturnValue(false);

    render(
      <PermissionGuard permission="USER_DELETE">
        <div>Should not render</div>
      </PermissionGuard>
    );

    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it('renders null when no fallback provided and no permission', () => {
    mockHasPermission.mockReturnValue(false);

    render(
      <PermissionGuard permission="USER_DELETE">
        <div>Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders custom fallback component', () => {
    mockHasPermission.mockReturnValue(false);

    const CustomFallback = () => <div data-testid="custom-fallback">Not Authorized</div>;

    render(
      <PermissionGuard permission="USER_DELETE" fallback={<CustomFallback />}>
        <div>Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Not Authorized')).toBeInTheDocument();
  });

  it('renders when any of multiple permissions is met', () => {
    mockHasPermission
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    render(
      <PermissionGuard permissions={['USER_DELETE', 'USER_WRITE']}>
        <div data-testid="granted">Granted</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('granted')).toBeInTheDocument();
  });

  it('does not render when none of multiple permissions is met', () => {
    mockHasPermission.mockReturnValue(false);

    render(
      <PermissionGuard permissions={['USER_DELETE', 'ADMIN_ONLY']}>
        <div>Should not render</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
  });

  it('renders when all permissions required (and all are met)', () => {
    mockHasPermission
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);

    render(
      <PermissionGuard
        permissions={['USER_READ', 'USER_WRITE']}
        requireAll
      >
        <div data-testid="all-met">All Met</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('all-met')).toBeInTheDocument();
  });

  it('does not render when not all permissions required are met', () => {
    mockHasPermission
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    render(
      <PermissionGuard
        permissions={['USER_READ', 'USER_WRITE']}
        requireAll
      >
        <div>Should not render</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
  });

  it('renders children for role-based check', () => {
    vi.mocked(usePermissionsStore).mockReturnValue({
      hasRole: (role: string) => role === 'system-admin',
      hasPermission: () => false,
      userPermissions: new Set(),
      userRoles: new Set(['system-admin']),
    } as any);

    render(
      <PermissionGuard role="system-admin">
        <div data-testid="admin-content">Admin Only</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });

  it('renders fallback when role check fails', () => {
    vi.mocked(usePermissionsStore).mockReturnValue({
      hasRole: (role: string) => role === 'system-admin',
      hasPermission: () => false,
      userPermissions: new Set(),
      userRoles: new Set(['user']),
    } as any);

    render(
      <PermissionGuard role="system-admin">
        <div>Content</div>
      </PermissionGuard>
    );

    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it('passes custom render function for denied state', () => {
    mockHasPermission.mockReturnValue(false);

    const renderDenied = () => <div data-testid="custom-denied">Denied Custom</div>;

    render(
      <PermissionGuard permission="USER_DELETE" renderDenied={renderDenied}>
        <div>Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('custom-denied')).toBeInTheDocument();
    expect(screen.getByText('Denied Custom')).toBeInTheDocument();
  });

  it('passes children when no permission prop and no role prop', () => {
    render(
      <PermissionGuard>
        <div data-testid="always-visible">Always Visible</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('always-visible')).toBeInTheDocument();
  });

  it('shows loading state briefly (if loading prop exists)', () => {
    render(
      <PermissionGuard permission="USER_READ" loading>
        <div>Content</div>
      </PermissionGuard>
    );

    // Should render children when loading=true (optimistic rendering)
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('checks exact permission code match', () => {
    mockHasPermission.mockReturnValue(false);

    render(
      <PermissionGuard permission="USER_FULL_ACCESS">
        <div>Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    expect(mockHasPermission).toHaveBeenCalledWith('USER_FULL_ACCESS');
  });
});
