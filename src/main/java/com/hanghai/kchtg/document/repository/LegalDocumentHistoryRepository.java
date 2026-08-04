package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.LegalDocumentHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LegalDocumentHistoryRepository extends JpaRepository<LegalDocumentHistory, UUID> {
    List<LegalDocumentHistory> findByLegalDocumentIdOrderByChangedAtDesc(UUID legalDocumentId);
}
