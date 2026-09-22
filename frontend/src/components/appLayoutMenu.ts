import type { Key, ReactNode } from 'react';
import type { MenuProps } from 'antd';

export const MENU_PERMISSION_MAP: Record<string, string | string[]> = {
  // Quản trị hệ thống
  '/users': 'user:read',
  '/organizations': 'orgunit:read',
  '/groups': ['group:read', 'groupmember:read'],
  '/logs': ['log:read', 'log:view'],
  '/history': ['history:read', 'history:view'],
  '/interconnect': ['connection:read', 'interconnect:read'],
  '/connections': ['connection:read', 'interconnect:read'],
  '/settings': 'admin:manage',

  // GIS & Bản đồ
  '/gis/map': 'data:read',
  '/gis/points': ['gispoint:read', 'pointobject:read', 'data:read'],
  '/gis/lines': ['gisline:read', 'lineobject:read', 'data:read'],
  '/gis/polygons': ['gispolygon:read', 'polygonobject:read', 'data:read'],
  '/gis/layers': 'map:manage',
  '/gis/permits': 'data:read',
  '/symbols': 'data:read',

  // Báo cáo
  '/reports': 'report:read',
  '/dashboard': 'report:read',

  // Quy hoạch & Vận hành
  '/documents/legal': 'document:read',
  '/documents/incidents': ['incident:read', 'document:read'],
  '/documents/port-planning': ['portplanning:read', 'document:read'],
  '/documents/operation': ['operationplan:read', 'document:read'],
  '/documents/maintenance': ['maintenanceplan:read', 'document:read'],

  // Quản lý KCHT hàng hải (28 loại KCHT)
  '/port': 'port:read',
  '/berth': 'berth:read',
  '/pier': 'pier:read',
  '/dry-port': 'dryport:read',
  '/water-zone': 'waterzone:read',
  '/anchorage': 'anchorage:read',
  '/transfer-area': 'transferarea:read',
  '/storm-shelter': 'stormshelter:read',
  '/buoy-berth': 'buoyberth:read',
  '/navigation-channel': ['navigationchannel:read', 'channel:read'],
  '/navigation-channel-chk': ['navigationchannel:read', 'channel:read'],
  '/luong-hang-hai': ['navigationchannel:read', 'channel:read'],
  '/luong-hang-hai-chk': ['navigationchannel:read', 'channel:read'],
  '/dike-revetment': 'dikerevetment:read',
  '/buoy-station': 'buoystation:read',
  '/buoys': 'buoy:read',
  '/beacon-stations': ['beaconstation:read', 'lighthouse:read'],
  '/ship-repair-yard': ['shiprepairfacility:read', 'shiprepairyard:read', 'shiprepair:read'],
  '/ship-repair-facility': ['shiprepairfacility:read', 'shiprepair:read', 'shiprepairyard:read'],
  '/radar-station': ['radarstation:read', 'tramradar:read'],
  '/vts-system': ['vts:read', 'vtssystem:read'],
  '/vts-operation-center': 'vtsoperationcenter:read',
  '/ais-system': 'aissystem:read',
  '/cctv': 'cctv:read',
  '/scada': 'scada:read',
  '/transmission': 'transmission:read',
  '/vts-assist': 'vtsassist:read',
  '/vhf': 'vhf:read',
  '/dai-ttdh': 'daittdh:read',
  '/station/coastal': 'coastalstation:read',
  '/station/inmarsat': ['inmarsat:read', 'coastalstationinmarsat:read'],
  '/station/cospas-sarsat': ['cospassarsat:read', 'coastalstationcospassarsat:read'],
  '/station/lrit': ['lrit:read', 'coastalstationlrit:read'],
  '/station/hanoi': ['ttxltt:read', 'coastalstationhaiphong:read'],

  // Quản lý tài sản KCHT hàng hải (24 loại tài sản + 4 nghiệp vụ biến động)
  '/asset/berth': 'berthasset:read',
  '/asset/transfer-area': 'transferareaasset:read',
  '/asset/storm-shelter': 'stormshelterasset:read',
  '/asset/buoy-berth': 'buoyberthasset:read',
  '/asset/pier': 'pierasset:read',
  '/asset/anchorage': 'anchorageasset:read',
  '/asset/lighthouse': 'lighthouseasset:read',
  '/asset/dike-revetment': 'dikerevetmentasset:read',
  '/asset/buoy': 'buoyasset:read',
  '/asset/buoy-station': 'buoyasset:read',
  '/asset/channel': 'channelasset:read',
  '/asset/navigation-channel': 'channelasset:read',
  '/asset/dry-port': 'dryportasset:read',
  '/asset/cang-can': 'dryportasset:read',
  '/asset/lrit': 'lritasset:read',
  '/asset/cospas-sarsat': 'cospassarsatasset:read',
  '/asset/ttxltt': 'ttxlttasset:read',
  '/asset/ttdh': 'daittdhasset:read',
  '/asset/vts-system': 'vtsasset:read',
  '/asset/radar-station': 'radarasset:read',
  '/asset/ais-system': 'aisasset:read',
  '/asset/cctv-system': 'cctvasset:read',
  '/asset/scada-system': 'scadaasset:read',
  '/asset/transmission': 'transmissionasset:read',
  '/asset/vts-assist': 'vtsassistasset:read',
  '/asset/vhf': 'vhfasset:read',
  '/asset/dai-ttdh': 'daittdhasset:read',
  '/asset/inmarsat': 'inmarsatasset:read',
  '/asset/increase': 'assetincrease:read',
  '/asset/decrease': 'assetdecrease:read',
  '/asset/inventory': ['inventoryasset:read', 'inventoryplan:read', 'inventoryreport:read'],
  '/asset/exploitation': 'assetexploitation:read',
};

