package com.hanghai.kchtg.cangben.service.shared;

import com.hanghai.kchtg.cangben.entity.LichSuThayDoi;
import com.hanghai.kchtg.cangben.repository.LichSuThayDoiRepository;
import jakarta.persistence.EntityNotFoundException;
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
public class LichSuThayDoiService {

    private final LichSuThayDoiRepository lichSuThayDoiRepository;

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

                    // Insert a LichSuThayDoi record into the database
                    LichSuThayDoi history = LichSuThayDoi.builder()
                            .id(UUID.randomUUID())
                            .entityType(entityName)
                            .entityId(entityId)
                            .fieldName(fieldName)
                            .oldValue(oldValueStr)
                            .newValue(newValueStr)
                            .changedBy(changedBy)
                            .changedAt(LocalDateTime.now())
                            .createdAt(LocalDateTime.now())
                            .build();

                    lichSuThayDoiRepository.save(history);
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
