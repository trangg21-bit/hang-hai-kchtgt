package com.hanghai.kchtg.gis.point.repository;

import java.util.UUID;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface PointObjectRepository extends JpaRepository<PointObject, UUID> {

    Optional<PointObject> findByCode(String code);

    boolean existsByCode(String code);

    @Query(value = "SELECT COUNT(*) FROM gis_spatial_objects WHERE code = :code AND geometry_type = 1", nativeQuery = true)
    long countByCodeIncludingDeleted(@Param("code") String code);

    List<PointObject> findByObjectType(ObjectType objectType);

    List<PointObject> findByStatus(Status status);

    Page<PointObject> findByStatus(Status status, Pageable pageable);

    Page<PointObject> findByObjectTypeAndStatus(ObjectType objectType, Status status, Pageable pageable);

    List<PointObject> findByNameContainingIgnoreCase(String name);

    List<PointObject> findByCodeContainingIgnoreCase(String code);

    @Query(value = "SELECT * FROM gis_spatial_objects p WHERE " +
            "p.geometry_type = 1 AND p.ref_id IS NULL AND " +
            "(cast(:name as text) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', cast(:name as text), '%'))) AND " +
            "(cast(:code as text) IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', cast(:code as text), '%'))) AND " +
            "(cast(:objectType as integer) IS NULL OR p.object_type = cast(:objectType as integer)) AND " +
            "(cast(:status as integer) IS NULL OR p.status = cast(:status as integer))", nativeQuery = true)
    List<PointObject> searchFiltered(
            @Param("name") String name,
            @Param("code") String code,
            @Param("objectType") Integer objectType,
            @Param("status") Integer status
    );

    @Query(value = "SELECT * FROM gis_spatial_objects p WHERE p.geometry_type = 1 AND p.status = 4 AND " +
            "ST_Distance(ST_GeomFromText(:pointWKT, 4326), p.geom) <= :radius", nativeQuery = true)
    List<PointObject> findByDistance(
            @Param("pointWKT") String pointWKT,
            @Param("radius") Double radius
    );

    long countByStatus(Status status);
}