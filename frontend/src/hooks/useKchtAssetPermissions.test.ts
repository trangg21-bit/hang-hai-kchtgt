import * as React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { usePermissionStore } from '../store/permissionStore';
import { useAssetPermissions } from './useAssetPermissions';

function renderAssetPermissions(resource: string | string[]) {
  let result: ReturnType<typeof useAssetPermissions> | undefined;
  function TestComponent() {
    result = useAssetPermissions(resource);
    return null;
  }
  renderToStaticMarkup(React.createElement(TestComponent));
  if (!result) throw new Error('Hook did not return permissions');
  return result;
}

describe('useAssetPermissions', () => {
  beforeEach(() => {
    usePermissionStore.setState({ permissions: [] });
  });

  it('does not turn manage, approval, or read into update permission', () => {
    usePermissionStore.setState({
      permissions: ['cctv:manage', 'cctv:read', 'cctv:approvec2'],
    });

    const permissions = renderAssetPermissions(['cctv', 'cctvasset']);
    expect(permissions.canRead).toBe(true);
    expect(permissions.canUpdate).toBe(false);
  });

  it('shows update only for an explicit update permission', () => {
    usePermissionStore.setState({ permissions: ['cctv:update'] });

    expect(renderAssetPermissions(['cctv', 'cctvasset']).canUpdate).toBe(true);
  });

  it('does not turn manage or read into history permission', () => {
    usePermissionStore.setState({
      permissions: ['cctv:manage', 'cctv:read', 'cctvasset:read'],
    });

    const permissions = renderAssetPermissions(['cctv', 'cctvasset']);
    expect(permissions.canRead).toBe(true);
    expect(permissions.canHistory).toBe(false);
  });

  it('shows history only for an explicit history permission', () => {
    usePermissionStore.setState({ permissions: ['cctv:history'] });

    expect(renderAssetPermissions(['cctv', 'cctvasset']).canHistory).toBe(true);
  });
});
