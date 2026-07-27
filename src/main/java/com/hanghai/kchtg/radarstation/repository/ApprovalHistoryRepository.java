package com.hanghai.kchtg.radarstation.repository;

import java.util.UUID;

import com.hanghai.kchtg.radarstation.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("radarStationApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, UUID> {

    List<ApprovalHistory> findByRadarStationIdOrderByApprovedDateDesc(UUID radarStationId);
}
