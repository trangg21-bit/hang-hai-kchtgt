package com.hanghai.kchtg.gis.polygon.repository;

import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface PolygonObjectRepository extends JpaRepository<PolygonObject, UUID> {

    Optional<PolygonObject> findByCode(String code);

    boolean existsByCode(String code);

    @Query(value = "SELECT COUNT(*) FROM gis_spatial_objects WHERE code = :code AND geometry_type = 3", nativeQuery = true)
    long countByCodeIncludingDeleted(@Param("code") String code);

    List<PolygonObject> findByObjectType(ObjectType objectType);

    List<PolygonObject> findByStatus(Status status);

    Page<PolygonObject> findByStatus(Status status, Pageable pageable);

    Page<PolygonObject> findByObjectTypeAndStatus(ObjectType objectType, Status status, Pageable pageable);

    List<PolygonObject> findByNameContainingIgnoreCase(String name);

    List<PolygonObject> findByCodeContainingIgnoreCase(String code);

    @Query(value = "SELECT * FROM gis_spatial_objects p WHERE " +
            "p.geometry_type = 3 AND p.ref_id IS NULL AND " +
            "(cast(:name as text) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', cast(:name as text), '%'))) AND " +
            "(cast(:code as text) IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', cast(:code as text), '%'))) AND " +
            "(cast(:objectType as integer) IS NULL OR p.object_type = cast(:objectType as integer)) AND " +
            "(cast(:status as integer) IS NULL OR p.status = cast(:status as integer))", nativeQuery = true)
    List<PolygonObject> searchFiltered(
            @Param("name") String name,
            @Param("code") String code,
            @Param("objectType") Integer objectType,
            @Param("status") Integer status
    );

    long countByStatus(Status status);
}