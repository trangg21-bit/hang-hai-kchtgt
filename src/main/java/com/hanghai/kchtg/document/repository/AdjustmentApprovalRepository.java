package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.AdjustmentApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdjustmentApprovalRepository extends JpaRepository<AdjustmentApproval, UUID> {

    /** Find all approvals for a specific adjustment */
    List<AdjustmentApproval> findByPlanningAdjustmentId(UUID planningAdjustmentId);
}
