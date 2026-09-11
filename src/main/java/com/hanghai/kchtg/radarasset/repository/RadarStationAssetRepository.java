package com.hanghai.kchtg.radarasset.repository;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.radarasset.entity.RadarStationAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RadarStationAssetRepository extends JpaRepository<RadarStationAsset, UUID>, JpaSpecificationExecutor<RadarStationAsset> {
    Optional<RadarStationAsset> findByAssetCode(String assetCode);
    Long countByStatus(AssetStatus status);
}
