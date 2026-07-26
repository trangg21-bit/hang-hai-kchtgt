package com.hanghai.kchtg.assetmovement.repository;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.entity.InventoryAsset;
import com.hanghai.kchtg.assetmovement.entity.InventoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryAssetRepository extends JpaRepository<InventoryAsset, UUID> {

    List<InventoryAsset> findByPlanId(UUID planId);

    List<InventoryAsset> findByAssetId(UUID assetId);

    List<InventoryAsset> findByInventoryStatus(InventoryStatus inventoryStatus);

    Page<InventoryAsset> findByPlanId(UUID planId, Pageable pageable);

    Page<InventoryAsset> findByAssetId(UUID assetId, Pageable pageable);

    Page<InventoryAsset> findByInventoryStatus(InventoryStatus inventoryStatus, Pageable pageable);

    Page<InventoryAsset> findByPlanIdAndInventoryStatus(UUID planId, InventoryStatus inventoryStatus, Pageable pageable);
}
