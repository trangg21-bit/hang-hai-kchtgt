package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoastalStationHaiphongRepository extends JpaRepository<CoastalStationHaiphong, UUID>, JpaSpecificationExecutor<CoastalStationHaiphong> {

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.portName = :portName AND c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findByPortName(@Param("portName") String portName);

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.code = :code AND c.deletedAt IS NULL")
    Optional<CoastalStationHaiphong> findByCode(@Param("code") String code);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findAllActive();

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.portName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationHaiphong> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findByDeletedAtIsNull();

    /**
     * Danh sách Đài TTXLTT.
     *
     * KHÔNG đặt ORDER BY cố định: JPA nối ORDER BY của {@link Pageable} vào SAU
     * mệnh đề có sẵn, nên cố định ở đây là vô hiệu hóa cột người dùng chọn.
     */
    @Query("""
        SELECT t FROM CoastalStationHaiphong t
        LEFT JOIN OrgUnit o ON o.id = t.orgUnitId
        LEFT JOIN OperatingOrganization oo ON oo.id = t.operatingOrgId
        LEFT JOIN OrgUnit oorg ON oorg.id = t.operatingOrgId
        LEFT JOIN User uu ON uu.id = t.updatedBy
        LEFT JOIN User us ON us.id = t.submittedBy
        LEFT JOIN User ua1 ON ua1.id = t.approverLevel1
        LEFT JOIN User ua2 ON ua2.id = t.approverLevel2
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:operatingOrgId IS NULL OR t.operatingOrgId = :operatingOrgId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.name, ''))) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, ''))) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.locationAddress, ''))) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.portName, ''))) AS string) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PENDING_APPROVAL AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PROPOSED)
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2))
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED))
          AND (:updatedBy IS NULL OR t.updatedBy = :updatedBy)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
    """)
    Page<CoastalStationHaiphong> searchPaged(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("operatingOrgId") UUID operatingOrgId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("updatedBy") UUID updatedBy,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    /**
     * Số đếm trên tab trạng thái phải áp CÙNG bộ lọc như danh sách (trừ chính
     * trạng thái phê duyệt).
     */
    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM CoastalStationHaiphong t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.name, ''))) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, ''))) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.locationAddress, ''))) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.portName, ''))) AS string) LIKE CAST(:keyword AS string)
              ))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:operatingOrgId IS NULL OR t.operatingOrgId = :operatingOrgId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:updatedBy IS NULL OR t.updatedBy = :updatedBy)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
        GROUP BY t.approvalStatus
    """)
    List<Object[]> countByApprovalStatus(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("operatingOrgId") UUID operatingOrgId,
        @Param("provinceId") Integer provinceId,
        @Param("updatedBy") UUID updatedBy,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo
    );

    @Query("""
        SELECT t FROM CoastalStationHaiphong t
        WHERE t.deletedAt IS NULL
          AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
        ORDER BY LOWER(t.name) ASC
    """)
    List<CoastalStationHaiphong> findApprovedOptions(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId
    );

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE " +
            "c.deletedAt IS NULL AND " +
            "(c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2) AND " +
            "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.code) LIKE :search)")
    List<CoastalStationHaiphong> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
