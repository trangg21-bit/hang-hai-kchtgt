package com.hanghai.kchtg.coastalstationasset.repository;

import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;
import java.util.UUID;

public interface CoastalStationAssetRepository extends JpaRepository<CoastalStationAsset, UUID>, JpaSpecificationExecutor<CoastalStationAsset> {
    Optional<CoastalStationAsset> findByAssetCode(String assetCode);
}
