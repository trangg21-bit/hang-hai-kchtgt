package com.hanghai.kchtg.port;

import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.service.shared.ChangeTrackingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests proving INT-003: ChangeTrackingService.recordChanges writes per-field
 * diff records into the lich_su_thay_doi table.
 *
 * Uses real ChangeTrackingService (no @InjectMocks proxy) with a mocked repository
 * to verify the actual reflection-based diffing logic.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("INT-003: ChangeHistoryDiff — ChangeTrackingService field-level diff")
class ChangeHistoryDiffTest {

    @Mock
    private ChangeLogRepository changeLogRepository;

    @InjectMocks
    private ChangeTrackingService changeTrackingService;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
        // Save returns whatever is passed in (default Mockito behavior is fine since
        // we use captors on the save invocation)
        when(changeLogRepository.save(any(ChangeLog.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("INT-003: update changing portName → saves ChangeLog with fieldName='portName', old/new values")
    void update_recordsChangedField_portName() {
        // Build old snapshot (portName = "Old Name")
        Port oldEntity = Port.builder()
                .portName("Old Name")
                .province("Hải Phòng")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.HIEN_HANH)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();

        // Build new entity (portName = "New Name", everything else same)
        Port newEntity = Port.builder()
                .portName("New Name")
                .province("Hải Phòng")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.HIEN_HANH)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();

        List<String> changedFields = changeTrackingService.recordChanges(
                "Port", entityId.toString(), "user-1", oldEntity, newEntity);

        // Verify portName was detected as changed
        assertTrue(changedFields.contains("portName"),
                "Expected portName in changedFields but got: " + changedFields);

        // Capture the ChangeLog saved for portName
        ArgumentCaptor<ChangeLog> captor = ArgumentCaptor.forClass(ChangeLog.class);
        verify(changeLogRepository, atLeastOnce()).save(captor.capture());

        boolean foundPortNameRecord = captor.getAllValues().stream()
                .anyMatch(r -> "portName".equals(r.getFieldName())
                        && "Old Name".equals(r.getOldValue())
                        && "New Name".equals(r.getNewValue()));

        assertTrue(foundPortNameRecord,
                "Expected a ChangeLog record for portName old='Old Name' new='New Name'");
    }

    @Test
    @DisplayName("INT-003: no changes → save never called")
    void update_noChanges_noHistoryRecorded() {
        Port oldEntity = Port.builder()
                .portName("Same Name")
                .province("Hải Phòng")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.HIEN_HANH)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();

        Port newEntity = Port.builder()
                .portName("Same Name")
                .province("Hải Phòng")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.HIEN_HANH)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();

        List<String> changedFields = changeTrackingService.recordChanges(
                "Port", entityId.toString(), "user-1", oldEntity, newEntity);

        assertTrue(changedFields.isEmpty(),
                "Expected no changed fields but got: " + changedFields);
        verify(changeLogRepository, never()).save(any());
    }
}
