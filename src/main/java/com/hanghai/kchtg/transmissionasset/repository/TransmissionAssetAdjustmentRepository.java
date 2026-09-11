package com.hanghai.kchtg.transmissionasset.repository;

import com.hanghai.kchtg.transmissionasset.entity.TransmissionAssetAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransmissionAssetAdjustmentRepository extends JpaRepository<TransmissionAssetAdjustment, UUID> {
    List<TransmissionAssetAdjustment> findByAssetIdOrderByCreatedAtDesc(UUID assetId);
    List<TransmissionAssetAdjustment> findByAssetIdAndAdjustmentTypeOrderByCreatedAtDesc(UUID assetId, String adjustmentType);
}
