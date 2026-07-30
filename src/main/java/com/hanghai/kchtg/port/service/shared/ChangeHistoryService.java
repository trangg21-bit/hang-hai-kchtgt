package com.hanghai.kchtg.port.service.shared;

import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for inserting change history records.
 * <p>
 * INSERT-only — no update or delete operations. Each call persists
 * a single change-record row into the lich_su_thay_doi table (INT-003a fix).
 * Called within the same @Transactional as the entity mutation.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChangeHistoryService {

    private final ChangeLogRepository changeLogRepository;

    /**
     * Compare old and new entity values field-by-field and record changes.
     * Only primitive, String, enum, and common Java type fields are compared.
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

        for (java.lang.reflect.Field field : clazz.getDeclaredFields()) {
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

                    // Insert a ChangeLog record into the database
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

                    changeLogRepository.save(history);
                    changedFields.add(fieldName);
                }
            } catch (IllegalAccessException e) {
                log.warn("Cannot read field {} from {} entity: {}", field.getName(), entityName, e.getMessage());
            }
        }

        return changedFields;
    }

    private boolean isSkippedField(java.lang.reflect.Field field) {
        String name = field.getName();
        return name.equals("id")
                || name.equals("createdAt")
                || name.equals("updatedAt")
                || name.equals("deletedAt")
                || name.equals("createdBy")
                || name.equals("updatedBy");
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

    /**
     * Insert a change history record into the database.
     *
     * @param entityType  entity type (e.g. "CANG_BIEN")
     * @param entityId    entity UUID
     * @param fieldName   field that changed
     * @param oldValue    old value string representation
     * @param newValue    new value string representation
     * @param changedBy   user UUID who made the change
     * @return the inserted record's ID
     */
    @Transactional
    public UUID insertChangeRecord(String entityType, UUID entityId, String fieldName,
                                    String oldValue, String newValue, UUID changedBy) {
        log.debug("ChangeHistory INSERT: {} [{}] {} = [{}] -> [{}]",
                entityType, entityId, fieldName, oldValue, newValue);

        ChangeLog record = ChangeLog.builder()
                .entityType(entityType)
                .entityId(entityId.toString())
                .fieldName(fieldName)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(changedBy.toString())
                .changedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        changeLogRepository.save(record);
        return record.getId();
    }

    /**
     * Bulk insert multiple change records in a single transaction.
     *
     * @param entityType   entity type
     * @param entityId     entity UUID
     * @param changes      list of field-name → [old, new] tuples
     * @param changedBy    user UUID who made the changes
     * @return list of inserted record IDs
     */
    @Transactional
    public List<UUID> bulkInsertChangeRecords(String entityType, UUID entityId,
                                               List<Map<String, String>> changes, UUID changedBy) {
        List<UUID> ids = new ArrayList<>();
        for (Map<String, String> change : changes) {
            ids.add(insertChangeRecord(
                    entityType, entityId,
                    change.get("field"),
                    change.get("old"),
                    change.get("new"),
                    changedBy
            ));
        }
        return ids;
    }
}
