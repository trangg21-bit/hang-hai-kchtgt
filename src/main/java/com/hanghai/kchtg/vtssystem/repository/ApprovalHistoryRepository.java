package com.hanghai.kchtg.vtssystem.repository;

import java.util.UUID;

import com.hanghai.kchtg.vtssystem.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("vtsApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, UUID> {

    List<ApprovalHistory> findByVtsSystemIdOrderByApprovedDateDesc(UUID vtsSystemId);
}
