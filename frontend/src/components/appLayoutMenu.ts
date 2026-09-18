import type { Key, ReactNode } from 'react';
import type { MenuProps } from 'antd';

export const MENU_PERMISSION_MAP: Record<string, string | string[]> = {
  '/users': 'user:read',
  '/organizations': 'orgunit:read',
  '/groups': ['group:read', 'groupmember:read'],
  '/gis/map': 'data:read',
  '/gis/points': 'data:read',
  '/gis/lines': 'data:read',
  '/gis/polygons': 'data:read',
  '/gis/layers': 'map:manage',
  '/gis/permits': 'data:read',
  '/beacon-stations': 'beaconstation:read',
  '/buoys': 'buoy:read',
  '/buoy-station': 'buoystation:read',
  '/history': ['history:read', 'history:view'],
  '/port': 'port:read',
  '/berth': 'berth:read',
  '/pier': 'pier:read',
  '/dry-port': 'dryport:read',
  '/water-zone': 'waterzone:read',
  '/anchorage': 'anchorage:read',
  '/transfer-area': 'transferarea:read',
  '/storm-shelter': 'stormshelter:read',
  '/buoy-berth': 'buoyberth:read',
  '/dai-ttdh': ['daittdh:read', 'coastalstation:read'],
  '/ship-repair-yard': ['shiprepairyard:read', 'shiprepairfacility:read', 'shiprepair:read'],
  '/asset/increase': ['assetincrease:manage', 'assetincrease:read'],
  '/asset/decrease': ['assetdecrease:manage', 'assetdecrease:read'],
  '/asset/inventory': ['inventoryasset:manage', 'inventoryasset:read', 'inventoryplan:read', 'inventoryreport:read'],
  '/asset/exploitation': ['assetexploitation:manage', 'assetexploitation:read'],
  '/asset/berth': ['berthasset:manage', 'berthasset:read', 'berth:read', 'berth:manage'],
  '/asset/vts-system': ['vtsasset:manage', 'vtsasset:read', 'vts:read', 'vtssystem:read'],
  '/asset/radar-station': ['radarasset:manage', 'radarasset:read', 'radarstation:read', 'tramradar:read'],
  '/asset/ais-system': ['aisasset:manage', 'aisasset:read', 'aissystem:read'],
  '/asset/cctv-system': ['cctvasset:manage', 'cctvasset:read', 'cctv:read'],
  '/asset/scada-system': ['scadaasset:manage', 'scadaasset:read', 'scada:read'],
  '/asset/transmission': ['transmissionasset:manage', 'transmissionasset:read', 'transmission:read', 'transmission:manage'],
  '/asset/vts-assist': ['vtsassistasset:manage', 'vtsassistasset:read', 'vtsassist:read', 'vtsassist:manage'],
  '/asset/vhf': ['vhfasset:manage', 'vhfasset:read', 'vhf:read', 'vhf:manage'],
  '/asset/dai-ttdh': ['daittdhasset:manage', 'daittdhasset:read', 'daittdh:read', 'daittdh:manage'],
  '/asset/inmarsat': ['inmarsatasset:manage', 'inmarsatasset:read', 'inmarsat:read', 'inmarsat:manage', 'coastalstationinmarsat:read'],
  '/asset/transfer-area': ['transferareaasset:manage', 'transferareaasset:read', 'transferarea:read', 'transferarea:manage'],
  '/asset/storm-shelter': ['stormshelterasset:manage', 'stormshelterasset:read', 'stormshelter:read', 'stormshelter:manage'],
  '/asset/buoy-berth': ['buoyberthasset:manage', 'buoyberthasset:read', 'buoyberth:read', 'buoyberth:manage'],
  '/asset/pier': ['pierasset:manage', 'pierasset:read', 'pier:read', 'pier:manage'],
  '/asset/anchorage': ['anchorageasset:manage', 'anchorageasset:read', 'anchorage:read', 'anchorage:manage'],
  '/asset/lighthouse': ['lighthouseasset:manage', 'lighthouseasset:read', 'lighthouse:read', 'lighthouse:manage', 'beaconstation:read'],
  '/asset/dike-revetment': ['dikerevetmentasset:manage', 'dikerevetmentasset:read', 'dikerevetment:read', 'dikerevetment:manage'],
  '/asset/buoy': ['buoyasset:manage', 'buoyasset:read', 'buoy:read', 'buoy:manage', 'buoystation:read'],
  '/asset/buoy-station': ['buoyasset:manage', 'buoyasset:read', 'buoy:read', 'buoystation:read'],
  '/asset/channel': ['channelasset:manage', 'channelasset:read', 'channel:read', 'channel:manage', 'navigationchannel:read'],
  '/asset/navigation-channel': ['channelasset:manage', 'channelasset:read', 'channel:read', 'channel:manage', 'navigationchannel:read'],
  '/asset/dry-port': ['dryportasset:manage', 'dryportasset:read', 'dryport:read', 'dryport:manage'],
  '/asset/cang-can': ['dryportasset:manage', 'dryportasset:read', 'dryport:read', 'dryport:manage'],
  '/asset/lrit': ['lritasset:manage', 'lritasset:read', 'lrit:read', 'lrit:manage', 'coastalstationlrit:read'],
  '/asset/cospas-sarsat': ['cospassarsatasset:manage', 'cospassarsatasset:read', 'cospassarsat:read', 'cospassarsat:manage', 'coastalstationcospassarsat:read'],
  '/asset/ttxltt': ['ttxlttasset:manage', 'ttxlttasset:read'],
  '/asset/ttdh': ['daittdhasset:manage', 'daittdhasset:read', 'daittdh:read', 'daittdh:manage'],
  '/navigation-channel': ['navigationchannel:read', 'channel:read'],
  '/navigation-channel-chk': ['navigationchannel:read', 'channel:read'],
  '/luong-hang-hai': ['navigationchannel:read', 'channel:read'],
  '/luong-hang-hai-chk': ['navigationchannel:read', 'channel:read'],
  '/dike-revetment': 'dikerevetment:read',
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
  '/station/coastal': ['coastalstation:read', 'specialstation:read', 'station:read'],
  '/station/inmarsat': ['specialstation:read', 'coastalstationinmarsat:read', 'coastalstation:read'],
  '/station/cospas-sarsat': ['specialstation:read', 'coastalstationcospassarsat:read', 'coastalstation:read'],
  '/station/lrit': ['specialstation:read', 'coastalstationlrit:read', 'coastalstation:read'],
  '/station/hanoi': ['specialstation:read', 'coastalstationhaiphong:read', 'coastalstation:read'],
  '/connections': ['connection:read', 'interconnect:read'],
  '/interconnect': ['connection:read', 'interconnect:read'],
  '/reports': 'report:read',
  '/dashboard': 'report:read',
  '/settings': 'admin:manage',
  '/logs': ['log:read', 'log:view', 'log:manage', 'admin:view', 'admin:manage'],
  '/symbols': 'data:read',
  '/documents/legal': 'document:read',
  '/documents/incidents': 'document:read',
  '/documents/port-planning': ['document:read', 'portplanning:read'],
  '/documents/operation': ['document:read', 'operationplan:read'],
  '/documents/maintenance': ['document:read', 'maintenanceplan:read'],
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
