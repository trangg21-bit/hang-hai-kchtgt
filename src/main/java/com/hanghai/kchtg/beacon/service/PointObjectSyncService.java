package com.hanghai.kchtg.beacon.service;

import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.Buoy;
import org.springframework.stereotype.Service;

/**
 * Stub service for M-007 PointObject sync integration.
 * On approveL2, upserts into point_objects table.
 * On soft delete, hides the point (does NOT delete per BR-070-05).
 */
@Service("beaconPointObjectSyncService")
public class PointObjectSyncService {

    /**
     * Sync BeaconLight to M-007 point_objects when published.
     */
    public void syncToMap(BeaconLight entity) {
        // Post-M-007 integration: upsert into point_objects.
        // code = entity.getCode()
        // name = entity.getName()
        // objectType = LIGHTHOUSE / BEACON / BEACON_LIGHT
        // latitude, longitude, status = PUBLISHED, unitId from entity
    }

    /**
     * Hide BeaconLight point from M-007 map on soft delete.
     * Does NOT delete the point (per BR-070-05).
     */
    public void hideFromMap(BeaconLight entity) {
        // Post-M-007 integration: set status = DELETED in point_objects.
        // BR-070-05: do NOT auto-delete points in M-007
    }

    /**
     * Sync Buoy to M-007 point_objects when published.
     */
    public void syncToMapBuoy(Buoy entity) {
        // Post-M-007 integration: upsert into point_objects.
        // code = entity.getCode()
        // name = entity.getName()
        // objectType = BUOY
        // latitude, longitude, status = PUBLISHED, unitId from entity
    }

    /**
     * Hide Buoy point from M-007 map on soft delete.
     * Does NOT delete the point (per BR-070-05).
     */
    public void hideFromMapBuoy(Buoy entity) {
        // Post-M-007 integration: set status = DELETED in point_objects.
        // BR-070-05: do NOT auto-delete points in M-007
    }
}
