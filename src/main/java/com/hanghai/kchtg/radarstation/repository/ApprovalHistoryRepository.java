package com.hanghai.kchtg.radarstation.repository;

import com.hanghai.kchtg.radarstation.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("radarStationApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {

    List<ApprovalHistory> findByRadarStationIdOrderByApprovedDateDesc(java.util.UUID radarStationId);
}
