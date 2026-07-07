package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.entity.LichSuThayDoi;
import com.hanghai.kchtg.cangben.repository.LichSuThayDoiRepository;
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
    private LichSuThayDoiRepository lichSuThayDoiRepository;

    @InjectMocks
    private LichSuThayDoiService lichSuThayDoiService;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
        // Save returns whatever is passed in (default Mockito behavior is fine since
        // we use captors on the save invocation)
        when(lichSuThayDoiRepository.save(any(LichSuThayDoi.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("INT-003: update changing tenCang → saves LichSuThayDoi with fieldName='tenCang', old/new values")
    void update_recordsChangedField_tenCang() {
        // Build old snapshot (tenCang = "Old Name")
        CangBien oldEntity = CangBien.builder()
                .tenCang("Old Name")
                .tinhThanhPho("Hải Phòng")
                .viDo(new BigDecimal("20.845"))
                .kinhDo(new BigDecimal("106.688"))
                .dienTich(new BigDecimal("5000.00"))
                .trangThaiHoatDong("HIEN_HANH")
                .trangThaiPheDuyet("CHO_PHE_DUYET")
                .build();

        // Build new entity (tenCang = "New Name", everything else same)
        CangBien newEntity = CangBien.builder()
                .tenCang("New Name")
                .tinhThanhPho("Hải Phòng")
                .viDo(new BigDecimal("20.845"))
                .kinhDo(new BigDecimal("106.688"))
                .dienTich(new BigDecimal("5000.00"))
                .trangThaiHoatDong("HIEN_HANH")
                .trangThaiPheDuyet("CHO_PHE_DUYET")
                .build();

        List<String> changedFields = lichSuThayDoiService.recordChanges(
                "CangBien", entityId.toString(), "user-1", oldEntity, newEntity);

        // Verify tenCang was detected as changed
        assertTrue(changedFields.contains("tenCang"),
                "Expected tenCang in changedFields but got: " + changedFields);

        // Capture the LichSuThayDoi saved for tenCang
        ArgumentCaptor<LichSuThayDoi> captor = ArgumentCaptor.forClass(LichSuThayDoi.class);
        verify(lichSuThayDoiRepository, atLeastOnce()).save(captor.capture());

        boolean foundTenCangRecord = captor.getAllValues().stream()
                .anyMatch(r -> "tenCang".equals(r.getFieldName())
                        && "Old Name".equals(r.getOldValue())
                        && "New Name".equals(r.getNewValue()));

        assertTrue(foundTenCangRecord,
                "Expected a LichSuThayDoi record for tenCang old='Old Name' new='New Name'");
    }

    @Test
    @DisplayName("INT-003: no changes → save never called")
    void update_noChanges_noHistoryRecorded() {
        CangBien oldEntity = CangBien.builder()
                .tenCang("Same Name")
                .tinhThanhPho("Hải Phòng")
                .viDo(new BigDecimal("20.845"))
                .kinhDo(new BigDecimal("106.688"))
                .dienTich(new BigDecimal("5000.00"))
                .trangThaiHoatDong("HIEN_HANH")
                .trangThaiPheDuyet("CHO_PHE_DUYET")
                .build();

        CangBien newEntity = CangBien.builder()
                .tenCang("Same Name")
                .tinhThanhPho("Hải Phòng")
                .viDo(new BigDecimal("20.845"))
                .kinhDo(new BigDecimal("106.688"))
                .dienTich(new BigDecimal("5000.00"))
                .trangThaiHoatDong("HIEN_HANH")
                .trangThaiPheDuyet("CHO_PHE_DUYET")
                .build();

        List<String> changedFields = lichSuThayDoiService.recordChanges(
                "CangBien", entityId.toString(), "user-1", oldEntity, newEntity);

        assertTrue(changedFields.isEmpty(),
                "Expected no changed fields but got: " + changedFields);
        verify(lichSuThayDoiRepository, never()).save(any());
    }
}
