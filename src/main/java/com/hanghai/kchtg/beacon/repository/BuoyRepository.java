package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.entity.BuoyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.hanghai.kchtg.beacon.entity.BeaconApprovalStatus;

public interface BuoyRepository extends JpaRepository<Buoy, UUID> {

    Optional<Buoy> findByCode(String code);
    boolean existsByCode(String code);

    Page<Buoy> findByStatus(BeaconStatus status, Pageable pageable);
    Page<Buoy> findByType(BuoyType type, Pageable pageable);
    List<Buoy> findByNameContainingIgnoreCase(String name);
    List<Buoy> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT b FROM Buoy b WHERE " +
           "(cast(:name as string) IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND " +
           "(cast(:code as string) IS NULL OR LOWER(b.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status)")
    List<Buoy> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") BuoyType type,
        @Param("status") BeaconStatus status
    );

    long countByStatus(BeaconStatus status);

    @Query("SELECT b FROM Buoy b WHERE " +
            "b.deletedAt IS NULL AND " +
            "b.approvalStatus = com.hanghai.kchtg.beacon.entity.BeaconApprovalStatus.APPROVED AND " +
            "(:orgUnitId IS NULL OR b.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(b.name) LIKE :search OR LOWER(b.code) LIKE :search)")
    List<Buoy> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
