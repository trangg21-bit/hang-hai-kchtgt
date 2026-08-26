package com.hanghai.kchtg.port.service.shared;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service that records field-level change history into the
 * lich_su_thay_doi table (INSERT-only, immutable audit trail).
 * <p>
 * Writes one record per changed field. Called within the same
 * @Transactional boundary as the entity save to guarantee atomicity.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChangeTrackingService {

    private final ChangeLogRepository changeLogRepository;

    /**
     * Compare old and new entity values field-by-field and record changes.
     * Only primitive, String, enum, and common Java type fields are compared.
     *
     * @param entityName human-readable entity name (e.g. "CangBien")
     * @param entityId   entity UUID as string
     * @param changedBy  user UUID who made the change
     * @param oldEntity  entity before the change
     * @param newEntity  entity after the change
     * @return list of field names that changed (empty if no changes)
     */
    @Transactional
    public List<String> recordChanges(String entityName, String entityId, String changedBy,
                                       Object oldEntity, Object newEntity) {
        if (oldEntity == null || newEntity == null) {
            return List.of();
        }

        String actualActor = changedBy;
        if ("system".equals(changedBy) || changedBy == null || changedBy.trim().isEmpty()) {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
                actualActor = auth.getName();
            }
        }

        List<String> changedFields = new ArrayList<>();
        Class<?> clazz = oldEntity.getClass();

        for (Field field : clazz.getDeclaredFields()) {
            if (isSkippedField(field)) {
                continue;
            }

            field.setAccessible(true);
            try {
                Object oldValue = field.get(oldEntity);
                Object newValue = field.get(newEntity);

                if (!valuesEqual(oldValue, newValue)) {
                    String fieldName = field.getName();
                    String oldValueStr = formatValue(oldValue);
                    String newValueStr = formatValue(newValue);

                    log.debug("Change in {} [{}]: {} = [{}] -> [{}]",
                            entityName, entityId, fieldName, oldValueStr, newValueStr);

                    // Insert a change-history record into the database
                    ChangeLog history = ChangeLog.builder()
                            .id(UUID.randomUUID())
                            .entityType(entityName)
                            .entityId(entityId)
                            .fieldName(fieldName)
                            .oldValue(oldValueStr)
                            .newValue(newValueStr)
                            .changedBy(actualActor)
                            .changedAt(LocalDateTime.now())
                            .createdAt(LocalDateTime.now())
                            .build();

                    // [TẠM TẮT GHI LỊCH SỬ] Bảng change_logs đã bị V20260825162500 drop; user yêu cầu không ghi lịch sử thay đổi cũ
                    // changeLogRepository.save(history);
                    changedFields.add(fieldName);
                }
            } catch (IllegalAccessException e) {
                log.warn("Cannot read field {} from {} entity: {}", field.getName(), entityName, e.getMessage());
            }
        }

        return changedFields;
    }

    private boolean isSkippedField(Field field) {
        String name = field.getName();
        // Skip audit fields managed by JPA auditing and BaseEntity
        return name.equals(EntityFields.ID)
                || name.equals(EntityFields.CREATED_AT)
                || name.equals(EntityFields.UPDATED_AT)
                || name.equals(EntityFields.DELETED_AT)
                || name.equals(EntityFields.CREATED_BY)
                || name.equals(EntityFields.UPDATED_BY);
    }

    private boolean valuesEqual(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a instanceof Enum<?> ea && b instanceof Enum<?> eb) {
            return ea == eb;
        }
        if (a instanceof List<?> la && b instanceof List<?> lb) {
            return la.equals(lb);
        }
        if (a instanceof Number && b instanceof Number) {
            try {
                java.math.BigDecimal da = new java.math.BigDecimal(a.toString());
                java.math.BigDecimal db = new java.math.BigDecimal(b.toString());
                return da.compareTo(db) == 0;
            } catch (NumberFormatException e) {
                return ((Number) a).doubleValue() == ((Number) b).doubleValue();
            }
        }
        return a.equals(b);
    }

    private String formatValue(Object value) {
        if (value == null) return "(null)";
        if (value instanceof LocalDateTime dt) {
            return dt.toString();
        }
        if (value instanceof Enum<?> e) {
            return e.name();
        }
        return value.toString();
    }
}
