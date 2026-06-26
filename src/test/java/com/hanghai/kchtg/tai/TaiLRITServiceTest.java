package com.hanghai.kchtg.tai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.tai.dto.lrit.CreateTaiLRITRequest;
import com.hanghai.kchtg.tai.dto.lrit.TaiLRITResponse;
import com.hanghai.kchtg.tai.dto.lrit.UpdateTaiLRITRequest;
import com.hanghai.kchtg.tai.entity.*;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import com.hanghai.kchtg.tai.repository.TaiLRITRepository;
import com.hanghai.kchtg.tai.repository.TaiRepository;
import com.hanghai.kchtg.tai.service.PointObjectSyncService;
import com.hanghai.kchtg.tai.service.TaiHistoryService;
import com.hanghai.kchtg.tai.service.TaiLRITService;
import com.hanghai.kchtg.tai.service.TaiNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaiLRITServiceTest {

    @InjectMocks
    private TaiLRITService service;

    @Mock
    private TaiLRITRepository taiRepo;

    @Mock
    private TaiHistoryRepository historyRepo;

    @Mock
    private TaiHistoryService historyService;

    @Mock
    private TaiNotificationService notificationService;

    @Mock
    private PointObjectSyncService pointObjectSyncService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private UUID testId;
    private TaiLRIT testEntity;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
        testId = UUID.randomUUID();
        testEntity = TaiLRIT.builder()
                .id(testId)
                .code("LRIT-001")
                .name("LRIT Demo")
                .taiType(TaiType.LRIT)
                .latitude(new BigDecimal("10.7769"))
                .longitude(new BigDecimal("106.7009"))
                .range(50)
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.PENDING)
                .deleted(false)
                .createdAt(Instant.now())
                .createdBy(UUID.randomUUID())
                .build();
    }

    @Test
    @DisplayName("F-015-030: findById — returns response when entity exists")
    void testFindByIdExists() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        TaiLRITResponse response = service.findById(testId);

        assertNotNull(response);
        assertEquals("LRIT Demo", response.getName());
        assertEquals("LRIT-001", response.getCode());
    }

    @Test
    @DisplayName("F-015-030: findById — throws when not found")
    void testFindByIdNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findById(testId));
    }

    @Test
    @DisplayName("F-015-030: findByCode — returns response when exists")
    void testFindByCodeExists() {
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.of(testEntity));

        TaiLRITResponse response = service.findByCode("LRIT-001");

        assertNotNull(response);
        assertEquals("LRIT Demo", response.getName());
    }

    @Test
    @DisplayName("F-015-030: findByCode — throws when not found")
    void testFindByCodeNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findByCode("LRIT-001"));
    }

    @Test
    @DisplayName("F-015-031: findAll — returns all entities")
    void testFindAll() {
        when(taiRepo.findAll()).thenReturn(List.of(testEntity));

        List<TaiLRITResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("LRIT Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-015-031: findAll — returns empty")
    void testFindAllEmpty() {
        when(taiRepo.findAll()).thenReturn(List.of());
        assertTrue(service.findAll().isEmpty());
    }

    @Test
    @DisplayName("F-015-032: create — creates with ACTIVE and PENDING")
    void testCreateSuccess() {
        CreateTaiLRITRequest request = new CreateTaiLRITRequest(
                "LRIT-002", "LRIT moi", TaiType.LRIT,
                new BigDecimal("10.000"), new BigDecimal("106.000"), 60);

        when(taiRepo.existsByCode("LRIT-002")).thenReturn(false);
        when(taiRepo.save(any(TaiLRIT.class))).thenAnswer(inv -> {
            TaiLRIT saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            saved.setCreatedBy(UUID.randomUUID());
            return saved;
        });

        TaiLRITResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("LRIT moi", result.getName());
        assertEquals(TaiStatus.ACTIVE, result.getStatus());
        assertEquals(TaiApprovalStatus.PENDING, result.getApprovalStatus());
        verify(taiRepo).save(any(TaiLRIT.class));
        verify(historyRepo).save(any());
        verify(notificationService).sendApproveNotification(eq("Tai LRIT: LRIT moi"), any());
    }

    @Test
    @DisplayName("F-015-032: create — throws when code already exists")
    void testCreateDuplicateCode() {
        CreateTaiLRITRequest request = new CreateTaiLRITRequest(
                "LRIT-001", "LRIT moi", TaiType.LRIT,
                new BigDecimal("10.000"), new BigDecimal("106.000"), 60);
        when(taiRepo.existsByCode("LRIT-001")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> service.create(request));
    }

    @Test
    @DisplayName("F-015-033: update — updates fields and saves history")
    void testUpdateSuccess() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiLRIT.class))).thenReturn(testEntity);

        UpdateTaiLRITRequest request = UpdateTaiLRITRequest.builder()
                .name("LRIT cap nhat")
                .latitude(new BigDecimal("11.000"))
                .longitude(new BigDecimal("107.000"))
                .range(70)
                .build();

        TaiLRITResponse result = service.update(testId, request);

        assertNotNull(result);
        verify(taiRepo).save(any(TaiLRIT.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-033: update — throws when not found")
    void testUpdateNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.update(testId, UpdateTaiLRITRequest.builder().build()));
    }

    @Test
    @DisplayName("F-015-033: update — throws when entity deleted")
    void testUpdateDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.update(testId, UpdateTaiLRITRequest.builder().build()));
    }

    @Test
    @DisplayName("F-015-034: delete — soft deletes with history")
    void testDeleteSoftDelete() {
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiLRIT.class))).thenReturn(testEntity);

        service.delete("LRIT-001");

        assertTrue(testEntity.getDeleted());
        assertNotNull(testEntity.getDeletedAt());
        verify(taiRepo).save(any(TaiLRIT.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-034: delete — throws when not found")
    void testDeleteNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.empty());
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.delete("LRIT-001"));
    }

    @Test
    @DisplayName("F-015-034: delete — throws if already deleted")
    void testDeleteAlreadyDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.of(testEntity));
        assertThrows(IllegalArgumentException.class, () -> service.delete("LRIT-001"));
    }

    @Test
    @DisplayName("F-015-035: approve — sets APPROVED, saves history")
    void testApproveSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiLRIT.class))).thenReturn(testEntity);

        TaiLRITResponse result = service.approve("LRIT-001", "OK", testId);

        assertEquals(TaiApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(testId, result.getApprovedBy());
        assertNotNull(result.getApprovedAt());
        verify(taiRepo).save(any(TaiLRIT.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-035: approve — throws when not found")
    void testApproveNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.empty());
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.approve("LRIT-001", "OK", testId));
    }

    @Test
    @DisplayName("F-015-035: reject — sets REJECTED status")
    void testRejectSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiLRIT.class))).thenReturn(testEntity);

        TaiLRITResponse result = service.reject("LRIT-001", "Ly do", testId);

        assertEquals(TaiApprovalStatus.REJECTED, result.getApprovalStatus());
        assertEquals(testId, result.getUnapprovedBy());
        verify(taiRepo).save(any(TaiLRIT.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-035: reject — throws when not found")
    void testRejectNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("LRIT-001")).thenReturn(Optional.empty());
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.reject("LRIT-001", "Ly do", testId));
    }

    @Test
    @DisplayName("F-015-036: countByStatus — returns count")
    void testCountByStatus() {
        when(taiRepo.countByStatus(TaiStatus.ACTIVE)).thenReturn(1L);
        assertEquals(1, service.countByStatus(TaiStatus.ACTIVE));
    }

    @Test
    @DisplayName("F-015-036: deleteByCode — delegates to repo")
    void testDeleteByCode() {
        service.deleteByCode("LRIT-001");
        verify(taiRepo).deleteByCode("LRIT-001");
    }

    @Test
    @DisplayName("F-015-037: syncToMapPhao — logs message")
    void testSyncToMapPhao() {
        UUID id = UUID.randomUUID();
        service.syncToMapPhao(id);
        verifyNoMoreInteractions(taiRepo);
    }

    @Test
    @DisplayName("F-015-037: hideFromMapPhao — logs message")
    void testHideFromMapPhao() {
        UUID id = UUID.randomUUID();
        service.hideFromMapPhao(id);
        verifyNoMoreInteractions(taiRepo);
    }
}
