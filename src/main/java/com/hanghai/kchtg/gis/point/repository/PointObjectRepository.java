package com.hanghai.kchtg.gis.point.repository;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
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
public interface PointObjectRepository extends JpaRepository<PointObject, UUID> {

    Optional<PointObject> findByCode(String code);

    boolean existsByCode(String code);

    List<PointObject> findByObjectType(ObjectType objectType);

    List<PointObject> findByStatus(Status status);

    Page<PointObject> findByStatus(Status status, Pageable pageable);

    Page<PointObject> findByObjectTypeAndStatus(ObjectType objectType, Status status, Pageable pageable);

    List<PointObject> findByNameContainingIgnoreCase(String name);

    List<PointObject> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT p FROM PointObject p WHERE " +
            "(:name IS NULL OR p.name LIKE %:name%) AND " +
            "(:code IS NULL OR p.code LIKE %:code%) AND " +
            "(:objectType IS NULL OR p.objectType = :objectType) AND " +
            "(:status IS NULL OR p.status = :status)")
    List<PointObject> searchFiltered(
            @Param("name") String name,
            @Param("code") String code,
            @Param("objectType") ObjectType objectType,
            @Param("status") Status status
    );

    @Query("SELECT p FROM PointObject p WHERE p.status = 'PUBLISHED' AND " +
            "ST_Distance(ST_GeomFromText(:pointWKT), " +
            "ST_Point(p.longitude, p.latitude)) <= :radius")
    List<PointObject> findByDistance(
            @Param("pointWKT") String pointWKT,
            @Param("radius") Double radius
    );

    long countByStatus(Status status);
}
