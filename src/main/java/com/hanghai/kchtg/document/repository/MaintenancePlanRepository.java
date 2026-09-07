package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.MaintenancePlan;
import com.hanghai.kchtg.document.entity.MaintenanceStatus;
import com.hanghai.kchtg.document.entity.MaintenanceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenancePlanRepository extends JpaRepository<MaintenancePlan, UUID> {

    /** Find by equipment */
    List<MaintenancePlan> findByEquipment(String equipment);

    /** Find by status */
    List<MaintenancePlan> findByStatus(MaintenanceStatus status);

    /** Find by maintenance type */
    List<MaintenancePlan> findByMaintenanceType(MaintenanceType maintenanceType);

    /** Find by expected start date range */
    List<MaintenancePlan> findByEstimatedStartDateBetween(LocalDate start, LocalDate end);

    /** Count plans whose auto-generated code starts with the given prefix (for code generation). */
    long countByCodeStartingWith(String prefix);
}
