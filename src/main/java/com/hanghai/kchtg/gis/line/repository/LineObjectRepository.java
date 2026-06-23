package com.hanghai.kchtg.gis.line.repository;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
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
public interface LineObjectRepository extends JpaRepository<LineObject, UUID> {

    Optional<LineObject> findByCode(String code);

    boolean existsByCode(String code);

    List<LineObject> findByObjectType(ObjectType objectType);

    List<LineObject> findByStatus(Status status);

    Page<LineObject> findByStatus(Status status, Pageable pageable);

    Page<LineObject> findByObjectTypeAndStatus(ObjectType objectType, Status status, Pageable pageable);

    List<LineObject> findByNameContainingIgnoreCase(String name);

    List<LineObject> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT l FROM LineObject l WHERE " +
            "(:name IS NULL OR l.name LIKE %:name%) AND " +
            "(:code IS NULL OR l.code LIKE %:code%) AND " +
            "(:objectType IS NULL OR l.objectType = :objectType) AND " +
            "(:status IS NULL OR l.status = :status)")
    List<LineObject> searchFiltered(
            @Param("name") String name,
            @Param("code") String code,
            @Param("objectType") ObjectType objectType,
            @Param("status") Status status
    );

    long countByStatus(Status status);
}
