-- KCHT resource permissions are explicit, matching the VTS matrix.
-- Remove the legacy aggregate :manage action and every grant referencing it.
DO $$
DECLARE
    kcht_resources text[] := ARRAY[
        'port', 'seaport', 'berth', 'berthasset', 'pier', 'pierasset', 'buoyberth', 'buoyberthasset',
        'anchorage', 'anchorageasset', 'transferarea', 'transferareaasset', 'stormshelter', 'stormshelterasset',
        'dryport', 'dryportasset', 'waterzone', 'waterarea', 'navigationchannel', 'channel', 'channelasset', 'dikerevetment', 'dikerevetmentasset',
        'shiprepair', 'shiprepairfacility', 'shiprepairyard', 'radarstation', 'tramradar',
        'beaconstation', 'beaconlight', 'lighthouseasset', 'buoystation', 'buoy', 'buoyasset', 'lighthouse', 'lighthousestation',
        'vts', 'vtssystem', 'vtsasset', 'vtsoperationcenter', 'vtsassist', 'vtsassistasset', 'aissystem', 'aisasset', 'cctv', 'cctvasset', 'scada', 'scadaasset',
        'transmission', 'transmissionasset', 'vhf', 'vhfasset', 'daittdh', 'daittdhasset', 'ttxltt', 'ttxlttasset', 'coastalstation', 'specialstation', 'station',
        'coastalstationinmarsat', 'coastalstationcospassarsat', 'coastalstationlrit',
        'coastalstationhaiphong', 'inmarsat', 'inmarsatasset', 'cospassarsat', 'cospassarsatasset', 'lrit', 'lritasset', 'asset', 'infraasset',
        'assetincrease', 'assetdecrease', 'assetexploitation', 'movementrequest', 'inventoryasset',
        'inventoryplan', 'inventoryreport', 'approvalrecord', 'processingrecord', 'maintenanceplan',
        'operationplan', 'incident', 'gispoint', 'pointobject', 'gisline', 'lineobject',
        'gispolygon', 'polygonobject'
    ];
BEGIN
    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override
        WHERE permission_code = ANY(ARRAY(SELECT resource || ':manage' FROM permissions
                                          WHERE resource = ANY(kcht_resources) AND action = 'manage'));
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions
        WHERE permission = ANY(ARRAY(SELECT resource || ':manage' FROM permissions
                                      WHERE resource = ANY(kcht_resources) AND action = 'manage'));
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (SELECT id FROM permissions
                                WHERE resource = ANY(kcht_resources) AND action = 'manage');
    END IF;

    IF to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM permissions
        WHERE resource = ANY(kcht_resources) AND action = 'manage';
    END IF;
END $$;
