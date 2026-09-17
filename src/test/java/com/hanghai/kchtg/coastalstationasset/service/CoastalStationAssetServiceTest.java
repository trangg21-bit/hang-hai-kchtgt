package com.hanghai.kchtg.coastalstationasset.service;

import com.hanghai.kchtg.coastalstationasset.dto.CoastalStationAssetRequest;
import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAsset;
import com.hanghai.kchtg.coastalstationasset.repository.CoastalStationAssetRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.port.service.shared.ChangeTrackingService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
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
class CoastalStationAssetServiceTest {

    @InjectMocks
    private CoastalStationAssetService service;

    @Mock
    private CoastalStationAssetRepository repository;

    @Mock
    private ChangeTrackingService changeTrackingService;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserResolverService userResolverService;

    @Test
    void update_whenStatusDraft_doesNotRecordHistoryLog() {
        UUID id = UUID.randomUUID();
        CoastalStationAsset existing = new CoastalStationAsset();
        existing.setId(id);
        existing.setAssetCode("TS-CS-001");
        existing.setAssetName("Tài sản đài cũ");
        existing.setApprovalStatus(ApprovalStatus.DRAFT);
        existing.setAssetType("Tài sản đài TTDH");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(CoastalStationAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CoastalStationAssetRequest request = new CoastalStationAssetRequest();
        request.setAssetName("Tài sản đài mới");

        service.update(id, request);

        verify(changeTrackingService, never()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void update_whenStatusApproved_recordsHistoryLog() {
        UUID id = UUID.randomUUID();
        CoastalStationAsset existing = new CoastalStationAsset();
        existing.setId(id);
        existing.setAssetCode("TS-CS-002");
        existing.setAssetName("Tài sản đài cũ");
        existing.setApprovalStatus(ApprovalStatus.APPROVED);
        existing.setAssetType("Tài sản đài TTDH");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(CoastalStationAsset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CoastalStationAssetRequest request = new CoastalStationAssetRequest();
        request.setAssetName("Tài sản đài mới đã duyệt");

        service.update(id, request);

        verify(changeTrackingService).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void getHistory_whenStatusDraft_returnsEmptyHistory() {
        UUID id = UUID.randomUUID();
        CoastalStationAsset existing = new CoastalStationAsset();
        existing.setId(id);
        existing.setApprovalStatus(ApprovalStatus.DRAFT);

        when(repository.findById(id)).thenReturn(Optional.of(existing));

        var historyMap = service.getHistory(id);

        assertNotNull(historyMap);
        assertTrue(((List<?>) historyMap.get("changeHistory")).isEmpty());
        verify(historyRepository, never()).findByRefTypeAndRefIdOrderByApprovedDateDesc(any(), any());
    }
}
