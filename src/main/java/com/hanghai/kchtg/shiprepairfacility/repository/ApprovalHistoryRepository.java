package com.hanghai.kchtg.shiprepairfacility.repository;

import com.hanghai.kchtg.shiprepairfacility.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("shipRepairApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, UUID> {

    List<ApprovalHistory> findByShipRepairFacilityIdOrderByApprovedDateDesc(UUID shipRepairFacilityId);
}
