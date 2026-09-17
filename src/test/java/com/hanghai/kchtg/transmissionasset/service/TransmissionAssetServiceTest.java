package com.hanghai.kchtg.transmissionasset.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.port.service.shared.ChangeTrackingService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionAssetRequest;
import com.hanghai.kchtg.transmissionasset.entity.TransmissionAsset;
import com.hanghai.kchtg.transmissionasset.repository.TransmissionAssetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransmissionAssetServiceTest {

    @InjectMocks
    private TransmissionAssetService service;

    @Mock
    private TransmissionAssetRepository repository;

    @Mock
    private ChangeTrackingService changeTrackingService;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserResolverService userResolverService;

    @Test
    void update_whenStatusDraft_doesNotRecordHistoryLog() {
        UUID id = UUID.randomUUID();
        TransmissionAsset existing = new TransmissionAsset();
        existing.setId(id);
        existing.setAssetCode("TS-TX-001");
        existing.setAssetName("Hệ thống truyền dẫn cũ");
        existing.setApprovalStatus(ApprovalStatus.DRAFT);
        existing.setAssetType("Tài sản HT truyền dẫn");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(TransmissionAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransmissionAssetRequest request = new TransmissionAssetRequest();
        request.setAssetName("Hệ thống truyền dẫn mới");

        service.update(id, request);

        verify(changeTrackingService, never()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void update_whenStatusApproved_recordsHistoryLog() {
        UUID id = UUID.randomUUID();
        TransmissionAsset existing = new TransmissionAsset();
        existing.setId(id);
        existing.setAssetCode("TS-TX-002");
        existing.setAssetName("Hệ thống truyền dẫn cũ");
        existing.setApprovalStatus(ApprovalStatus.APPROVED);
        existing.setAssetType("Tài sản HT truyền dẫn");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(TransmissionAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransmissionAssetRequest request = new TransmissionAssetRequest();
        request.setAssetName("Hệ thống truyền dẫn mới đã duyệt");

        service.update(id, request);

        verify(changeTrackingService).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void getHistory_whenStatusDraft_returnsEmptyHistory() {
        UUID id = UUID.randomUUID();
        TransmissionAsset existing = new TransmissionAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.DRAFT);

        when(repository.findById(id)).thenReturn(Optional.of(existing));

        var historyMap = service.getHistory(id);

        assertNotNull(historyMap);
        assertTrue(((List<?>) historyMap.get("changeHistory")).isEmpty());
        verify(historyRepository, never()).findByRefTypeAndRefIdOrderByApprovedDateDesc(any(), any());
    }
}
