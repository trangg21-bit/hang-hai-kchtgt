package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.AttachedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachedDocumentRepository extends JpaRepository<AttachedDocument, UUID> {

    /** Find all attachments for a specific legal document */
    List<AttachedDocument> findByLegalDocumentId(UUID legalDocumentId);
}
