package com.hanghai.kchtg.systemintegration.service;

import com.hanghai.kchtg.systemintegration.entity.SystemIntegrationRecord;
import com.hanghai.kchtg.systemintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.systemintegration.repository.SystemIntegrationRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class IntegrationSchedulingService {

    @Autowired
    private SystemIntegrationRecordRepository repository;

    @Scheduled(fixedRate = 60000)
    public void processPendingIntegrations() {
        List<SystemIntegrationRecord> pending = repository.findByStatus(IntegrationStatus.PENDING);
        for (SystemIntegrationRecord record : pending) {
            processRecord(record);
        }
    }

    @Scheduled(fixedRate = 30000)
    public void retryFailedIntegrations() {
        List<SystemIntegrationRecord> failed = repository.findByStatus(IntegrationStatus.FAILED);
        for (SystemIntegrationRecord record : failed) {
            if (record.getRetryCount() < 3) {
                record.setStatus(IntegrationStatus.RETRYING);
                record.setUpdatedAt(LocalDateTime.now());
                repository.save(record);
            }
        }
    }

    private void processRecord(SystemIntegrationRecord record) {
        record.setStatus(IntegrationStatus.IN_PROGRESS);
        record.setUpdatedAt(LocalDateTime.now());
        repository.save(record);
        try {
            record.setStatus(IntegrationStatus.SUCCESS);
        } catch (Exception e) {
            record.setStatus(IntegrationStatus.FAILED);
            record.setErrorMessage(e.getMessage());
        }
        record.setUpdatedAt(LocalDateTime.now());
        repository.save(record);
    }
}
