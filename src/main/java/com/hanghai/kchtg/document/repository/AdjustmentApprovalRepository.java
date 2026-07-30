package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.AdjustmentApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AdjustmentApprovalRepository extends JpaRepository<AdjustmentApproval, UUID> {

    /** Find all approvals for a specific adjustment */
    List<AdjustmentApproval> findByPlanningAdjustmentId(UUID planningAdjustmentId);
}
