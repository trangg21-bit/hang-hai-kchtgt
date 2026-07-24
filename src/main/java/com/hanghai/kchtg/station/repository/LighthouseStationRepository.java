package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.station.entity.LighthouseStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface LighthouseStationRepository extends JpaRepository<LighthouseStation, UUID> {
       boolean existsByCode(String code);

       @Query("SELECT d FROM LighthouseStation d WHERE " +
                     "(cast(:name as string) IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND "
                     +
                     "(cast(:code as string) IS NULL OR LOWER(d.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND "
                     +
                     "(:type IS NULL OR d.type = :type) AND " +
                     "(:status IS NULL OR d.status = :status)")
       List<LighthouseStation> searchFiltered(
                     @Param("name") String name,
                     @Param("code") String code,
                     @Param("type") String type,
                     @Param("status") String status);
    @Query("SELECT d FROM LighthouseStation d WHERE " +
            "d.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR d.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(d.name) LIKE :search OR LOWER(d.code) LIKE :search)")
    List<LighthouseStation> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
