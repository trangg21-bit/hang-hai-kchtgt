package com.hanghai.kchtg.datasharingaggregation.service;

import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.entity.DataSharingAggregationRecord;
import com.hanghai.kchtg.datasharingaggregation.repository.DataSharingAggregationRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DataSharingAggregationSchedulingService {

    private static final Logger log = LoggerFactory.getLogger(DataSharingAggregationSchedulingService.class);

    private final DataSharingAggregationRecordRepository repository;

    public DataSharingAggregationSchedulingService(DataSharingAggregationRecordRepository repository) {
        this.repository = repository;
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void processPendingSharing() {
        List<DataSharingAggregationRecord> pending = repository.findByStatus(SharingStatus.PENDING);
        for (DataSharingAggregationRecord record : pending) {
            log.info("Processing pending sharing record: {} (type: {})", record.getId(), record.getSharingType());
            try {
                record.setStatus(SharingStatus.SHARING);
                record.setUpdatedAt(LocalDateTime.now());
                repository.save(record);
                record.setStatus(SharingStatus.SUCCESS);
                record.setUpdatedAt(LocalDateTime.now());
                repository.save(record);
            } catch (Exception e) {
                record.setStatus(SharingStatus.FAILED);
                record.setErrorMessage(e.getMessage());
                record.setRetryCount(record.getRetryCount() + 1);
                record.setUpdatedAt(LocalDateTime.now());
                repository.save(record);
                log.error("Failed to process sharing record: {}", record.getId(), e);
            }
        }
    }

    @Scheduled(cron = "0 */5 * * * ?")
    public void retryFailedRecords() {
        List<DataSharingAggregationRecord> failed = repository.findByStatus(SharingStatus.FAILED);
        for (DataSharingAggregationRecord record : failed) {
            if (record.getRetryCount() < 3) {
                record.setStatus(SharingStatus.RETRYING);
                record.setUpdatedAt(LocalDateTime.now());
                repository.save(record);
            }
        }
    }
}
