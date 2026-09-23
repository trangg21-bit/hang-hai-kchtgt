package com.hanghai.kchtg.gis.spatial.repository;

import com.hanghai.kchtg.gis.spatial.entity.SpatialObjectCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface SpatialObjectCategoryRepository extends JpaRepository<SpatialObjectCategory, UUID> {

    boolean existsByCodeAndGeometryType(String code, Integer geometryType);

    Page<SpatialObjectCategory> findAllByGeometryType(Integer geometryType, Pageable pageable);

    @Query("SELECT c FROM SpatialObjectCategory c WHERE " +
            "(:geometryType IS NULL OR c.geometryType = :geometryType) AND " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:iconId IS NULL OR c.iconId = :iconId) AND " +
            "(:isDeleted IS NULL OR (:isDeleted = true AND c.deletedAt IS NOT NULL) OR (:isDeleted = false AND c.deletedAt IS NULL)) AND " +
            "(cast(:code as string) IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND " +
            "(cast(:name as string) IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND " +
            "(cast(:search as string) IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', cast(:search as string), '%'))) AND " +
            "(cast(:fromUpdatedDate as timestamp) IS NULL OR c.updatedAt >= :fromUpdatedDate) AND " +
            "(cast(:toUpdatedDate as timestamp) IS NULL OR c.updatedAt <= :toUpdatedDate)")
    Page<SpatialObjectCategory> findAllWithFilters(
            @Param("geometryType") Integer geometryType,
            @Param("status") Integer status,
            @Param("isDeleted") Boolean isDeleted,
            @Param("iconId") UUID iconId,
            @Param("code") String code,
            @Param("name") String name,
            @Param("search") String search,
            @Param("fromUpdatedDate") LocalDateTime fromUpdatedDate,
            @Param("toUpdatedDate") LocalDateTime toUpdatedDate,
            Pageable pageable);
}
