package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.OperationStatus;
import com.hanghai.kchtg.document.entity.OperationPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OperationPlanRepository extends JpaRepository<OperationPlan, UUID> {

    /** Find by operation date */
    List<OperationPlan> findByOperationDate(LocalDate operationDate);

    /** Find by status */
    List<OperationPlan> findByStatus(OperationStatus status);

    /** Find by structure (cầu cảng) */
    List<OperationPlan> findByPier(String pier);

    /** Find by equipment */
    List<OperationPlan> findByEquipment(String equipment);

    /**
     * Find schedules that conflict with a given date range on the same structure/equipment.
     * A conflict exists when two plans overlap in time.
     */
    @Query("SELECT k FROM OperationPlan k WHERE " +
            "k.status != 'HUY' AND " +
            "((:pier IS NULL OR k.pier = :pier) OR (:equipment IS NULL OR k.equipment = :equipment)) AND " +
            "k.operationDate = :operationDate AND " +
            "k.startTime < :endTime AND " +
            "k.endTime > :startTime")
    List<OperationPlan> findConflictSchedule(
            @Param("operationDate") LocalDate operationDate,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime,
            @Param("pier") String pier,
            @Param("equipment") String equipment);
}
