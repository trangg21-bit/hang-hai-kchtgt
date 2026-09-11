import type { Key, ReactNode } from 'react';
import type { MenuProps } from 'antd';

export const MENU_PERMISSION_MAP: Record<string, string | string[]> = {
  '/users': 'user:read',
  '/organizations': 'orgunit:read',
  '/groups': 'group:read',
  '/gis/map': 'data:read',
  '/gis/points': 'data:read',
  '/gis/lines': 'data:read',
  '/gis/polygons': 'data:read',
  '/gis/layers': 'map:manage',
  '/gis/permits': 'data:read',
  '/beacon-stations': 'beaconstation:read',
  '/buoys': 'buoy:read',
  '/buoy-station': 'buoystation:read',
  '/history': 'data:read',
  '/port': 'port:read',
  '/berth': 'berth:read',
  '/pier': 'pier:read',
  '/dry-port': 'dryport:read',
  '/water-zone': 'waterzone:read',
  '/anchorage': 'anchorage:read',
  '/transfer-area': 'transferarea:read',
  '/storm-shelter': 'stormshelter:read',
  '/buoy-berth': 'buoyberth:read',
  '/dai-ttdh': 'daittdh:read',
  '/ship-repair-yard': 'shiprepairyard:read',
  '/asset/increase': 'assetincrease:manage',
  '/asset/decrease': 'assetdecrease:manage',
  '/asset/inventory': 'inventoryasset:manage',
  '/asset/exploitation': 'assetexploitation:manage',
  '/asset/berth': 'infraasset:manage',
  '/asset/anchorage': 'infraasset:manage',
  '/asset/lighthouse': 'infraasset:manage',
  '/asset/dike-revetment': 'infraasset:manage',
  '/asset/buoy': 'infraasset:manage',
  '/asset/buoy-station': 'infraasset:manage',
  '/asset/channel': 'infraasset:manage',
  '/asset/navigation-channel': 'infraasset:manage',
  '/navigation-channel': 'navigationchannel:read',
  '/navigation-channel-chk': 'navigationchannel:read',
  '/dike-revetment': 'dikerevetment:read',
  '/ship-repair-facility': 'shiprepair:read',
  '/radar-station': 'radarstation:read',
  '/vts-system': 'vts:read',
  '/vts-operation-center': 'vtsoperationcenter:read',
  '/ais-system': 'aissystem:read',
  '/cctv': 'cctv:read',
  '/scada': 'scada:read',
  '/transmission': 'transmission:read',
  '/vts-assist': 'vtsassist:read',
  '/station/coastal': 'coastalstation:read',
  '/station/inmarsat': ['specialstation:read', 'coastalstationinmarsat:read', 'coastalstation:read', 'data:read'],
  '/station/cospas-sarsat': 'coastalstationcospassarsat:read',
  '/station/lrit': 'coastalstationlrit:read',
  '/station/hanoi': 'coastalstationhaiphong:read',
  '/connections': 'connection:read',
  '/interconnect': 'connection:read',
  '/reports': 'report:read',
  '/dashboard': 'report:read',
  '/settings': 'admin:manage',
  '/logs': 'admin:view',
  '/symbols': 'data:read',
  '/documents/legal': 'document:read',
  '/documents/incidents': 'document:read',
  '/documents/port-planning': 'document:read',
  '/documents/operation': 'document:read',
  '/documents/maintenance': 'document:read',
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
