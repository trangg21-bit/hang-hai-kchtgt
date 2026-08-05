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

        boolean existsByDocumentNumberAndDeletedAtIsNull(String documentNumber);

        boolean existsByDocumentNumberAndIdNotAndDeletedAtIsNull(String documentNumber, UUID id);

        /** Find by legal status */
        List<LegalDocument> findByValidityStatusAndDeletedAtIsNull(ValidityStatus validityStatus);

        /** Find by document type */
        List<LegalDocument> findByDocumentTypeAndDeletedAtIsNull(DocumentType documentType);

        /** Search by document name (partial match) */
        List<LegalDocument> findByDocumentNameContainingAndDeletedAtIsNull(String documentName);

        /** Search by issuing body (partial match) */
        List<LegalDocument> findByIssuingAuthorityContainingAndDeletedAtIsNull(String issuingAuthority);

        List<LegalDocument> findByExpirationDateBetweenAndValidityStatusAndDeletedAtIsNull(
                LocalDate start, LocalDate end, ValidityStatus status);

    /** Find documents past their expiration date with active statuses (for EXPIRED transition). */
    List<LegalDocument> findByExpirationDateBeforeAndValidityStatusInAndDeletedAtIsNull(
            LocalDate date, List<ValidityStatus> statuses);

        @Query("SELECT v FROM LegalDocument v WHERE v.deletedAt IS NULL")
        List<LegalDocument> findActive(org.springframework.data.domain.Sort sort);

        @Query("SELECT v FROM LegalDocument v WHERE v.deletedAt IS NULL")
        Page<LegalDocument> findActive(Pageable pageable);

        /**
         * Dynamic JPQL search with pagination (F-135).
         */
    @Query("SELECT v FROM LegalDocument v WHERE v.deletedAt IS NULL AND " +
            "(cast(:keyword as string) IS NULL OR LOWER(v.documentName) LIKE :keyword) AND " +
            "(cast(:documentNumber as string) IS NULL OR LOWER(v.documentNumber) LIKE :documentNumber) AND " +
            "(cast(:coQuan as string) IS NULL OR LOWER(v.issuingAuthority) LIKE :coQuan) AND " +
            "(cast(:applicationArea as string) IS NULL OR LOWER(v.applicationArea) LIKE :applicationArea) AND " +
            "(:loai IS NULL OR v.documentType = :loai) AND " +
            "(:tinhTrang IS NULL OR v.validityStatus = :tinhTrang) AND " +
            "(cast(:issueDateStart as date) IS NULL OR v.issueDate >= :issueDateStart) AND " +
            "(cast(:issueDateEnd as date) IS NULL OR v.issueDate <= :issueDateEnd) AND " +
            "(cast(:effectiveDateStart as date) IS NULL OR v.effectiveDate >= :effectiveDateStart) AND " +
            "(cast(:effectiveDateEnd as date) IS NULL OR v.effectiveDate <= :effectiveDateEnd)")
    Page<LegalDocument> searchDocuments(
            String keyword, String documentNumber, String coQuan, String applicationArea,
            DocumentType loai, ValidityStatus tinhTrang, LocalDate issueDateStart, LocalDate issueDateEnd,
            LocalDate effectiveDateStart, LocalDate effectiveDateEnd, Pageable pageable);

    /** Count active documents grouped by validity status. */
    @Query("SELECT v.validityStatus, COUNT(v) FROM LegalDocument v WHERE v.deletedAt IS NULL GROUP BY v.validityStatus")
    List<Object[]> countByValidityStatus();
}
