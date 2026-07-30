package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.AttachedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachedDocumentRepository extends JpaRepository<AttachedDocument, UUID> {

    /** Find all attachments for a specific legal document */
    List<AttachedDocument> findByLegalDocumentId(UUID legalDocumentId);
}
