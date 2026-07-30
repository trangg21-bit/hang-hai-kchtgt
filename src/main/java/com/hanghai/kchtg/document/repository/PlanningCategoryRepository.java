package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.PlanningCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlanningCategoryRepository extends JpaRepository<PlanningCategory, UUID> {

    /** Find all metrics for a specific planning */
    List<PlanningCategory> findByPortPlanningId(UUID portPlanningId);
}
