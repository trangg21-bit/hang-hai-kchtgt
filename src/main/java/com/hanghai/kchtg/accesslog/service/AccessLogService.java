package com.hanghai.kchtg.accesslog.service;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.AccessLogResponse;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Read-only service for access-log queries.
 * <p>
 * F-005 extends buildSpecification() to support type, severity, and keyword
 * filters.
 * </p>
 */
@Service
@Transactional(readOnly = true)
public class AccessLogService {

    private static final Logger log = LoggerFactory.getLogger(AccessLogService.class);

    private final AccessLogRepository repository;

    public AccessLogService(AccessLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Retrieve a single access-log entry by its primary key.
     */
    public AccessLogResponse findById(Long id) {
        AccessLog entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AccessLog not found: " + id));
        return new AccessLogResponse(entity);
    }

    /**
     * List access-log entries with optional filters, returned as a
     * Spring Data {@link Page} of {@link AccessLogResponse}.
     */
    public Page<AccessLogResponse> findAll(AccessLogFilterRequest filter, Pageable pageable) {
        Specification<AccessLog> spec = buildSpecification(filter);
        return repository.findAll(spec, pageable)
                .map(AccessLogResponse::new);
    }

    // ── Specification builder ────────────────────────────────────────

    private Specification<AccessLog> buildSpecification(AccessLogFilterRequest filter) {
        if (filter == null) {
            return null;
        }

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getUserId() != null) {
                predicates.add(cb.equal(root.get("userId"), filter.getUserId()));
            }
            if (filter.getModule() != null && !filter.getModule().isBlank()) {
                predicates.add(cb.equal(root.get("module"), filter.getModule().trim()));
            }
            if (filter.getAction() != null && !filter.getAction().isBlank()) {
                predicates.add(cb.equal(root.get("action"), filter.getAction().trim()));
            }
            if (filter.getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFrom()));
            }
            if (filter.getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getTo()));
            }

            // ── F-005 new filters ──────────────────────────────────────

            // Type filter
            if (filter.getType() != null && !filter.getType().isBlank()) {
                predicates.add(cb.equal(root.get("type"), LogType.fromValue(filter.getType())));
            }

            // Severity filter
            if (filter.getSeverity() != null && !filter.getSeverity().isBlank()) {
                predicates.add(cb.equal(root.get("severity"), LogSeverity.fromValue(filter.getSeverity())));
            }

            // Keyword search (case-insensitive LIKE on detail field)
            if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
                String keywordPattern = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("detail")), keywordPattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
