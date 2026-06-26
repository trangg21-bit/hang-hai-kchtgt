package com.hanghai.kchtg.nhatram;

import com.hanghai.kchtg.nhatram.dto.phao.CreateNhaTramPhaoRequest;
import com.hanghai.kchtg.nhatram.dto.phao.NhaTramPhaoResponse;
import com.hanghai.kchtg.nhatram.dto.phao.UpdateNhaTramPhaoRequest;
import com.hanghai.kchtg.nhatram.entity.BuoyType;
import com.hanghai.kchtg.nhatram.entity.NhaTramPhao;
import com.hanghai.kchtg.nhatram.entity.NhaTramStatus;
import com.hanghai.kchtg.nhatram.entity.NhaTramApprovalStatus;
import com.hanghai.kchtg.nhatram.repository.NhaTramPhaoRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramDenRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramHistoryRepository;
import com.hanghai.kchtg.nhatram.service.NhaTramPhaoService;
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
class NhaTramPhaoServiceTest {

    @InjectMocks
    private NhaTramPhaoService service;

    @Mock
    private NhaTramPhaoRepository phaoRepo;

    @Mock
    private NhaTramDenRepository denRepo;

    @Mock
    private NhaTramHistoryRepository historyRepo;

    @Mock
    private PointObjectSyncService syncService;

    @Mock
    private NotificationService notificationService;

