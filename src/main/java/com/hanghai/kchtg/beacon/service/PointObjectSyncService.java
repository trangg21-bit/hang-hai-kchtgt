package com.hanghai.kchtg.beacon.service;

import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for M-007 PointObject sync integration.
 * On approveL2, upserts into point_objects table.
 * On soft delete, hides the point (does NOT delete per BR-070-05).
 */
@Service("beaconPointObjectSyncService")
public class PointObjectSyncService {

    private final PointObjectRepository pointRepo;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    public PointObjectSyncService(PointObjectRepository pointRepo, com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService) {
        this.pointRepo = pointRepo;
        this.gisSpatialObjectService = gisSpatialObjectService;
    }

    private double[] getCoordinates(java.util.UUID khongGianId) {
        if (khongGianId != null) {
            var spatialObjOpt = gisSpatialObjectService.findById(khongGianId);
            if (spatialObjOpt.isPresent()) {
                String coordinates = spatialObjOpt.get().getCoordinates();
                try {
                    String clean = coordinates.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        return new double[]{Double.parseDouble(parts[0]), Double.parseDouble(parts[1])};
                    }
                } catch (Exception ex) {
                    // ignore
                }
            }
        }
        return new double[]{0.0, 0.0};
    }

    /**
     * Sync BeaconLight to M-007 point_objects when published.
     */
    @Transactional
    public void syncToMap(BeaconLight entity) {
        if (entity == null) return;
        PointObject point = pointRepo.findByCode(entity.getCode())
                .orElse(new PointObject());
        
        point.setCode(entity.getCode());
        point.setName(entity.getName());
        point.setObjectType(PointObject.ObjectType.LIGHTHOUSE);
        double[] coords = getCoordinates(entity.getKhongGianId());
        point.setLongitude(coords[0]);
        point.setLatitude(coords[1]);
        point.setDescription(entity.getLocation());
        point.setStatus(PointObject.Status.PUBLISHED);
        point.setUnitId(entity.getUnitId());
        point.setApprovalStatus(PointObject.ApprovalStatus.APPROVED);
        point.setApprovedBy(entity.getApprovedBy());
        point.setApprovedDate(entity.getApprovedDate());
        
        pointRepo.save(point);
    }

    /**
     * Hide BeaconLight point from M-007 map on soft delete.
     * Does NOT delete the point (per BR-070-05).
     */
    @Transactional
    public void hideFromMap(BeaconLight entity) {
        if (entity == null) return;
        pointRepo.findByCode(entity.getCode()).ifPresent(point -> {
            point.setStatus(PointObject.Status.DELETED);
            pointRepo.save(point);
        });
    }

    /**
     * Sync Buoy to M-007 point_objects when published.
     */
    @Transactional
    public void syncToMapBuoy(Buoy entity) {
        if (entity == null) return;
        PointObject point = pointRepo.findByCode(entity.getCode())
                .orElse(new PointObject());
        
        point.setCode(entity.getCode());
        point.setName(entity.getName());
        point.setObjectType(PointObject.ObjectType.BUOY);
        double[] coords = getCoordinates(entity.getKhongGianId());
        point.setLongitude(coords[0]);
        point.setLatitude(coords[1]);
        point.setDescription(entity.getDescription());
        point.setStatus(PointObject.Status.PUBLISHED);
        point.setUnitId(entity.getUnitId());
        point.setApprovalStatus(PointObject.ApprovalStatus.APPROVED);
        point.setApprovedBy(entity.getApprovedBy());
        point.setApprovedDate(entity.getApprovedDate());
        
        pointRepo.save(point);
    }

    /**
     * Hide Buoy point from M-007 map on soft delete.
     * Does NOT delete the point (per BR-070-05).
     */
    @Transactional
    public void hideFromMapBuoy(Buoy entity) {
        if (entity == null) return;
        pointRepo.findByCode(entity.getCode()).ifPresent(point -> {
            point.setStatus(PointObject.Status.DELETED);
            pointRepo.save(point);
        });
    }
}
