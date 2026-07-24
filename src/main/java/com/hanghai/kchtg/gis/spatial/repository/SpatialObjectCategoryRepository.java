package com.hanghai.kchtg.gis.spatial.repository;

import com.hanghai.kchtg.gis.spatial.entity.SpatialObjectCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Repository
public interface SpatialObjectCategoryRepository extends JpaRepository<SpatialObjectCategory, UUID> {
    
    boolean existsByCodeAndGeometryType(String code, Integer geometryType);
    
    Page<SpatialObjectCategory> findAllByGeometryType(Integer geometryType, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM SpatialObjectCategory c WHERE " +
            "(:geometryType IS NULL OR c.geometryType = :geometryType) AND " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(cast(:search as string) IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', cast(:search as string), '%')))")
    Page<SpatialObjectCategory> findAllWithFilters(
            @org.springframework.data.repository.query.Param("geometryType") Integer geometryType,
            @org.springframework.data.repository.query.Param("status") Integer status,
            @org.springframework.data.repository.query.Param("search") String search,
            Pageable pageable);
}