    private UUID testId;
    private NhaTramPhao testEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testEntity = new NhaTramPhao();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        ReflectionTestUtils.setField(testEntity, "name", "Phao Demo");
        ReflectionTestUtils.setField(testEntity, "code", "PHAO-001");
        ReflectionTestUtils.setField(testEntity, "type", BuoyType.CARDINAL);
        ReflectionTestUtils.setField(testEntity, "latitude", 10.123);
        ReflectionTestUtils.setField(testEntity, "longitude", 106.456);
        ReflectionTestUtils.setField(testEntity, "range", 10.0);
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.DRAFT);
        ReflectionTestUtils.setField(testEntity, "approvalStatus", NhaTramApprovalStatus.PENDING);
        ReflectionTestUtils.setField(testEntity, "description", "Mo ta demo");
        ReflectionTestUtils.setField(testEntity, "approvedBy", 1L);
    }

    @Test
    @DisplayName("F-085: Find by id — returns entity when exists")
    void testFindByIdExists() {
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        NhaTramPhaoResponse response = service.findById(testId);

        assertNotNull(response);
        assertEquals("Phao Demo", response.getName());
        assertEquals("PHAO-001", response.getCode());
        assertEquals(BuoyType.CARDINAL, response.getType());
    }

    @Test
    @DisplayName("F-085: Find by id — throws when not found")
    void testFindByIdNotFound() {
        when(phaoRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.findById(testId));
    }

    @Test
    @DisplayName("F-080: Find all — returns all entities")
    void testFindAll() {
        when(phaoRepo.findAll()).thenReturn(List.of(testEntity));

        List<NhaTramPhaoResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("Phao Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-080: Create — creates new entity with DRAFT status")
    void testCreate() {
        CreateNhaTramPhaoRequest request = new CreateNhaTramPhaoRequest(
                "PHAO-002", "Phao moi", BuoyType.CARDINAL, 11.111, 107.777,
                null, null, null, 15.0, "Moi", null, null, null, true, "draft");
        when(phaoRepo.existsByCode("PHAO-002")).thenReturn(false);
        when(denRepo.existsByCode("PHAO-002")).thenReturn(false);
        when(phaoRepo.save(any(NhaTramPhao.class))).thenAnswer(invocation -> {
            NhaTramPhao saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            }
            return saved;
        });

        NhaTramPhaoResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("Phao moi", result.getName());
        verify(phaoRepo).save(any(NhaTramPhao.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-081: Update — applies mutable fields")
    void testUpdate() {
        NhaTramPhao entity = new NhaTramPhao();
        ReflectionTestUtils.setField(entity, "id", testId);
        ReflectionTestUtils.setField(entity, "name", "Phao cu");
        ReflectionTestUtils.setField(entity, "code", "PHAO-001");
        ReflectionTestUtils.setField(entity, "type", BuoyType.CARDINAL);
        ReflectionTestUtils.setField(entity, "status", NhaTramStatus.APPROVED_L1);
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(entity));
        when(phaoRepo.save(any())).thenReturn(testEntity);

        UpdateNhaTramPhaoRequest request = new UpdateNhaTramPhaoRequest(
                "Phao moi", BuoyType.CARDINAL, 106.0, 10.0,
                null, null, null, 20.0, "Moi cap nhat", null, null, null, null);

        NhaTramPhaoResponse result = service.update(testId, request);

        assertEquals("Phao moi", result.getName());
    }

    @Test
    @DisplayName("F-080: Delete — soft deletes entity")
    void testDelete() {
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(phaoRepo.save(any())).thenReturn(testEntity);

        service.delete(testId);

        assertEquals(NhaTramStatus.DELETED, testEntity.getStatus());
        verify(phaoRepo).save(any(NhaTramPhao.class));
    }

    @Test
    @DisplayName("F-083: Submit for approval — transitions DRAFT to PENDING_APPROVAL")
    void testSubmitForApproval() {
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(phaoRepo.save(any())).thenReturn(testEntity);

        service.submitForApproval(testId);

        assertEquals(NhaTramStatus.PENDING_APPROVAL, testEntity.getStatus());
        assertEquals(NhaTramApprovalStatus.PENDING, testEntity.getApprovalStatus());
        verify(phaoRepo).save(any(NhaTramPhao.class));
        verify(notificationService).sendApprovalNotificationPhao(any());
    }

    @Test
    @DisplayName("F-083: Approve L1 — transitions PENDING_APPROVAL to APPROVED_L1")
    void testApproveL1() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.PENDING_APPROVAL);
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(phaoRepo.save(any())).thenReturn(testEntity);

        NhaTramPhaoResponse result = service.approveL1(testId, "2");

        assertEquals(NhaTramStatus.APPROVED_L1, result.getStatus());
        assertEquals(2L, result.getApprovedBy());
        verify(phaoRepo).save(any(NhaTramPhao.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-083: Approve L2 — transitions APPROVED_L1 to PUBLISHED + sync + notify")
    void testApproveL2() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.APPROVED_L1);
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(phaoRepo.save(any())).thenReturn(testEntity);

        NhaTramPhaoResponse result = service.approveL2(testId, "3");

        assertEquals(NhaTramStatus.PUBLISHED, result.getStatus());
        assertEquals(3L, result.getApprovedBy());
        verify(syncService).syncToMapPhao(any());
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-083: Reject — transitions back to DRAFT with reason")
    void testReject() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.PENDING_APPROVAL);
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(phaoRepo.save(any())).thenReturn(testEntity);

        NhaTramPhaoResponse result = service.reject(testId, "Ly do tu choi hop le", "1");

        assertEquals(NhaTramStatus.DRAFT, result.getStatus());
        assertEquals(NhaTramApprovalStatus.REJECTED, result.getApprovalStatus());
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-080: Search — returns filtered results")
    void testSearch() {
        when(phaoRepo.searchFiltered("Phao", "PHAO", BuoyType.CARDINAL, NhaTramStatus.DRAFT))
                .thenReturn(List.of(testEntity));

        List<NhaTramPhaoResponse> result = service.search("Phao", "PHAO", BuoyType.CARDINAL, NhaTramStatus.DRAFT);

        assertEquals(1, result.size());
        assertEquals("Phao Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-080: Search with no filters — returns all")
    void testSearchNoFilters() {
        when(phaoRepo.searchFiltered(null, null, null, null)).thenReturn(List.of(testEntity));

        List<NhaTramPhaoResponse> result = service.search(null, null, null, null);

        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("F-080: Reject with short reason — throws validation error")
    void testRejectShortReason() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.PENDING_APPROVAL);
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalArgumentException.class,
                () -> service.reject(testId, "Too short", "1"));
    }

    @Test
    @DisplayName("F-080: Approve L1 on wrong status — throws exception")
    void testApproveL1WrongStatus() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.DRAFT);
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalStateException.class,
                () -> service.approveL1(testId, "2"));
    }

    @Test
    @DisplayName("F-080: Approve L2 on wrong status — throws exception")
    void testApproveL2WrongStatus() {
        ReflectionTestUtils.setField(testEntity, "status", NhaTramStatus.DRAFT);
        when(phaoRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalStateException.class,
                () -> service.approveL2(testId, "3"));
    }
}
