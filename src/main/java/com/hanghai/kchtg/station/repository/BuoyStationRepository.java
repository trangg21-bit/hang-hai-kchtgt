package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.entity.StationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BuoyStationRepository extends JpaRepository<BuoyStation, UUID> {
       boolean existsByCode(String code);

       List<BuoyStation> findByPortIdAndDeletedAtIsNull(UUID portId);

       @Query("SELECT p FROM BuoyStation p WHERE " +
                     "(cast(:name as string) IS NULL OR CAST(function('immutable_unaccent', LOWER(p.name)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', cast(:name as string), '%'))) AS string)) AND "
                     +
                     "(cast(:code as string) IS NULL OR CAST(function('immutable_unaccent', LOWER(p.code)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', cast(:code as string), '%'))) AS string)) AND "
                     +
                     "(:type IS NULL OR p.type = :type) AND " +
                     "(:status IS NULL OR p.status = :status) AND " +
                     "(:unitId IS NULL OR p.unitId = :unitId) AND " +
                     "(:province IS NULL OR p.province = :province) AND " +
                     "(:portId IS NULL OR p.portId = :portId) AND " +
                     "(:operatingOrgId IS NULL OR p.operatingOrgId = :operatingOrgId)")
       List<BuoyStation> searchFiltered(
                     @Param("name") String name,
                     @Param("code") String code,
                     @Param("type") String type,
                     @Param("status") StationStatus status,
                     @Param("unitId") UUID unitId,
                     @Param("province") String province,
                     @Param("portId") UUID portId,
                     @Param("operatingOrgId") UUID operatingOrgId);
    @Query("SELECT p FROM BuoyStation p WHERE " +
            "p.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR p.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR CAST(function('immutable_unaccent', LOWER(p.name)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CAST(:search AS string))) AS string) OR CAST(function('immutable_unaccent', LOWER(p.code)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CAST(:search AS string))) AS string))")
    List<BuoyStation> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
