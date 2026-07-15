package com.hanghai.kchtg.gis.spatial.repository;

import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GisSpatialObjectRepository extends JpaRepository<GisSpatialObject, UUID> {

    Optional<GisSpatialObject> findByCode(String code);

    boolean existsByCode(String code);

    @Query(value = "SELECT COUNT(*) FROM gis_spatial_objects WHERE code = :code", nativeQuery = true)
    long countByCodeIncludingDeleted(@Param("code") String code);

    List<GisSpatialObject> findByGeometryType(GisGeometryType geometryType);

    List<GisSpatialObject> findByGeometryTypeAndObjectType(GisGeometryType geometryType, GisSpatialObjectType objectType);

    List<GisSpatialObject> findByGeometryTypeAndStatus(GisGeometryType geometryType, GisSpatialStatus status);

    Page<GisSpatialObject> findByGeometryTypeAndStatus(GisGeometryType geometryType, GisSpatialStatus status, Pageable pageable);

    Page<GisSpatialObject> findByGeometryTypeAndObjectTypeAndStatus(
            GisGeometryType geometryType, GisSpatialObjectType objectType, GisSpatialStatus status, Pageable pageable);

    @Query(value = "SELECT * FROM gis_spatial_objects p WHERE " +
            "p.geometry_type = :geometryTypeValue AND " +
            "(:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:code IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', :code, '%'))) AND " +
            "(:objectTypeValue IS NULL OR p.object_type = :objectTypeValue) AND " +
            "(:statusValue IS NULL OR p.status = :statusValue)", nativeQuery = true)
    List<GisSpatialObject> searchFiltered(
            @Param("geometryTypeValue") int geometryTypeValue,
            @Param("name") String name,
            @Param("code") String code,
            @Param("objectTypeValue") Integer objectTypeValue,
            @Param("statusValue") Integer statusValue
    );

    long countByGeometryTypeAndStatus(GisGeometryType geometryType, GisSpatialStatus status);

    List<GisSpatialObject> findByRefIdIn(List<UUID> refIds);

    List<GisSpatialObject> findByRefIdInAndRefType(List<UUID> refIds, com.hanghai.kchtg.gis.search.dto.KchtType refType);
}
