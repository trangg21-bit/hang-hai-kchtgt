package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.station.entity.BuoyStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BuoyStationRepository extends JpaRepository<BuoyStation, UUID> {
       boolean existsByCode(String code);

       List<BuoyStation> findByPortIdAndDeletedAtIsNull(UUID portId);

       @Query("SELECT p FROM BuoyStation p WHERE " +
                     "(cast(:name as string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND "
                     +
                     "(cast(:code as string) IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND "
                     +
                     "(:type IS NULL OR p.type = :type) AND " +
                     "(:status IS NULL OR p.status = :status) AND " +
                     "(:unitId IS NULL OR p.unitId = :unitId) AND " +
                     "(:province IS NULL OR p.province = :province)")
       List<BuoyStation> searchFiltered(
                     @Param("name") String name,
                     @Param("code") String code,
                     @Param("type") String type,
                     @Param("status") String status,
                     @Param("unitId") UUID unitId,
                     @Param("province") String province);
    @Query("SELECT p FROM BuoyStation p WHERE " +
            "p.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR p.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(p.name) LIKE :search OR LOWER(p.code) LIKE :search)")
    List<BuoyStation> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
