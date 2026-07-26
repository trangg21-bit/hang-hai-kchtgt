package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.PortPlanning;
import com.hanghai.kchtg.document.entity.PlanningStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PortPlanningRepository extends JpaRepository<PortPlanning, UUID> {

  boolean existsByProjectName(String projectName);

  boolean existsByProjectNameAndIdNot(String projectName, UUID id);

  /**
   * Find by planning status
   */
  List<PortPlanning> findByStatus(PlanningStatus status);

  /**
   * Search by project name (partial match)
   */
  Page<PortPlanning> findByProjectNameContaining(String projectName, Pageable pageable);

  /**
   * Find by approval date range
   */
  List<PortPlanning> findByApprovalDateBetween(LocalDate start, LocalDate end);

  /**
   * Dynamic JPQL search with pagination (F-133).
   */
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
