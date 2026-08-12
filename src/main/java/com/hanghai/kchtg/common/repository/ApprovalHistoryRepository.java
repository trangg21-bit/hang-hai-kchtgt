package com.hanghai.kchtg.common.repository;

import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("commonApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, UUID> {

    List<ApprovalHistory> findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType refType, UUID refId);

    List<ApprovalHistory> findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType refType, UUID refId, Pageable pageable);

    List<ApprovalHistory> findByRefIdOrderByApprovedDateDesc(UUID refId);

    List<ApprovalHistory> findByRefIdOrderByApprovedDateDesc(UUID refId, Pageable pageable);
}