import { usePermissionStore } from '../store/permissionStore';

export const canAccessMenu = (path: string): boolean => {
  if (path === '/') return true;

  let required = MENU_PERMISSION_MAP[path];
  if (!required) {
    const parentRoute = Object.keys(MENU_PERMISSION_MAP)
      .filter((k) => path.startsWith(k + '/'))
      .sort((a, b) => b.length - a.length)[0];
    if (parentRoute) {
      required = MENU_PERMISSION_MAP[parentRoute];
    }
  }
  if (!required) return true;

  const permStore = usePermissionStore.getState();

  if (Array.isArray(required)) {
    return required.some((req) => permStore.hasPermission(req));
  }

  return permStore.hasPermission(required);
};

type TraversableMenuItem = {
  key?: Key;
  label?: ReactNode;
  type?: string;
  children?: TraversableMenuItem[];
} & Record<string, unknown>;

function asTraversableItems(items: MenuProps['items']): TraversableMenuItem[] {
  return (items ?? []).filter(Boolean) as TraversableMenuItem[];
}

export function filterEmptyChildren(items: MenuProps['items']): NonNullable<MenuProps['items']> {
  const reduced = asTraversableItems(items)
    .map((item) => {
      if (item.children) {
        const validChildren = filterEmptyChildren(item.children as MenuProps['items']);
        if (validChildren.length === 0) return null;
        return { ...item, children: validChildren };
      }
      return item;
    })
    .filter((item): item is TraversableMenuItem => item !== null)
    .reduce<TraversableMenuItem[]>((acc, item, idx, itemsInOrder) => {
      if (item.type === 'divider') {
        if (acc.length === 0 || acc[acc.length - 1]?.type === 'divider' || idx === itemsInOrder.length - 1) {
          return acc;
        }
      }
      acc.push(item);
      return acc;
    }, []);

  return reduced as NonNullable<MenuProps['items']>;
}

export function filterMenuByQuery(items: MenuProps['items'], query: string): MenuProps['items'] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  const keepMatching = (nodes: MenuProps['items']): MenuProps['items'] =>
    asTraversableItems(nodes).map((node) => {
      if (node.type === 'divider') return node;
      if (node.children) {
        return { ...node, children: keepMatching(node.children as MenuProps['items']) };
      }
      const labelMatches = typeof node.label === 'string' && node.label.toLowerCase().includes(normalizedQuery);
      return labelMatches ? node : null;
    }) as MenuProps['items'];

  return filterEmptyChildren(keepMatching(items));
}

export function collectOpenableKeys(items: MenuProps['items']): string[] {
  return asTraversableItems(items).reduce<string[]>((acc, node) => {
    if (node.children?.length) {
      if (node.key !== undefined) acc.push(String(node.key));
      acc.push(...collectOpenableKeys(node.children as MenuProps['items']));
    }
    return acc;
  }, []);
}
