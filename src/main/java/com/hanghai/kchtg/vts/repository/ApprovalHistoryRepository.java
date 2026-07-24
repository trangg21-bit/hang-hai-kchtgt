package com.hanghai.kchtg.vts.repository;

import com.hanghai.kchtg.vts.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("vtsApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {

    List<ApprovalHistory> findByHeThongVTSIdOrderByApprovedDateDesc(java.util.UUID heThongVTSId);
}
