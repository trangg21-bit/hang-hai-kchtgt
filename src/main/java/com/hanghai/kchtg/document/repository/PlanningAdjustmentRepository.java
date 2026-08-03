package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.AdjustmentStatus;
import com.hanghai.kchtg.document.entity.PlanningAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlanningAdjustmentRepository extends JpaRepository<PlanningAdjustment, UUID> {

    /** Find all adjustments for a specific planning */
    List<PlanningAdjustment> findByPortPlanningId(UUID portPlanningId);

    /** Find by adjustment status */
    List<PlanningAdjustment> findByStatus(AdjustmentStatus status);
}
