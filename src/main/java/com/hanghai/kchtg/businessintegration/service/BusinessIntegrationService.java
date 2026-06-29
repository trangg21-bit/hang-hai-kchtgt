package com.hanghai.kchtg.businessintegration.service;

import com.hanghai.kchtg.businessintegration.dto.*;
import com.hanghai.kchtg.businessintegration.entity.BusinessDataIntegrationRecord;
import com.hanghai.kchtg.businessintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import com.hanghai.kchtg.businessintegration.repository.BusinessDataIntegrationRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BusinessIntegrationService {

    @Autowired
    private BusinessDataIntegrationRecordRepository repository;

    public BusinessDataIntegrationResponse createIntegration(BusinessDataIntegrationRequest request) {
        BusinessDataIntegrationRecord record = new BusinessDataIntegrationRecord();
        record.setId(UUID.randomUUID().toString());
        record.setIntegrationType(request.getIntegrationType());
        record.setSourceSystem(request.getSourceSystem());
        record.setIntegrationPeriod(request.getIntegrationPeriod());
        record.setDataPayload(request.getDataPayload());
        record.setStatus(IntegrationStatus.PENDING);
        record.setIntegrationDate(LocalDateTime.now());
        record.setRetryCount(0);
        record.setCreatedAt(LocalDateTime.now());
        repository.save(record);
        return toResponse(record);
    }

    public List<BusinessDataIntegrationResponse> findByType(IntegrationType type) {
        return repository.findByIntegrationType(type).stream().map(this::toResponse).toList();
    }

    public List<BusinessDataIntegrationResponse> findByStatus(IntegrationStatus status) {
        return repository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    public BusinessDataIntegrationResponse findById(String id) {
        return repository.findById(id).map(this::toResponse).orElse(null);
    }

    public BusinessDataIntegrationResponse processIntegration(String id) {
        BusinessDataIntegrationRecord record = repository.findById(id)
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

    public BusinessIntegrationStatistics getStatistics() {
        BusinessIntegrationStatistics stats = new BusinessIntegrationStatistics();
        stats.setTotalCount(repository.count());
        stats.setSuccessCount(repository.countByStatus(IntegrationStatus.SUCCESS));
        stats.setFailedCount(repository.countByStatus(IntegrationStatus.FAILED));
        stats.setPendingCount(repository.countByStatus(IntegrationStatus.PENDING));
        stats.setSuccessRate(stats.getTotalCount() > 0 ?
            (double) stats.getSuccessCount() / stats.getTotalCount() * 100 : 0.0);
        return stats;
    }

    public List<BusinessIntegrationSummary> getIntegrationSummaries() {
        BusinessIntegrationStatistics stats = getStatistics();
        BusinessIntegrationSummary summary = new BusinessIntegrationSummary();
        summary.setIntegrationType("ALL");
        summary.setTotalRecords((int) stats.getTotalCount());
        summary.setSuccessRecords((int) stats.getSuccessCount());
        summary.setFailedRecords((int) stats.getFailedCount());
        return List.of(summary);
    }

    private BusinessDataIntegrationResponse toResponse(BusinessDataIntegrationRecord record) {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setId(record.getId());
        response.setIntegrationType(record.getIntegrationType() != null ? record.getIntegrationType().name() : null);
        response.setSourceSystem(record.getSourceSystem());
        response.setIntegrationPeriod(record.getIntegrationPeriod());
        response.setStatus(record.getStatus() != null ? record.getStatus().name() : null);
        response.setErrorMessage(record.getErrorMessage());
        response.setIntegrationDate(record.getIntegrationDate());
        response.setRetryCount(record.getRetryCount());
        return response;
    }
}
