package com.hanghai.kchtg.document.scheduler;

import com.hanghai.kchtg.document.entity.LegalDocument;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.entity.LegalDocumentHistoryAction;
import com.hanghai.kchtg.document.repository.LegalDocumentRepository;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class LegalDocumentExpiryScheduler {

    private final LegalDocumentRepository repo;
    private final LegalDocumentService legalDocumentService;

    /**
     * Chạy mỗi ngày lúc 08:00:
     * 1. Đánh dấu EXPIRING_SOON cho văn bản EFFECTIVE sắp hết hạn trong 30 ngày
     * 2. Đánh dấu EXPIRED cho văn bản đã quá ngày hết hiệu lực
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void checkExpiringDocuments() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);

        // 1. EFFECTIVE → EXPIRING_SOON (còn ≤ 30 ngày)
        List<LegalDocument> expiring = repo.findByExpirationDateBetweenAndValidityStatusAndDeletedAtIsNull(
            today, thirtyDaysFromNow, ValidityStatus.EFFECTIVE);
        for (LegalDocument doc : expiring) {
            log.warn("[EXPIRY-SCHEDULER] Văn bản {} ({}) sắp hết hiệu lực vào {}",
                doc.getDocumentNumber(), doc.getDocumentName(), doc.getExpirationDate());
            doc.setValidityStatus(ValidityStatus.EXPIRING_SOON);
            legalDocumentService.recordSystemHistory(doc, LegalDocumentHistoryAction.STATUS_CHANGED);
        }
        if (!expiring.isEmpty()) {
            repo.saveAll(expiring);
            log.info("[EXPIRY-SCHEDULER] Đã đánh dấu EXPIRING_SOON cho {} văn bản", expiring.size());
        }

        // 2. EFFECTIVE / EXPIRING_SOON → EXPIRED (đã quá ngày)
        List<ValidityStatus> activeStatuses = List.of(ValidityStatus.EFFECTIVE, ValidityStatus.EXPIRING_SOON);
        List<LegalDocument> overdue = repo.findByExpirationDateBeforeAndValidityStatusInAndDeletedAtIsNull(today, activeStatuses);
        for (LegalDocument doc : overdue) {
            log.warn("[EXPIRY-SCHEDULER] Văn bản {} ({}) đã hết hiệu lực từ {}",
                doc.getDocumentNumber(), doc.getDocumentName(), doc.getExpirationDate());
            doc.setValidityStatus(ValidityStatus.EXPIRED);
            legalDocumentService.recordSystemHistory(doc, LegalDocumentHistoryAction.STATUS_CHANGED);
        }
        if (!overdue.isEmpty()) {
            repo.saveAll(overdue);
            log.info("[EXPIRY-SCHEDULER] Đã đánh dấu EXPIRED cho {} văn bản", overdue.size());
        }

        if (expiring.isEmpty() && overdue.isEmpty()) {
            log.debug("[EXPIRY-SCHEDULER] Không có văn bản nào cần cập nhật trạng thái");
        }
    }
}
