package com.hanghai.kchtg.gis.line.repository;

import java.util.UUID;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface LineObjectRepository extends JpaRepository<LineObject, UUID> {

    Optional<LineObject> findByCode(String code);

    boolean existsByCode(String code);

    @Query(value = "SELECT COUNT(*) FROM gis_spatial_objects WHERE code = :code AND geometry_type = 2", nativeQuery = true)
    long countByCodeIncludingDeleted(@Param("code") String code);

    List<LineObject> findByObjectType(ObjectType objectType);

    List<LineObject> findByStatus(Status status);

    Page<LineObject> findByStatus(Status status, Pageable pageable);

    Page<LineObject> findByObjectTypeAndStatus(ObjectType objectType, Status status, Pageable pageable);

    List<LineObject> findByNameContainingIgnoreCase(String name);

    List<LineObject> findByCodeContainingIgnoreCase(String code);

    @Query(value = "SELECT * FROM gis_spatial_objects l WHERE " +
            "l.geometry_type = 2 AND l.ref_id IS NULL AND " +
            "(cast(:name as text) IS NULL OR LOWER(l.name) LIKE LOWER(CONCAT('%', cast(:name as text), '%'))) AND " +
            "(cast(:code as text) IS NULL OR LOWER(l.code) LIKE LOWER(CONCAT('%', cast(:code as text), '%'))) AND " +
            "(cast(:objectType as integer) IS NULL OR l.object_type = cast(:objectType as integer)) AND " +
            "(cast(:status as integer) IS NULL OR l.status = cast(:status as integer))", nativeQuery = true)
    List<LineObject> searchFiltered(
            @Param("name") String name,
            @Param("code") String code,
            @Param("objectType") Integer objectType,
            @Param("status") Integer status
    );

    long countByStatus(Status status);
}