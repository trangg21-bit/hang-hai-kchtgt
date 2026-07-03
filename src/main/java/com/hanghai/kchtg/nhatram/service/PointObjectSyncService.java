package com.hanghai.kchtg.nhatram.service;

import com.hanghai.kchtg.nhatram.entity.NhaTramDen;
import com.hanghai.kchtg.nhatram.entity.NhaTramPhao;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for M-007 PointObject sync integration for Nha Tram.
 * On approveL2, upserts into point_objects table.
 * On soft delete, hides the point (does NOT delete per BR-070-05).
 */
@Service("nhatramPointObjectSyncService")
public class PointObjectSyncService {

    private final PointObjectRepository pointRepo;

    public PointObjectSyncService(PointObjectRepository pointRepo) {
        this.pointRepo = pointRepo;
    }

    /**
     * Sync NhaTramDen (den) to M-007 point_objects when published.
     */
    @Transactional
    public void syncToMapDen(NhaTramDen entity) {
        if (entity == null) return;
        PointObject point = pointRepo.findByCode(entity.getCode())
                .orElse(new PointObject());
        
        point.setCode(entity.getCode());
        point.setName(entity.getName());
        point.setObjectType(PointObject.ObjectType.LIGHTHOUSE);
        point.setLongitude(entity.getLongitude());
        point.setLatitude(entity.getLatitude());
        point.setDescription(entity.getDescription());
        point.setStatus(PointObject.Status.PUBLISHED);
        point.setUnitId(entity.getUnitId());
        point.setApprovalStatus(PointObject.ApprovalStatus.APPROVED);
        point.setApprovedBy(entity.getApprovedBy());
        point.setApprovedDate(entity.getApprovedDate());
        
        pointRepo.save(point);
    }

    /**
     * Hide NhaTramDen point from M-007 map on soft delete.
     * Does NOT delete the point (per BR-070-05).
     */
    @Transactional
    public void hideFromMapDen(NhaTramDen entity) {
        if (entity == null) return;
        pointRepo.findByCode(entity.getCode()).ifPresent(point -> {
            point.setStatus(PointObject.Status.DELETED);
            pointRepo.save(point);
        });
    }

    /**
     * Sync NhaTramPhao (phao) to M-007 point_objects when published.
     */
    @Transactional
    public void syncToMapPhao(NhaTramPhao entity) {
        if (entity == null) return;
        PointObject point = pointRepo.findByCode(entity.getCode())
                .orElse(new PointObject());
        
        point.setCode(entity.getCode());
        point.setName(entity.getName());
        point.setObjectType(PointObject.ObjectType.BUOY);
        point.setLongitude(entity.getLongitude());
        point.setLatitude(entity.getLatitude());
        point.setDescription(entity.getDescription());
        point.setStatus(PointObject.Status.PUBLISHED);
        point.setUnitId(entity.getUnitId());
        point.setApprovalStatus(PointObject.ApprovalStatus.APPROVED);
        point.setApprovedBy(entity.getApprovedBy());
        point.setApprovedDate(entity.getApprovedDate());
        
        pointRepo.save(point);
    }

    /**
     * Hide NhaTramPhao point from M-007 map on soft delete.
     * Does NOT delete the point (per BR-070-05).
     */
    @Transactional
    public void hideFromMapPhao(NhaTramPhao entity) {
        if (entity == null) return;
        pointRepo.findByCode(entity.getCode()).ifPresent(point -> {
            point.setStatus(PointObject.Status.DELETED);
            pointRepo.save(point);
        });
    }
}
