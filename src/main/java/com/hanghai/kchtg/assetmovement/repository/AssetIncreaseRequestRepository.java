package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.entity.AssetIncreaseRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssetIncreaseRequestRepository extends JpaRepository<AssetIncreaseRequest, UUID> {

    List<AssetIncreaseRequest> findByAssetId(UUID assetId);

    List<AssetIncreaseRequest> findByStatus(RequestStatus status);

    Page<AssetIncreaseRequest> findByAssetId(UUID assetId, Pageable pageable);
}
