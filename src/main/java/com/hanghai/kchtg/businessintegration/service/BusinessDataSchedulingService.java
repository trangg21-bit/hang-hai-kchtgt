package com.hanghai.kchtg.businessintegration.service;

import com.hanghai.kchtg.businessintegration.entity.BusinessDataIntegrationRecord;
import com.hanghai.kchtg.businessintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.businessintegration.repository.BusinessDataIntegrationRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BusinessDataSchedulingService {

    @Autowired
    private BusinessDataIntegrationRecordRepository repository;

    @Scheduled(fixedRate = 60000)
    public void processPendingIntegrations() {
        List<BusinessDataIntegrationRecord> pending = repository.findByStatus(IntegrationStatus.PENDING);
        for (BusinessDataIntegrationRecord record : pending) {
            processRecord(record);
        }
    }

    @Scheduled(fixedRate = 30000)
    public void retryFailedIntegrations() {
        List<BusinessDataIntegrationRecord> failed = repository.findByStatus(IntegrationStatus.FAILED);
        for (BusinessDataIntegrationRecord record : failed) {
            if (record.getRetryCount() < 3) {
                record.setStatus(IntegrationStatus.RETRYING);
                record.setUpdatedAt(LocalDateTime.now());
                repository.save(record);
            }
        }
    }

    private void processRecord(BusinessDataIntegrationRecord record) {
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
