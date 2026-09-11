package com.hanghai.kchtg.transmissionasset.repository;

import com.hanghai.kchtg.transmissionasset.entity.TransmissionAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransmissionAssetRepository extends JpaRepository<TransmissionAsset, UUID>, JpaSpecificationExecutor<TransmissionAsset> {
    Optional<TransmissionAsset> findByAssetCode(String assetCode);
}
