package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.InfraAsset;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.assetmovement.repository.InfraAssetRepository;
import com.hanghai.kchtg.assetmovement.service.InfraAssetService;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.user.repository.UserRepository;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InfraAssetServiceTest {
    @InjectMocks
    private InfraAssetService service;

    @Mock
    private InfraAssetRepository repository;

    @Mock
    private UserResolverService userResolverService;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChangeHistoryService changeHistoryService;

    @Test
    void createPortTerminalAssetKeepsBusinessFieldsAndCalculatesBookValues() {
        UUID berthId = UUID.randomUUID();
        UUID orgUnitId = UUID.randomUUID();
        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Cầu dẫn bến số 1");
        request.setAssetType(InfraAssetType.PORT_TERMINAL);
        request.setBerthId(berthId);
        request.setOrgUnitId(orgUnitId);
        request.setAssetCondition("Tốt");
        request.setUseDate(LocalDate.of(2026, 9, 9));
        request.setOriginalValue(new BigDecimal("1000000"));
        request.setAccumulatedDepreciation(new BigDecimal("250000"));
        request.setDepreciationMonths(20);

        when(repository.findByAssetCode(any())).thenReturn(Optional.empty());
        when(repository.save(any(InfraAsset.class))).thenAnswer(invocation -> {
            InfraAsset entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });

        InfraAssetResponse response = service.create(request);

        assertNotNull(response.getId());
        assertEquals(InfraAssetType.PORT_TERMINAL.name(), response.getAssetType());
        assertEquals(berthId, response.getBerthId());
        assertEquals(orgUnitId, response.getOrgUnitId());
        assertEquals("Tốt", response.getAssetCondition());
        assertEquals(ApprovalStatus.DRAFT.name(), response.getApprovalStatus());
        assertEquals(new BigDecimal("750000"), response.getRemainingValue());
        assertEquals(new BigDecimal("50000.00"), response.getMonthlyDepreciation());
    }

    @Test
    void createDryPortAssetGeneratesPrefixAndKeepsDryPortId() {
        UUID dryPortId = UUID.randomUUID();
        UUID orgUnitId = UUID.randomUUID();
        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Kho bãi cảng cạn Tân Cảng");
        request.setAssetType(InfraAssetType.DRY_PORT);
        request.setDryPortId(dryPortId);
        request.setOrgUnitId(orgUnitId);
        request.setAssetCondition("Tốt");
        request.setOriginalValue(new BigDecimal("500000000"));
        request.setAccumulatedDepreciation(new BigDecimal("100000000"));
        request.setDepreciationMonths(50);

        when(repository.findByAssetCode(any())).thenReturn(Optional.empty());
        when(repository.save(any(InfraAsset.class))).thenAnswer(invocation -> {
            InfraAsset entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });

        InfraAssetResponse response = service.create(request);

        assertNotNull(response.getId());
        assertEquals(InfraAssetType.DRY_PORT.name(), response.getAssetType());
        assertEquals(dryPortId, response.getDryPortId());
        assertEquals(orgUnitId, response.getOrgUnitId());
        assertNotNull(response.getAssetCode());
        assertTrue(response.getAssetCode().startsWith("TS-CC-"));
        assertEquals(new BigDecimal("400000000"), response.getRemainingValue());
        assertEquals(new BigDecimal("10000000.00"), response.getMonthlyDepreciation());
    }

    @Test
    void createAnchorageAssetKeepsAnchorageRelationAndUsesAnchorageCodePrefix() {
        UUID anchorageId = UUID.randomUUID();
        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Thiết bị neo đậu số 1");
        request.setAssetType(InfraAssetType.ANCHORAGE);
        request.setAnchorageId(anchorageId);
        request.setOriginalValue(new BigDecimal("500000"));

        when(repository.findByAssetCode(any())).thenReturn(Optional.empty());
        when(repository.save(any(InfraAsset.class))).thenAnswer(invocation -> {
            InfraAsset entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });

        InfraAssetResponse response = service.create(request);

        assertNotNull(response.getId());
        assertEquals(InfraAssetType.ANCHORAGE.name(), response.getAssetType());
        assertEquals(anchorageId, response.getAnchorageId());
        assertTrue(response.getAssetCode().startsWith("TS-ND-"));
        assertEquals(new BigDecimal("500000"), response.getRemainingValue());
    }

    @Test
    void createLighthouseAssetKeepsLighthouseRelationAndUsesLighthouseCodePrefix() {
        UUID beaconStationId = UUID.randomUUID();
        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Thiết bị đèn biển số 1");
        request.setAssetType(InfraAssetType.LIGHTHOUSE);
        request.setBeaconStationId(beaconStationId);
        request.setOriginalValue(new BigDecimal("750000"));

        when(repository.findByAssetCode(any())).thenReturn(Optional.empty());
        when(repository.save(any(InfraAsset.class))).thenAnswer(invocation -> {
            InfraAsset entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });

        InfraAssetResponse response = service.create(request);

        assertEquals(InfraAssetType.LIGHTHOUSE.name(), response.getAssetType());
        assertEquals(beaconStationId, response.getBeaconStationId());
        assertTrue(response.getAssetCode().startsWith("TS-DB-"));
        assertEquals(new BigDecimal("750000"), response.getRemainingValue());
    }

    @Test
    void createDikeRevetmentAssetKeepsDikeRelationAndUsesDikeCodePrefix() {
        UUID dikeRevetmentId = UUID.randomUUID();
        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Thiết bị đê chắn sóng số 1");
        request.setAssetType(InfraAssetType.DIKE_REVETMENT);
        request.setDikeRevetmentId(dikeRevetmentId);
        request.setOriginalValue(new BigDecimal("900000"));

        when(repository.findByAssetCode(any())).thenReturn(Optional.empty());
        when(repository.save(any(InfraAsset.class))).thenAnswer(invocation -> {
            InfraAsset entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });

        InfraAssetResponse response = service.create(request);

        assertEquals(InfraAssetType.DIKE_REVETMENT.name(), response.getAssetType());
        assertEquals(dikeRevetmentId, response.getDikeRevetmentId());
        assertTrue(response.getAssetCode().startsWith("TS-DK-"));
        assertEquals(new BigDecimal("900000"), response.getRemainingValue());
    }

    @Test
    void update_whenStatusDraft_doesNotRecordHistoryLog() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setAssetCode("TS-BC-001");
        existing.setAssetName("Bến cảng cũ");
        existing.setApprovalStatus(ApprovalStatus.DRAFT);
        existing.setAssetType(InfraAssetType.PORT_TERMINAL);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(InfraAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Bến cảng mới");

        service.update(id, request);

        verify(historyRepository, never()).save(any(InfrastructureHistory.class));
        verify(changeHistoryService, never()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void update_whenStatusApproved_recordsHistoryLog() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setAssetCode("TS-BC-002");
        existing.setAssetName("Bến cảng cũ");
        existing.setApprovalStatus(ApprovalStatus.APPROVED);
        existing.setAssetType(InfraAssetType.PORT_TERMINAL);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(InfraAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Bến cảng mới đã duyệt");

        service.update(id, request);

        verify(historyRepository, atLeastOnce()).save(any(InfrastructureHistory.class));
        verify(changeHistoryService, never()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void getHistory_whenStatusDraft_returnsEmptyHistory() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.DRAFT);

        when(repository.findById(id)).thenReturn(Optional.of(existing));

        var historyMap = service.getHistory(id);

        assertNotNull(historyMap);
        assertTrue(((java.util.List<?>) historyMap.get("changeHistory")).isEmpty());
        verify(historyRepository, never()).findByRefIdOrderByApprovedDateDesc(any());
    }

    @Test
    void update_whenStatusPendingApproval_throwsIllegalStateException() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        when(repository.findById(id)).thenReturn(Optional.of(existing));

        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Tên mới");

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> service.update(id, request));
    }

    @Test
    void update_whenStatusApprovedLevel1_throwsIllegalStateException() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);

        when(repository.findById(id)).thenReturn(Optional.of(existing));

        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Tên mới");

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> service.update(id, request));
    }

    @Test
    void update_whenStatusArchived_throwsIllegalStateException() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.ARCHIVED);

        when(repository.findById(id)).thenReturn(Optional.of(existing));

        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Tên mới");

        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> service.update(id, request));
    }

    @Test
    void submit_transitionsToPendingApprovalAndSavesHistory() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.DRAFT);
        existing.setAssetType(InfraAssetType.PORT_TERMINAL);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(InfraAsset.class))).thenAnswer(i -> i.getArgument(0));

        InfraAssetResponse resp = service.submit(id);

        assertEquals(ApprovalStatus.PENDING_APPROVAL.name(), resp.getApprovalStatus());
        verify(historyRepository, atLeastOnce()).save(any(InfrastructureHistory.class));
    }

    @Test
    void approveC1_transitionsToApprovedLevel1AndSavesHistory() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        existing.setAssetType(InfraAssetType.PORT_TERMINAL);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(InfraAsset.class))).thenAnswer(i -> i.getArgument(0));

        InfraAssetResponse resp = service.approveC1(id, "Đồng ý cấp Chi cục");

        assertEquals(ApprovalStatus.APPROVED_LEVEL1.name(), resp.getApprovalStatus());
        verify(historyRepository, atLeastOnce()).save(any(InfrastructureHistory.class));
    }

    @Test
    void rejectC1_transitionsToRejectedLevel1AndSavesHistory() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        existing.setAssetType(InfraAssetType.PORT_TERMINAL);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(InfraAsset.class))).thenAnswer(i -> i.getArgument(0));

        InfraAssetResponse resp = service.rejectC1(id, "Hồ sơ chưa đủ điều kiện cấp 1");

        assertEquals(ApprovalStatus.REJECTED_LEVEL1.name(), resp.getApprovalStatus());
        verify(historyRepository, atLeastOnce()).save(any(InfrastructureHistory.class));
    }

    @Test
    void approveC2_transitionsToApprovedAndSavesHistory() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        existing.setAssetType(InfraAssetType.PORT_TERMINAL);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(InfraAsset.class))).thenAnswer(i -> i.getArgument(0));

        InfraAssetResponse resp = service.approveC2(id, "Đồng ý cấp Cục");

        assertEquals(ApprovalStatus.APPROVED.name(), resp.getApprovalStatus());
        verify(historyRepository, atLeastOnce()).save(any(InfrastructureHistory.class));
    }

    @Test
    void rejectC2_transitionsToRejectedLevel2AndSavesHistory() {
        UUID id = UUID.randomUUID();
        InfraAsset existing = new InfraAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        existing.setAssetType(InfraAssetType.PORT_TERMINAL);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(InfraAsset.class))).thenAnswer(i -> i.getArgument(0));

        InfraAssetResponse resp = service.rejectC2(id, "Cục từ chối duyệt hồ sơ");

        assertEquals(ApprovalStatus.REJECTED_LEVEL2.name(), resp.getApprovalStatus());
        verify(historyRepository, atLeastOnce()).save(any(InfrastructureHistory.class));
    }
}
