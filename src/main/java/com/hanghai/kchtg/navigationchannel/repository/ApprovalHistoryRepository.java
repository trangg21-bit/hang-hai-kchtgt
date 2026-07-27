package com.hanghai.kchtg.navigationchannel.repository;

import java.util.UUID;

import com.hanghai.kchtg.navigationchannel.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("navigationChannelApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, UUID> {

    List<ApprovalHistory> findByNavigationChannelIdOrderByApprovedDateDesc(UUID navigationChannelId);
}
