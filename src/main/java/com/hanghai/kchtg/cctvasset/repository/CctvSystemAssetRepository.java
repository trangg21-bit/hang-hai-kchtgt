package com.hanghai.kchtg.cctvasset.repository;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.cctvasset.entity.CctvSystemAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CctvSystemAssetRepository extends JpaRepository<CctvSystemAsset, UUID>, JpaSpecificationExecutor<CctvSystemAsset> {
    Optional<CctvSystemAsset> findByAssetCode(String assetCode);
    Long countByStatus(AssetStatus status);
}
