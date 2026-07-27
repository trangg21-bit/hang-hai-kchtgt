package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.MaintenanceType;
import com.hanghai.kchtg.document.entity.MaintenanceStatus;
import com.hanghai.kchtg.document.entity.MaintenancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

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
}
