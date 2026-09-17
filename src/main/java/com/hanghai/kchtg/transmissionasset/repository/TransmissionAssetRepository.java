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

    @org.springframework.data.jpa.repository.Query("SELECT a.assetCode FROM TransmissionAsset a WHERE a.assetCode LIKE CONCAT(:prefix, '%')")
    java.util.List<String> findAssetCodesStartingWith(@org.springframework.data.repository.query.Param("prefix") String prefix);
}
