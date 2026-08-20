package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.Buoy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface BuoyRepository extends JpaRepository<Buoy, UUID> {

    Optional<Buoy> findByCode(String code);
    boolean existsByCode(String code);

    @Query("SELECT MAX(b.code) FROM Buoy b WHERE b.code LIKE 'PT-%'")
    Optional<String> findMaxCode();

    Page<Buoy> findByStatus(String status, Pageable pageable);
    Page<Buoy> findByType(String type, Pageable pageable);
    List<Buoy> findByNameContainingIgnoreCase(String name);
    List<Buoy> findByCodeContainingIgnoreCase(String code);
    List<Buoy> findByBuoyStationId(UUID buoyStationId);

    @Query("SELECT b FROM Buoy b WHERE " +
           "((cast(:name as string) IS NULL AND cast(:code as string) IS NULL) OR " +
           "(cast(:name as string) IS NOT NULL AND LOWER(b.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) OR " +
           "(cast(:code as string) IS NOT NULL AND LOWER(b.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%')))) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:condition IS NULL OR b.condition = :condition) AND " +
           "(:provinceId IS NULL OR b.provinceId = :provinceId) AND " +
           "(cast(:locationDetail as string) IS NULL OR LOWER(b.locationDetail) LIKE LOWER(CONCAT('%', cast(:locationDetail as string), '%'))) AND " +
           "(:approvalStatus IS NULL OR b.approvalStatus = :approvalStatus) ORDER BY b.updatedAt DESC")
    List<Buoy> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") String type,
        @Param("status") String status,
        @Param("condition") String condition,
        @Param("provinceId") Integer provinceId,
        @Param("locationDetail") String locationDetail,
        @Param("approvalStatus") String approvalStatus
    );

    default List<Buoy> searchFiltered(String name, String code, String type, String status) {
        return searchFiltered(name, code, type, status, null, null, null, null);
    }

    long countByStatus(String status);

    @Query("SELECT b FROM Buoy b WHERE " +
            "b.deletedAt IS NULL AND " +
            "b.approvalStatus = 'APPROVED' AND " +
            "(:orgUnitId IS NULL OR b.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(b.name) LIKE :search OR LOWER(b.code) LIKE :search)")
    List<Buoy> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
