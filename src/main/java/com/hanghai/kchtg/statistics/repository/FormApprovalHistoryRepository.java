package com.hanghai.kchtg.statistics.repository;

import java.util.UUID;

import com.hanghai.kchtg.statistics.entity.FormApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FormApprovalHistoryRepository extends JpaRepository<FormApprovalHistory, UUID> {

    List<FormApprovalHistory> findByFormIdOrderByCreatedAtDesc(UUID formId);
}

