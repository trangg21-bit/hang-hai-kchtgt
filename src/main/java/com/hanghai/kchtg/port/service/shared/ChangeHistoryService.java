package com.hanghai.kchtg.port.service.shared;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
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
 * a change record into the infrastructure_history table.
 * Called within the same @Transactional as the entity mutation.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChangeHistoryService {

    private final InfrastructureHistoryRepository historyRepository;

    public static InfrastructureType resolveInfrastructureType(String entityName) {
        if (entityName == null) return InfrastructureType.SEAPORT;
        return switch (entityName.toUpperCase()) {
            case "PORT", "CANG_BIEN", "SEAPORT" -> InfrastructureType.SEAPORT;
            case "BERTH", "BEN_CANG", "PORT_TERMINAL" -> InfrastructureType.PORT_TERMINAL;
            case "PIER", "CAU_CANG" -> InfrastructureType.PIER;
            case "DRYPORT", "DRY_PORT", "CANG_CAN" -> InfrastructureType.DRY_PORT;
            case "WATERZONE", "WATER_ZONE", "VUNG_NUOC", "WATER_AREA" -> InfrastructureType.WATER_AREA;
            case "BUOY", "PHAO_TIEU" -> InfrastructureType.BUOY;
            case "BUOYSTATION", "BUOY_STATION", "TRAM_PHAO" -> InfrastructureType.BUOY_STATION;
            case "DIKEREVETMENT", "DIKE_REVETMENT", "DE_KE" -> InfrastructureType.DIKE_REVETMENT;
            case "NAVIGATIONCHANNEL", "NAVIGATION_CHANNEL", "LUONG_HANG_HAI" -> InfrastructureType.NAVIGATION_CHANNEL;
            case "VTSSYSTEM", "VTS_SYSTEM" -> InfrastructureType.VTS_SYSTEM;
            case "VTSOPERATIONCENTER", "VTS_OPERATION_CENTER" -> InfrastructureType.VTS_OPERATION_CENTER;
            case "RADARSTATION", "RADAR_STATION" -> InfrastructureType.RADAR_STATION;
            case "AISSYSTEM", "AIS_SYSTEM" -> InfrastructureType.AIS_SYSTEM;
            case "CCTV" -> InfrastructureType.CCTV;
            case "SCADA" -> InfrastructureType.SCADA;
            case "TRANSMISSION" -> InfrastructureType.TRANSMISSION;
            case "BEACONSTATION", "BEACON_STATION", "DEN_BIEN" -> InfrastructureType.LIGHTHOUSE;
            case "SHIPREPAIRFACILITY", "SHIP_REPAIR_FACILITY" -> InfrastructureType.SHIP_REPAIR_FACILITY;
            default -> InfrastructureType.SEAPORT;
        };
    }

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

        UUID userUuid = null;
        try {
            if (actualActor != null) userUuid = UUID.fromString(actualActor);
        } catch (Exception ignored) {}

        UUID refUuid = null;
        try {
            if (entityId != null) refUuid = UUID.fromString(entityId);
        } catch (Exception ignored) {}

        List<String> changedFields = new ArrayList<>();
        Class<?> clazz = oldEntity.getClass();
        java.lang.reflect.Field[] fields = clazz.getDeclaredFields();

        log.info("ChangeHistory: comparing {} fields for {} [{}]", fields.length, entityName, entityId);

        for (java.lang.reflect.Field field : fields) {
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

                    log.info("ChangeHistory: FIELD CHANGE {} [{}] {} = [{}] -> [{}]",
                            entityName, entityId, fieldName, oldValueStr, newValueStr);

                    if (refUuid != null && historyRepository != null) {
                        historyRepository.save(InfrastructureHistory.builder()
                                .refId(refUuid)
                                .refType(resolveInfrastructureType(entityName))
                                .approvalLevel(ApprovalLevel.LEVEL_0)
                                .status(InfrastructureHistoryStatus.UPDATED)
                                .approvedBy(userUuid)
                                .approvedDate(LocalDateTime.now())
                                .changedField(fieldName)
                                .previousValue(oldValueStr)
                                .newValue(newValueStr)
                                .build());
                    }

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
                                    String oldValue, String newValue, String changedBy) {
        String actualActor = changedBy;
        if ("system".equals(changedBy) || changedBy == null || changedBy.trim().isEmpty()) {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
                actualActor = auth.getName();
            }
        }
        UUID userUuid = null;
        try {
            if (actualActor != null) userUuid = UUID.fromString(actualActor);
        } catch (Exception ignored) {}

        if (entityId != null && historyRepository != null) {
            InfrastructureHistory saved = historyRepository.save(InfrastructureHistory.builder()
                    .refId(entityId)
                    .refType(resolveInfrastructureType(entityType))
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userUuid)
                    .approvedDate(LocalDateTime.now())
                    .changedField(fieldName)
                    .previousValue(oldValue)
                    .newValue(newValue)
                    .build());
            return saved.getId();
        }

        return UUID.randomUUID();
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
                                               List<Map<String, String>> changes, String changedBy) {
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
