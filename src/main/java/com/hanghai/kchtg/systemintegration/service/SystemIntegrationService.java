package com.hanghai.kchtg.systemintegration.service;

import com.hanghai.kchtg.systemintegration.dto.*;
import com.hanghai.kchtg.systemintegration.entity.SystemIntegrationRecord;
import com.hanghai.kchtg.systemintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import com.hanghai.kchtg.systemintegration.repository.SystemIntegrationRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SystemIntegrationService {

    @Autowired
    private SystemIntegrationRecordRepository repository;

    public SystemIntegrationResponse createIntegration(SystemIntegrationRequest request) {
        SystemIntegrationRecord record = new SystemIntegrationRecord();
        record.setId(UUID.randomUUID().toString());
        record.setIntegrationType(request.getIntegrationType());
        record.setSourceSystem(request.getSourceSystem());
        record.setTargetSystem(request.getTargetSystem());
        record.setDataPayload(request.getDataPayload());
        record.setStatus(IntegrationStatus.PENDING);
        record.setIntegrationDate(LocalDateTime.now());
        record.setRetryCount(0);
        record.setCreatedAt(LocalDateTime.now());
        repository.save(record);
        return toResponse(record);
    }

    public List<SystemIntegrationResponse> findByType(IntegrationType type) {
        return repository.findByIntegrationType(type).stream().map(this::toResponse).toList();
    }

    public List<SystemIntegrationResponse> findByStatus(IntegrationStatus status) {
        return repository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    public SystemIntegrationResponse findById(String id) {
        return repository.findById(id).map(this::toResponse).orElse(null);
    }

    public SystemIntegrationResponse processIntegration(String id) {
        SystemIntegrationRecord record = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Record not found: " + id));
        record.setStatus(IntegrationStatus.IN_PROGRESS);
        record.setUpdatedAt(LocalDateTime.now());
        repository.save(record);
        try {
            record.setStatus(IntegrationStatus.SUCCESS);
        } catch (Exception e) {
            record.setStatus(IntegrationStatus.FAILED);
            record.setErrorMessage(e.getMessage());
            record.setRetryCount(record.getRetryCount() + 1);
        }
        record.setUpdatedAt(LocalDateTime.now());
        repository.save(record);
        return toResponse(record);
    }

    public IntegrationStatistics getStatistics() {
        IntegrationStatistics stats = new IntegrationStatistics();
        stats.setTotalCount(repository.count());
        stats.setSuccessCount(repository.countByStatus(IntegrationStatus.SUCCESS));
        stats.setFailedCount(repository.countByStatus(IntegrationStatus.FAILED));
        stats.setPendingCount(repository.countByStatus(IntegrationStatus.PENDING));
        stats.setRetryingCount(repository.countByStatus(IntegrationStatus.RETRYING));
        stats.setSuccessRate(stats.getTotalCount() > 0 ?
            (double) stats.getSuccessCount() / stats.getTotalCount() * 100 : 0.0);
        return stats;
    }

    public List<IntegrationSummary> getIntegrationSummaries() {
        IntegrationStatistics stats = getStatistics();
        IntegrationSummary summary = new IntegrationSummary();
        summary.setIntegrationType("ALL");
        summary.setTotalRecords((int) stats.getTotalCount());
        summary.setSuccessRecords((int) stats.getSuccessCount());
        summary.setFailedRecords((int) stats.getFailedCount());
        return List.of(summary);
    }

    private SystemIntegrationResponse toResponse(SystemIntegrationRecord record) {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setId(record.getId());
        response.setIntegrationType(record.getIntegrationType().name());
        response.setSourceSystem(record.getSourceSystem());
        response.setTargetSystem(record.getTargetSystem());
        response.setStatus(record.getStatus().name());
        response.setErrorMessage(record.getErrorMessage());
        response.setIntegrationDate(record.getIntegrationDate());
        response.setRetryCount(record.getRetryCount());
        return response;
    }
}
