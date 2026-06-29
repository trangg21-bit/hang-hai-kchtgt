package com.hanghai.kchtg.datasharingaggregation.service;

import com.hanghai.kchtg.datasharingaggregation.dto.*;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import com.hanghai.kchtg.datasharingaggregation.entity.DataSharingAggregationRecord;
import com.hanghai.kchtg.datasharingaggregation.repository.DataSharingAggregationRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DataSharingAggregationService {

    private final DataSharingAggregationRecordRepository repository;

    public DataSharingAggregationService(DataSharingAggregationRecordRepository repository) {
        this.repository = repository;
    }

    public DataSharingAggregationResponse create(CreateDataSharingAggregationRequest req) {
        DataSharingAggregationRecord record = new DataSharingAggregationRecord();
        record.setId(UUID.randomUUID().toString());
        record.setSharingType(req.getSharingType());
        record.setTargetSystem(req.getTargetSystem());
        record.setSharePeriod(req.getSharePeriod());
        record.setDataPayload(req.getDataPayload());
        record.setStatus(SharingStatus.PENDING);
        record.setShareDate(req.getShareDate() != null ? req.getShareDate() : LocalDateTime.now());
        record.setRetryCount(0);
        record.setCreatedBy(req.getCreatedBy());
        record.setCreatedAt(LocalDateTime.now());
        DataSharingAggregationRecord saved = repository.save(record);
        return toResponse(saved);
    }

    public DataSharingAggregationResponse update(String id, UpdateDataSharingAggregationRequest req) {
        DataSharingAggregationRecord record = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Record not found: " + id));
        if (req.getTargetSystem() != null) record.setTargetSystem(req.getTargetSystem());
        if (req.getSharePeriod() != null) record.setSharePeriod(req.getSharePeriod());
        if (req.getDataPayload() != null) record.setDataPayload(req.getDataPayload());
        if (req.getStatus() != null) record.setStatus(req.getStatus());
        if (req.getErrorMessage() != null) record.setErrorMessage(req.getErrorMessage());
        record.setUpdatedBy(req.getUpdatedBy());
        record.setUpdatedAt(LocalDateTime.now());
        DataSharingAggregationRecord saved = repository.save(record);
        return toResponse(saved);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) throw new IllegalArgumentException("Record not found: " + id);
        repository.deleteById(id);
    }

    public DataSharingAggregationResponse getById(String id) {
        DataSharingAggregationRecord record = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Record not found: " + id));
        return toResponse(record);
    }

    public List<DataSharingAggregationResponse> getAll() {
        return repository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DataSharingAggregationResponse> filter(DataSharingAggregationFilter filter) {
        List<DataSharingAggregationRecord> records;
        if (filter.getSharingType() != null && filter.getStatus() != null) {
            records = repository.findBySharingTypeAndStatus(filter.getSharingType(), filter.getStatus());
        } else if (filter.getSharingType() != null) {
            records = repository.findBySharingType(filter.getSharingType());
        } else if (filter.getStatus() != null) {
            records = repository.findByStatus(filter.getStatus());
        } else {
            records = repository.findAll();
        }
        return records.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DataSharingAggregationSummary getSummary() {
        DataSharingAggregationSummary summary = new DataSharingAggregationSummary();
        summary.setTotalCount(repository.count());
        summary.setSuccessCount(repository.countByStatus(SharingStatus.SUCCESS));
        summary.setFailedCount(repository.countByStatus(SharingStatus.FAILED));
        summary.setPendingCount(repository.countByStatus(SharingStatus.PENDING));
        summary.setBySharingType(getByTypeStats());
        return summary;
    }

    private List<DataSharingAggregationSummary.SharingTypeStats> getByTypeStats() {
        List<DataSharingAggregationSummary.SharingTypeStats> stats = new ArrayList<>();
        for (SharingType type : SharingType.values()) {
            DataSharingAggregationSummary.SharingTypeStats stat = new DataSharingAggregationSummary.SharingTypeStats();
            stat.setType(type.name());
            stat.setCount(repository.countBySharingType(type));
            stats.add(stat);
        }
        return stats;
    }

    DataSharingAggregationResponse toResponse(DataSharingAggregationRecord record) {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setId(record.getId());
        resp.setSharingType(record.getSharingType());
        resp.setTargetSystem(record.getTargetSystem());
        resp.setSharePeriod(record.getSharePeriod());
        resp.setDataPayload(record.getDataPayload());
        resp.setStatus(record.getStatus());
        resp.setErrorMessage(record.getErrorMessage());
        resp.setShareDate(record.getShareDate());
        resp.setRetryCount(record.getRetryCount());
        resp.setCreatedBy(record.getCreatedBy());
        resp.setCreatedAt(record.getCreatedAt());
        return resp;
    }
}
