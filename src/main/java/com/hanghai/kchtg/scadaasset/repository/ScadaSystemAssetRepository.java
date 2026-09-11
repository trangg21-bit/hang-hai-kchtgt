package com.hanghai.kchtg.scadaasset.repository;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.scadaasset.entity.ScadaSystemAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScadaSystemAssetRepository extends JpaRepository<ScadaSystemAsset, UUID>, JpaSpecificationExecutor<ScadaSystemAsset> {
    Optional<ScadaSystemAsset> findByAssetCode(String assetCode);
    Long countByStatus(AssetStatus status);
}
