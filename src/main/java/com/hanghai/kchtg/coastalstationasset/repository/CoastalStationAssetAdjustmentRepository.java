package com.hanghai.kchtg.coastalstationasset.repository;

import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAssetAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CoastalStationAssetAdjustmentRepository extends JpaRepository<CoastalStationAssetAdjustment, UUID> {
    List<CoastalStationAssetAdjustment> findByAssetIdOrderByCreatedAtDesc(UUID assetId);
    List<CoastalStationAssetAdjustment> findByAssetIdAndAdjustmentTypeOrderByCreatedAtDesc(UUID assetId, String adjustmentType);
}
