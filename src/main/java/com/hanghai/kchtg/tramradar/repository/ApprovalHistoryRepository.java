package com.hanghai.kchtg.tramradar.repository;

import com.hanghai.kchtg.tramradar.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("tramRadarApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {

    List<ApprovalHistory> findByTramRadarIdOrderByApprovedDateDesc(java.util.UUID tramRadarId);
}
