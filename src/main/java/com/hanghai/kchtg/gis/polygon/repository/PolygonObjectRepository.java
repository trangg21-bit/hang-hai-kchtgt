package com.hanghai.kchtg.gis.polygon.repository;

import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PolygonObjectRepository extends JpaRepository<PolygonObject, UUID> {

    Optional<PolygonObject> findByCode(String code);

    boolean existsByCode(String code);

    List<PolygonObject> findByObjectType(ObjectType objectType);

    List<PolygonObject> findByStatus(Status status);

    Page<PolygonObject> findByStatus(Status status, Pageable pageable);

    Page<PolygonObject> findByObjectTypeAndStatus(ObjectType objectType, Status status, Pageable pageable);

    List<PolygonObject> findByNameContainingIgnoreCase(String name);

    List<PolygonObject> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT p FROM PolygonObject p WHERE " +
            "(:name IS NULL OR p.name LIKE %:name%) AND " +
            "(:code IS NULL OR p.code LIKE %:code%) AND " +
            "(:objectType IS NULL OR p.objectType = :objectType) AND " +
            "(:status IS NULL OR p.status = :status)")
    List<PolygonObject> searchFiltered(
            @Param("name") String name,
            @Param("code") String code,
            @Param("objectType") ObjectType objectType,
            @Param("status") Status status
    );

    long countByStatus(Status status);
}
