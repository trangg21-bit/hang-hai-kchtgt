package com.hanghai.kchtg.accesslog.service;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.AccessLogResponse;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
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
import java.util.UUID;

/**
 * Read-only service for access-log queries.
 * <p>
 * The access-log is an audit artifact — entries are created by a
 * cross-cutting aspect (not implemented here). This service only
 * provides query operations.
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
     *
     * @param id the entry ID
     * @return the response DTO
     * @throws EntityNotFoundException if the entry does not exist
     */
    public AccessLogResponse findById(UUID id) {
        AccessLog entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AccessLog not found: " + id));
        return new AccessLogResponse(entity);
    }

    /**
     * List access-log entries with optional filters, returned as a
     * Spring Data {@link Page} of {@link AccessLogResponse}.
     *
     * @param filter   optional filter criteria (may be {@code null})
     * @param pageable pagination / sort parameters
     * @return a page of access-log responses
     */
    public Page<AccessLogResponse> findAll(AccessLogFilterRequest filter, Pageable pageable) {
        Specification<AccessLog> spec = buildSpecification(filter);
        return repository.findAll(spec, pageable)
                .map(AccessLogResponse::new);
    }

    // ── Private helpers ───────────────────────────────────────────

    /**
     * Build a dynamic JPA {@link Specification} from the filter DTO.
     * Only non-{@code null} fields contribute predicates.
     */
    private Specification<AccessLog> buildSpecification(AccessLogFilterRequest filter) {
        if (filter == null) {
            return null; // no filtering
        }

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getUserId() != null) {
                predicates.add(cb.equal(root.get("userId"), filter.getUserId()));
            }
            if (filter.getModule() != null && !filter.getModule().isBlank()) {
                predicates.add(cb.equal(root.get("module"), filter.getModule().trim()));
            }
            if (filter.getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFrom()));
            }
            if (filter.getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
