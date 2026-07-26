package com.hanghai.kchtg.assetmovement.repository;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.entity.InventoryReport;
import com.hanghai.kchtg.assetmovement.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryReportRepository extends JpaRepository<InventoryReport, UUID> {

    List<InventoryReport> findByPlanId(UUID planId);

    List<InventoryReport> findByStatus(ReportStatus status);

    Page<InventoryReport> findByPlanId(UUID planId, Pageable pageable);
}
