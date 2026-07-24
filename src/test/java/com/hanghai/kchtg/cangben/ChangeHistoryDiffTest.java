package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.entity.Port;
import com.hanghai.kchtg.cangben.entity.ChangeLog;
import com.hanghai.kchtg.cangben.repository.ChangeLogRepository;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
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
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests proving INT-003: LichSuThayDoiService.recordChanges writes per-field
 * diff records into the lich_su_thay_doi table.
 *
 * Uses real LichSuThayDoiService (no @InjectMocks proxy) with a mocked repository
 * to verify the actual reflection-based diffing logic.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("INT-003: ChangeHistoryDiff — LichSuThayDoiService field-level diff")
class ChangeHistoryDiffTest {

    @Mock
    private ChangeLogRepository changeLogRepository;

    @InjectMocks
    private LichSuThayDoiService lichSuThayDoiService;

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
                .operationalStatus(TrangThaiHoatDong.HIEN_HANH)
                .approvalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .build();

        // Build new entity (portName = "New Name", everything else same)
        Port newEntity = Port.builder()
                .portName("New Name")
                .province("Hải Phòng")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(TrangThaiHoatDong.HIEN_HANH)
                .approvalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .build();

        List<String> changedFields = lichSuThayDoiService.recordChanges(
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
                .operationalStatus(TrangThaiHoatDong.HIEN_HANH)
                .approvalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .build();

        Port newEntity = Port.builder()
                .portName("Same Name")
                .province("Hải Phòng")
                .area(new BigDecimal("5000.00"))
                .operationalStatus(TrangThaiHoatDong.HIEN_HANH)
                .approvalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .build();

        List<String> changedFields = lichSuThayDoiService.recordChanges(
                "Port", entityId.toString(), "user-1", oldEntity, newEntity);

        assertTrue(changedFields.isEmpty(),
                "Expected no changed fields but got: " + changedFields);
        verify(changeLogRepository, never()).save(any());
    }
}
