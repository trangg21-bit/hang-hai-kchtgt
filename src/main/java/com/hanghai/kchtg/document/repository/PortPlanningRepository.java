package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.entity.PortPlanning;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortPlanningRepository extends JpaRepository<PortPlanning, UUID> {

    boolean existsByProjectName(String projectName);

    boolean existsByProjectNameAndIdNot(String projectName, UUID id);

    Optional<PortPlanning> findByProjectName(String projectName);

    List<PortPlanning> findByStatus(PlanningStatus status);

    Page<PortPlanning> findByProjectNameContaining(String projectName, Pageable pageable);

    List<PortPlanning> findByApprovalDateBetween(LocalDate start, LocalDate end);

    @Query("SELECT q FROM PortPlanning q WHERE " +
            "(cast(:keyword as string) IS NULL OR LOWER(q.projectName) LIKE :keyword) AND " +
            "(:status IS NULL OR q.status = :status) AND " +
            "(cast(:yearStart as date) IS NULL OR q.approvalDate >= :yearStart) AND " +
            "(cast(:yearEnd as date) IS NULL OR q.approvalDate <= :yearEnd)")
    Page<PortPlanning> findAllWithSearch(
            @Param("keyword") String keyword,
            @Param("status") PlanningStatus status,
            @Param("yearStart") LocalDate yearStart,
            @Param("yearEnd") LocalDate yearEnd,
            Pageable pageable);
}
