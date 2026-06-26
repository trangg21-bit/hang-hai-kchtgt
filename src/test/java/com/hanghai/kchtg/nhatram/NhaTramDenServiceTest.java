package com.hanghai.kchtg.nhatram;

import com.hanghai.kchtg.nhatram.dto.den.CreateNhaTramDenRequest;
import com.hanghai.kchtg.nhatram.dto.den.NhaTramDenResponse;
import com.hanghai.kchtg.nhatram.dto.den.UpdateNhaTramDenRequest;
import com.hanghai.kchtg.nhatram.entity.BeaconLightType;
import com.hanghai.kchtg.nhatram.entity.NhaTramDen;
import com.hanghai.kchtg.nhatram.entity.NhaTramStatus;
import com.hanghai.kchtg.nhatram.entity.NhaTramApprovalStatus;
import com.hanghai.kchtg.nhatram.repository.NhaTramDenRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramPhaoRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramHistoryRepository;
import com.hanghai.kchtg.nhatram.service.NhaTramDenService;
import com.hanghai.kchtg.nhatram.service.PointObjectSyncService;
import com.hanghai.kchtg.nhatram.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NhaTramDenServiceTest {

    @InjectMocks
    private NhaTramDenService service;

    @Mock
    private NhaTramDenRepository denRepo;

    @Mock
    private NhaTramPhaoRepository phaoRepo;

    @Mock
    private NhaTramHistoryRepository historyRepo;

    @Mock
    private PointObjectSyncService syncService;

    @Mock
    private NotificationService notificationService;

    private UUID testId;
    private NhaTramDen testEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testEntity = new NhaTramDen();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        ReflectionTestUtils.setField(testEntity, "name", "Den Demo");
        ReflectionTestUtils.setField(testEntity, "code", "DEN-001");
        ReflectionTestUtils.setField(testEntity, "type", BeaconLightType.LIGHTHOUSE);
        ReflectionTestUtils.setField(testEntity, "latitude", 10.123);
        ReflectionTestUtils.setField(testEntity, "longitude", 106.456);
        ReflectionTestUtils.setField(testEntity, "lightRange", 10.0);
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.DRAFT);
        ReflectionTestUtils.setField(testEntity, "approvalStatus", NhaTramApprovalStatus.PENDING);
        ReflectionTestUtils.setField(testEntity, "description", "Mo ta demo");
        ReflectionTestUtils.setField(testEntity, "approvedBy", 1L);
    }

    @Test
    @DisplayName("F-087: Find by id — returns entity when exists")
    void testFindByIdExists() {
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        NhaTramDenResponse response = service.findById(testId);

        assertNotNull(response);
        assertEquals("Den Demo", response.getName());
        assertEquals("DEN-001", response.getCode());
        assertEquals(BeaconLightType.LIGHTHOUSE, response.getType());
    }

    @Test
    @DisplayName("F-087: Find by id — throws when not found")
    void testFindByIdNotFound() {
        when(denRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.findById(testId));
    }

    @Test
    @DisplayName("F-086: Find all — returns all entities")
    void testFindAll() {
        when(denRepo.findAll()).thenReturn(List.of(testEntity));

        List<NhaTramDenResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("Den Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-086: Create — creates new entity with DRAFT status")
    void testCreate() {
        CreateNhaTramDenRequest request = new CreateNhaTramDenRequest(
                "DEN-002", "Den moi", BeaconLightType.LIGHTHOUSE, 11.111, 107.777,
                15.0, null, null, 20.0, "Moi", null, null, null, true, "draft");
        when(denRepo.existsByCode("DEN-002")).thenReturn(false);
        when(denRepo.save(any(NhaTramDen.class))).thenAnswer(invocation -> {
            NhaTramDen saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            }
            return saved;
        });

        NhaTramDenResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("Den moi", result.getName());
        verify(denRepo).save(any(NhaTramDen.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-087: Update — applies mutable fields")
    void testUpdate() {
        NhaTramDen entity = new NhaTramDen();
        ReflectionTestUtils.setField(entity, "id", testId);
        ReflectionTestUtils.setField(entity, "name", "Den cu");
        ReflectionTestUtils.setField(entity, "code", "DEN-001");
        ReflectionTestUtils.setField(entity, "type", BeaconLightType.LIGHTHOUSE);
        ReflectionTestUtils.setField(entity, "status", NhaTramStatus.APPROVED_L1);
        when(denRepo.findById(testId)).thenReturn(Optional.of(entity));
        when(denRepo.save(any())).thenReturn(testEntity);

        UpdateNhaTramDenRequest request = new UpdateNhaTramDenRequest(
                "Den moi", BeaconLightType.LIGHTHOUSE, 106.0, 10.0,
                null, null, null, 20.0, "Moi cap nhat", null, null, null, null);

        NhaTramDenResponse result = service.update(testId, request);

        assertEquals("Den moi", result.getName());
    }

    @Test
    @DisplayName("F-086: Delete — soft deletes entity")
    void testDelete() {
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(denRepo.save(any())).thenReturn(testEntity);

        service.delete(testId);

        assertEquals(NhaTramStatus.DELETED, testEntity.getStatus());
        verify(denRepo).save(any(NhaTramDen.class));
    }

    @Test
    @DisplayName("F-088: Submit for approval — transitions DRAFT to PENDING_APPROVAL")
    void testSubmitForApproval() {
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(denRepo.save(any())).thenReturn(testEntity);

        service.submitForApproval(testId);

        assertEquals(NhaTramStatus.PENDING_APPROVAL, testEntity.getStatus());
        assertEquals(NhaTramApprovalStatus.PENDING, testEntity.getApprovalStatus());
        verify(denRepo).save(any(NhaTramDen.class));
        verify(notificationService).sendApprovalNotificationDen(any());
    }

    @Test
    @DisplayName("F-088: Approve L1 — transitions PENDING_APPROVAL to APPROVED_L1")
    void testApproveL1() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.PENDING_APPROVAL);
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(denRepo.save(any())).thenReturn(testEntity);

        NhaTramDenResponse result = service.approveL1(testId, "2");

        assertEquals(NhaTramStatus.APPROVED_L1, result.getStatus());
        assertEquals(2L, result.getApprovedBy());
        verify(denRepo).save(any(NhaTramDen.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-088: Approve L2 — transitions APPROVED_L1 to PUBLISHED + sync + notify")
    void testApproveL2() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.APPROVED_L1);
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(denRepo.save(any())).thenReturn(testEntity);

        NhaTramDenResponse result = service.approveL2(testId, "3");

        assertEquals(NhaTramStatus.PUBLISHED, result.getStatus());
        assertEquals(3L, result.getApprovedBy());
        verify(syncService).syncToMapDen(any());
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-088: Reject — transitions back to DRAFT with reason")
    void testReject() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.PENDING_APPROVAL);
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(denRepo.save(any())).thenReturn(testEntity);

        NhaTramDenResponse result = service.reject(testId, "Ly do tu choi hop le", "1");

        assertEquals(NhaTramStatus.DRAFT, result.getStatus());
        assertEquals(NhaTramApprovalStatus.REJECTED, result.getApprovalStatus());
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-086: Search — returns filtered results")
    void testSearch() {
        when(denRepo.searchFiltered("Den", "DEN", BeaconLightType.LIGHTHOUSE, NhaTramStatus.DRAFT))
                .thenReturn(List.of(testEntity));

        List<NhaTramDenResponse> result = service.search("Den", "DEN", BeaconLightType.LIGHTHOUSE, NhaTramStatus.DRAFT);

        assertEquals(1, result.size());
        assertEquals("Den Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-086: Search with no filters — returns all")
    void testSearchNoFilters() {
        when(denRepo.searchFiltered(null, null, null, null)).thenReturn(List.of(testEntity));

        List<NhaTramDenResponse> result = service.search(null, null, null, null);

        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("F-086: Reject with short reason — throws validation error")
    void testRejectShortReason() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.PENDING_APPROVAL);
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalArgumentException.class,
                () -> service.reject(testId, "Too short", "1"));
    }

    @Test
    @DisplayName("F-086: Approve L1 on wrong status — throws exception")
    void testApproveL1WrongStatus() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.DRAFT);
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalStateException.class,
                () -> service.approveL1(testId, "2"));
    }

    @Test
    @DisplayName("F-086: Approve L2 on wrong status — throws exception")
    void testApproveL2WrongStatus() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.DRAFT);
        when(denRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalStateException.class,
                () -> service.approveL2(testId, "3"));
    }
}
