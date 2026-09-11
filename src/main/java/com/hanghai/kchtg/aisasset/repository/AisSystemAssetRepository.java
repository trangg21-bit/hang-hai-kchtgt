package com.hanghai.kchtg.aisasset.repository;

import com.hanghai.kchtg.aisasset.entity.AisSystemAsset;
import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AisSystemAssetRepository extends JpaRepository<AisSystemAsset, UUID>, JpaSpecificationExecutor<AisSystemAsset> {
    Optional<AisSystemAsset> findByAssetCode(String assetCode);
    Long countByStatus(AssetStatus status);
}
