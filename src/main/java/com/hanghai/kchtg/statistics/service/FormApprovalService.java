package com.hanghai.kchtg.statistics.service;

import com.hanghai.kchtg.statistics.entity.FormApprovalHistory;
import com.hanghai.kchtg.statistics.entity.StatFormStatus;
import com.hanghai.kchtg.statistics.entity.StatisticsForm;
import com.hanghai.kchtg.statistics.repository.FormApprovalHistoryRepository;
import com.hanghai.kchtg.statistics.repository.StatisticsFormRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Handles the approval lifecycle for statistics forms:
 *   draft -> submit -> approve / reject.
 *
 * Each action is recorded in {@code form_approval_history}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FormApprovalService {

    private final StatisticsFormRepository formRepository;
    private final FormApprovalHistoryRepository historyRepository;

    // -- Actions --

    @Transactional
    public StatisticsForm submitForm(Long formId, String actor, String comments) {
        StatisticsForm form = formRepository.findById(formId)
                .orElseThrow(() -> new EntityNotFoundException("Form not found: " + formId));
        form.setFormStatus(StatFormStatus.SUBMITTED);
        form.setUpdatedAt(Instant.now());
        formRepository.save(form);
        saveHistory(formId, "SUBMIT", actor, comments);
        log.info("Form [{}] submitted by {}", formId, actor);
        return form;
    }

    @Transactional
    public StatisticsForm approveForm(Long formId, String actor, String comments) {
        StatisticsForm form = formRepository.findById(formId)
                .orElseThrow(() -> new EntityNotFoundException("Form not found: " + formId));
        form.setFormStatus(StatFormStatus.APPROVED);
        form.setApprovedBy(actor);
        form.setUpdatedAt(Instant.now());
        formRepository.save(form);
        saveHistory(formId, "APPROVE", actor, comments);
        log.info("Form [{}] approved by {}", formId, actor);
        return form;
    }

    @Transactional
    public StatisticsForm rejectForm(Long formId, String actor, String comments) {
        StatisticsForm form = formRepository.findById(formId)
                .orElseThrow(() -> new EntityNotFoundException("Form not found: " + formId));
        form.setFormStatus(StatFormStatus.REJECTED);
        form.setUpdatedAt(Instant.now());
        formRepository.save(form);
        saveHistory(formId, "REJECT", actor, comments);
        log.info("Form [{}] rejected by {}", formId, actor);
        return form;
    }

    // -- History --

    @Transactional(readOnly = true)
    public List<FormApprovalHistory> getHistory(Long formId) {
        return historyRepository.findByFormIdOrderByCreatedAtDesc(formId);
    }

    // -- Internal --

    private void saveHistory(Long formId, String action, String actor, String comments) {
        historyRepository.save(FormApprovalHistory.builder()
                .formId(formId)
                .action(action)
                .actor(actor)
                .comments(comments)
                .build());
    }
}
