package com.hanghai.kchtg.dikerevetment.repository;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DikeRevetmentApprovalHistoryRepository extends JpaRepository<DikeRevetmentApprovalHistory, UUID> {

    List<DikeRevetmentApprovalHistory> findByDikeRevetmentIdOrderByApprovalDateDesc(UUID dikeRevetmentId);
}
