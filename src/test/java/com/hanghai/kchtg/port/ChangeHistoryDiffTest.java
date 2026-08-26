package com.hanghai.kchtg.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.port.entity.Port;
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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests proving INT-003: ChangeTrackingService.recordChanges writes per-field
 * diff records into the shared `infrastructure_history` table
 * (approval-2-level-spec.md muc 3.5).
 *
 * Uses real ChangeTrackingService (no @InjectMocks proxy) with a mocked repository
 * to verify the actual reflection-based diffing logic.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("INT-003: ChangeHistoryDiff — ChangeTrackingService field-level diff")
class ChangeHistoryDiffTest {

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @InjectMocks
    private ChangeTrackingService changeTrackingService;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
        // Save returns whatever is passed in (default Mockito behavior is fine since
        // we use captors on the save invocation)
        when(historyRepository.save(any(InfrastructureHistory.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("INT-003: update changing portName → saves ChangeLog with fieldName='portName', old/new values")
    void update_recordsChangedField_portName() {
        // Build old snapshot (portName = "Old Name")
        Port oldEntity = Port.builder()
                .portName("Old Name")
                .province("Hà Nội")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();

        // Build new entity (portName = "New Name", everything else same)
        Port newEntity = Port.builder()
                .portName("New Name")
                .province("Hà Nội")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();

        List<String> changedFields = changeTrackingService.recordChanges(
                "Port", entityId.toString(), "user-1", oldEntity, newEntity);

        // Verify portName was detected as changed
        assertTrue(changedFields.contains("portName"),
                "Expected portName in changedFields but got: " + changedFields);

        // Capture the InfrastructureHistory row saved for portName
        ArgumentCaptor<InfrastructureHistory> captor = ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(historyRepository, atLeastOnce()).save(captor.capture());

        boolean foundPortNameRecord = captor.getAllValues().stream()
                .anyMatch(r -> "portName".equals(r.getChangedField())
                        && "Old Name".equals(r.getPreviousValue())
                        && "New Name".equals(r.getNewValue()));

        assertTrue(foundPortNameRecord,
                "Expected an InfrastructureHistory row for portName old='Old Name' new='New Name'");
    }

    @Test
    @DisplayName("INT-003: no changes → save never called")
    void update_noChanges_noHistoryRecorded() {
        Port oldEntity = Port.builder()
                .portName("Same Name")
                .province("Hà Nội")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();

        Port newEntity = Port.builder()
                .portName("Same Name")
                .province("Hà Nội")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();

        List<String> changedFields = changeTrackingService.recordChanges(
                "Port", entityId.toString(), "user-1", oldEntity, newEntity);

        assertTrue(changedFields.isEmpty(),
                "Expected no changed fields but got: " + changedFields);
        verify(historyRepository, never()).save(any());
    }
}
