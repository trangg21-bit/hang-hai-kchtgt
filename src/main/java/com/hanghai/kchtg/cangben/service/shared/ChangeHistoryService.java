package com.hanghai.kchtg.cangben.service.shared;

import com.hanghai.kchtg.cangben.entity.LichSuThayDoi;
import com.hanghai.kchtg.cangben.repository.LichSuThayDoiRepository;
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
 * Service for inserting LichSuThayDoi (change history) records.
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

    private final LichSuThayDoiRepository lichSuThayDoiRepository;

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
        log.debug("LichSuThayDoi INSERT: {} [{}] {} = [{}] -> [{}]",
                entityType, entityId, fieldName, oldValue, newValue);

        LichSuThayDoi record = LichSuThayDoi.builder()
                .entityType(entityType)
                .entityId(entityId.toString())
                .fieldName(fieldName)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(changedBy.toString())
                .changedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        lichSuThayDoiRepository.save(record);
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
