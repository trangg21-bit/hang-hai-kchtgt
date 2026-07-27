package com.hanghai.kchtg.beacon.repository;

import java.util.UUID;

import com.hanghai.kchtg.beacon.entity.BeaconLight;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;



public interface BeaconLightRepository extends JpaRepository<BeaconLight, UUID> {

    Optional<BeaconLight> findByCode(String code);
    boolean existsByCode(String code);

    Page<BeaconLight> findByStatus(String status, Pageable pageable);
    Page<BeaconLight> findByType(String type, Pageable pageable);
    List<BeaconLight> findByNameContainingIgnoreCase(String name);
    List<BeaconLight> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT b FROM BeaconLight b WHERE " +
           "(:name IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND " +
           "(:code IS NULL OR LOWER(b.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status)")
    List<BeaconLight> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") String type,
        @Param("status") String status
    );

    @Query("SELECT b FROM BeaconLight b WHERE " +
           "(:name IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND " +
           "(:code IS NULL OR LOWER(b.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status)")
    Page<BeaconLight> searchFilteredPaged(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") String type,
        @Param("status") String status,
        Pageable pageable
    );

    long countByStatus(String status);

    @Query("SELECT b FROM BeaconLight b WHERE " +
            "b.deletedAt IS NULL AND " +
            "b.approvalStatus = 'APPROVED' AND " +
            "(:orgUnitId IS NULL OR b.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(b.name) LIKE :search OR LOWER(b.code) LIKE :search)")
    List<BeaconLight> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
