package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.station.entity.BuoyStation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for M-007 PointObject sync integration for Nha Tram.
 * On approveL2, upserts into point_objects table.
 * On soft delete, hides the point (does NOT delete per BR-070-05).
 */
@Service("stationPointObjectSyncService")
public class PointObjectSyncService {

    private final PointObjectRepository pointRepo;

    public PointObjectSyncService(PointObjectRepository pointRepo) {
        this.pointRepo = pointRepo;
    }

    /**
     * Sync BuoyStation (phao) to M-007 point_objects when published.
     */
    @Transactional
    public void syncToMapPhao(BuoyStation entity) {
        if (entity == null) return;
        PointObject point = pointRepo.findByCode(entity.getCode())
                .orElse(new PointObject());

        point.setCode(entity.getCode());
        point.setName(entity.getName());
        point.setObjectType(PointObject.ObjectType.BUOY);
        point.setDescription(entity.getDescription());
        point.setStatus(PointObject.Status.PUBLISHED);
        point.setUnitId(entity.getUnitId());
        point.setApprovalStatus(PointObject.ApprovalStatus.APPROVED);
        point.setApprovedBy(entity.getApprovedBy() != null ? java.util.UUID.fromString(entity.getApprovedBy()) : null);
        point.setApprovedDate(entity.getApprovedDate());

        pointRepo.save(point);
    }

    /**
     * Hide BuoyStation point from M-007 map on soft delete.
     */
    @Transactional
    public void hideFromMapPhao(BuoyStation entity) {
        if (entity == null) return;
        pointRepo.findByCode(entity.getCode()).ifPresent(point -> {
            point.setStatus(PointObject.Status.DELETED);
            pointRepo.save(point);
        });
    }
}


