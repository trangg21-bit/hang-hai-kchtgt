package com.hanghai.kchtg.datasharing.service;

import com.hanghai.kchtg.datasharing.entity.ShareHistory;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import com.hanghai.kchtg.datasharing.repository.ShareHistoryRepository;
import com.hanghai.kchtg.datasharing.repository.SharedDataRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShareWorkflowService {
    private final SharedDataRepository shareRepository;
    private final ShareHistoryRepository historyRepository;

    @Transactional
    public SharedData submitForShare(Long sharedDataId, String actor, String comments) {
        SharedData data = shareRepository.findById(sharedDataId)
            .orElseThrow(() -> new EntityNotFoundException("SharedData not found: " + sharedDataId));
        data.setStatus("SHARED");
        data.setSharedAt(LocalDate.now());
        shareRepository.save(data);
        saveHistory(sharedDataId, "SHARE", actor, data.getSharedWith(), comments);
        log.info("Share submitted by {}", actor);
        return data;
    }

    @Transactional
    public SharedData approveShare(Long sharedDataId, String actor, String comments) {
        SharedData data = shareRepository.findById(sharedDataId)
            .orElseThrow(() -> new EntityNotFoundException("SharedData not found: " + sharedDataId));
        data.setStatus("SHARED");
        data.setApprovedBy(actor);
        shareRepository.save(data);
        saveHistory(sharedDataId, "APPROVE", actor, data.getSharedWith(), comments);
        log.info("Share approved by {}", actor);
        return data;
    }

    @Transactional
    public SharedData revokeShare(Long sharedDataId, String actor, String comments) {
        SharedData data = shareRepository.findById(sharedDataId)
            .orElseThrow(() -> new EntityNotFoundException("SharedData not found: " + sharedDataId));
        data.setStatus("REVOKED");
        shareRepository.save(data);
        saveHistory(sharedDataId, "REVOKE", actor, data.getSharedWith(), comments);
        log.info("Share revoked by {}", actor);
        return data;
    }

    @Transactional(readOnly = true)
    public List<ShareHistory> getHistory(Long sharedDataId) {
        return historyRepository.findBySharedDataIdOrderByCreatedAtDesc(sharedDataId);
    }

    private void saveHistory(Long sharedDataId, String action, String actor, String recipient, String comments) {
        historyRepository.save(ShareHistory.builder()
            .sharedDataId(sharedDataId)
            .action(action)
            .actor(actor)
            .recipient(recipient)
            .comments(comments)
            .build());
    }
}
