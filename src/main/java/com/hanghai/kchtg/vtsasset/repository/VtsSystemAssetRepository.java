package com.hanghai.kchtg.vtsasset.repository;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.vtsasset.entity.VtsSystemAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VtsSystemAssetRepository extends JpaRepository<VtsSystemAsset, UUID>, JpaSpecificationExecutor<VtsSystemAsset> {
    Optional<VtsSystemAsset> findByAssetCode(String assetCode);
    Long countByStatus(AssetStatus status);
}
