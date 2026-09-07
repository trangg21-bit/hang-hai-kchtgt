package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.Incident;
import com.hanghai.kchtg.document.entity.ProcessingStatus;
import com.hanghai.kchtg.document.entity.SeverityLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    List<Incident> findByProcessingStatus(ProcessingStatus processingStatus);

    List<Incident> findBySeverityLevel(SeverityLevel severityLevel);

    Page<Incident> findByLocationContainingIgnoreCase(String location, Pageable pageable);

    Page<Incident> findByDescriptionContainingIgnoreCase(String description, Pageable pageable);

    /**
     * Đếm sự cố của một đơn vị — dùng để sinh mã tự động SC-%06d (D11).
     */
    long countByOrgUnitId(UUID orgUnitId);

    /**
     * Tìm kiếm + bộ lọc danh sách sự cố (F-131 §7.1).
     * keyword/type/damage phải được bọc "%...%" trước khi truyền (house style);
     * @DataScope bật orgUnitFilter nên truy vấn tự giới hạn theo đơn vị.
     */
    @Query("SELECT q FROM Incident q WHERE " +
            "(:keyword IS NULL OR LOWER(q.code) LIKE :keyword OR LOWER(q.location) LIKE :keyword " +
            "OR LOWER(q.description) LIKE :keyword OR LOWER(q.infrastructureName) LIKE :keyword) AND " +
            "(:status IS NULL OR q.processingStatus = :status) AND " +
            "(:type IS NULL OR LOWER(q.incidentType) LIKE :type) AND " +
            "(:damage IS NULL OR LOWER(q.damageStatus) LIKE :damage) AND " +
            "(cast(:occurredFrom as timestamp) IS NULL OR q.discoveryTime >= :occurredFrom) AND " +
            "(cast(:occurredTo as timestamp) IS NULL OR q.discoveryTime <= :occurredTo)")
    Page<Incident> findAllWithSearch(
            @Param("keyword") String keyword,
            @Param("status") ProcessingStatus status,
            @Param("type") String type,
            @Param("damage") String damage,
            @Param("occurredFrom") LocalDateTime occurredFrom,
            @Param("occurredTo") LocalDateTime occurredTo,
            Pageable pageable);
}
