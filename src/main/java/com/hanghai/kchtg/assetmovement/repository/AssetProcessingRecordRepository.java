package com.hanghai.kchtg.assetmovement.repository;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.entity.AssetProcessingRecord;
import com.hanghai.kchtg.assetmovement.entity.ProcessingType;
import com.hanghai.kchtg.assetmovement.entity.ProcessingRecordStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssetProcessingRecordRepository extends JpaRepository<AssetProcessingRecord, UUID> {

    List<AssetProcessingRecord> findByAssetId(UUID assetId);

    List<AssetProcessingRecord> findByProcessingType(ProcessingType processingType);

    List<AssetProcessingRecord> findByStatus(ProcessingRecordStatus status);

    Page<AssetProcessingRecord> findByAssetId(UUID assetId, Pageable pageable);

    Page<AssetProcessingRecord> findByProcessingType(ProcessingType processingType, Pageable pageable);

    Page<AssetProcessingRecord> findByAssetIdAndProcessingType(UUID assetId, ProcessingType processingType, Pageable pageable);
}
