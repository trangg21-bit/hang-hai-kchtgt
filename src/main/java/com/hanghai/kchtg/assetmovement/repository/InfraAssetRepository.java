package com.hanghai.kchtg.assetmovement.repository;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.assetmovement.entity.InfraAsset;
import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InfraAssetRepository extends JpaRepository<InfraAsset, UUID> {

    Optional<InfraAsset> findByAssetCode(String assetCode);

    List<InfraAsset> findByAssetType(InfraAssetType assetType);

    List<InfraAsset> findByStatus(AssetStatus status);

    Long countByStatus(AssetStatus status);



    Page<InfraAsset> findByAssetCode(String assetCode, Pageable pageable);
}
