package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.ApprovalRecord;
import com.hanghai.kchtg.assetmovement.entity.ApprovalResult;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalRecordRepository extends JpaRepository<ApprovalRecord, UUID> {

    List<ApprovalRecord> findByRequestId(UUID requestId);

    Page<ApprovalRecord> findByRequestId(UUID requestId, Pageable pageable);

    List<ApprovalRecord> findByResult(ApprovalResult result);

    Page<ApprovalRecord> findByResult(ApprovalResult result, Pageable pageable);

    Page<ApprovalRecord> findByRequestIdAndResult(UUID requestId, ApprovalResult result, Pageable pageable);

    List<ApprovalRecord> findByApprovalLevel(ApprovalLevel approvalLevel);
}
