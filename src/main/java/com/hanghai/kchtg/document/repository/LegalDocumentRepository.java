package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.LegalDocument;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface LegalDocumentRepository extends JpaRepository<LegalDocument, UUID> {

        boolean existsByDocumentNumber(String documentNumber);

        boolean existsByDocumentNumberAndIdNot(String documentNumber, UUID id);

        /** Find by legal status */
        List<LegalDocument> findByValidityStatus(ValidityStatus validityStatus);

        /** Find by document type */
        List<LegalDocument> findByDocumentType(DocumentType documentType);

        /** Search by document name (partial match) */
        List<LegalDocument> findByDocumentNameContaining(String documentName);

        /** Search by issuing body (partial match) */
        List<LegalDocument> findByIssuingAuthorityContaining(String issuingAuthority);

        List<LegalDocument> findByExpirationDateBetweenAndValidityStatus(LocalDate start, LocalDate end, ValidityStatus status);

    /** Find documents past their expiration date with active statuses (for EXPIRED transition). */
    List<LegalDocument> findByExpirationDateBeforeAndValidityStatusIn(LocalDate date, List<ValidityStatus> statuses);

        /**
         * Dynamic JPQL search with pagination (F-135).
         */
    @Query("SELECT v FROM LegalDocument v WHERE " +
            "(cast(:keyword as string) IS NULL OR LOWER(v.documentName) LIKE :keyword) AND " +
            "(cast(:coQuan as string) IS NULL OR LOWER(v.issuingAuthority) LIKE :coQuan) AND " +
            "(cast(:applicationArea as string) IS NULL OR LOWER(v.applicationArea) LIKE :applicationArea) AND " +
            "(:loai IS NULL OR v.documentType = :loai) AND " +
            "(:tinhTrang IS NULL OR v.validityStatus = :tinhTrang) AND " +
            "(cast(:yearStart as date) IS NULL OR v.issueDate >= :yearStart) AND " +
            "(cast(:yearEnd as date) IS NULL OR v.issueDate <= :yearEnd)")
    Page<LegalDocument> searchDocuments(
            String keyword, String coQuan, String applicationArea, DocumentType loai, ValidityStatus tinhTrang,
            LocalDate yearStart, LocalDate yearEnd, Pageable pageable);
}
