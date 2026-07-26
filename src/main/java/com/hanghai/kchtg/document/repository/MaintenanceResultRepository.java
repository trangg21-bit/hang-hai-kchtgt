package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.MaintenanceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceResultRepository extends JpaRepository<MaintenanceResult, UUID> {

    /** Find all results for a specific maintenance plan */
    List<MaintenanceResult> findByMaintenancePlanId(UUID maintenancePlanId);
}
