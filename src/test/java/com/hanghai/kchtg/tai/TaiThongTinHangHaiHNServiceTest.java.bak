package com.hanghai.kchtg.tai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.tai.dto.hanoi_hai.CreateTaiThongTinHangHaiHNRequest;
import com.hanghai.kchtg.tai.dto.hanoi_hai.TaiThongTinHangHaiHNResponse;
import com.hanghai.kchtg.tai.dto.hanoi_hai.UpdateTaiThongTinHangHaiHNRequest;
import com.hanghai.kchtg.tai.entity.*;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import com.hanghai.kchtg.tai.repository.TaiThongTinHangHaiHNRepository;
import com.hanghai.kchtg.tai.service.PointObjectSyncService;
import com.hanghai.kchtg.tai.service.TaiHistoryService;
import com.hanghai.kchtg.tai.service.TaiNotificationService;
import com.hanghai.kchtg.tai.service.TaiThongTinHangHaiHNService;
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
class TaiThongTinHangHaiHNServiceTest {

    @InjectMocks
    private TaiThongTinHangHaiHNService service;

    @Mock
    private TaiThongTinHangHaiHNRepository taiRepo;

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
    private TaiThongTinHangHaiHN testEntity;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
        testId = UUID.randomUUID();
        testEntity = TaiThongTinHangHaiHN.builder()
                .id(testId)
                .code("THN-001")
                .name("THN Demo")
                .taiType(TaiType.HANOI_HAI)
                .frequency(new BigDecimal("2182.000"))
                .range(10)
                .department("VPHH-QG")
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.PENDING)
                .deleted(false)
                .createdAt(Instant.now())
                .createdBy(UUID.randomUUID())
                .build();
    }

    // -- READ --

    @Test
    @DisplayName("F-099: findById — returns response when entity exists")
    void testFindByIdExists() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        TaiThongTinHangHaiHNResponse response = service.findById(testId);

        assertNotNull(response);
        assertEquals("THN Demo", response.getName());
        assertEquals("THN-001", response.getCode());
    }

    @Test
    @DisplayName("F-099: findById — throws when not found")
    void testFindByIdNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findById(testId));
    }

    @Test
    @DisplayName("F-099: findByCode — returns response when exists")
    void testFindByCodeExists() {
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.of(testEntity));

        TaiThongTinHangHaiHNResponse response = service.findByCode("THN-001");

        assertNotNull(response);
        assertEquals("THN Demo", response.getName());
    }

    @Test
    @DisplayName("F-099: findByCode — throws when not found")
    void testFindByCodeNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findByCode("THN-001"));
    }

    @Test
    @DisplayName("F-099: findAll — returns all entities")
    void testFindAll() {
        when(taiRepo.findAll()).thenReturn(List.of(testEntity));

        List<TaiThongTinHangHaiHNResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("THN Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-099: findAll — returns empty")
    void testFindAllEmpty() {
        when(taiRepo.findAll()).thenReturn(List.of());
        assertTrue(service.findAll().isEmpty());
    }

    // -- CREATE --

    @Test
    @DisplayName("F-100: create — creates with ACTIVE and PENDING")
    void testCreateSuccess() {
        CreateTaiThongTinHangHaiHNRequest request = new CreateTaiThongTinHangHaiHNRequest(
                "THN-002", "THN moi", TaiType.HANOI_HAI,
                new BigDecimal("2182.000"), 15, "VPHH-QG");

        when(taiRepo.existsByCode("THN-002")).thenReturn(false);
        when(taiRepo.save(any(TaiThongTinHangHaiHN.class))).thenAnswer(inv -> {
            TaiThongTinHangHaiHN saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            saved.setCreatedBy(UUID.randomUUID());
            return saved;
        });

        TaiThongTinHangHaiHNResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("THN moi", result.getName());
        assertEquals(TaiStatus.ACTIVE, result.getStatus());
        assertEquals(TaiApprovalStatus.PENDING, result.getApprovalStatus());
        verify(taiRepo).save(any(TaiThongTinHangHaiHN.class));
        verify(historyRepo).save(any());
        verify(notificationService).sendApproveNotification(eq("Tai TT Hang Hai HN: THN moi"), any());
    }

    @Test
    @DisplayName("F-100: create — throws when code already exists in taiRepo")
    void testCreateDuplicateCode() {
        CreateTaiThongTinHangHaiHNRequest request = new CreateTaiThongTinHangHaiHNRequest(
                "THN-001", "THN moi", TaiType.HANOI_HAI,
                new BigDecimal("2182.000"), 15, "VPHH-QG");
        when(taiRepo.existsByCode("THN-001")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
    }

    // -- UPDATE --

    @Test
    @DisplayName("F-101: update — updates fields and saves history")
    void testUpdateSuccess() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiThongTinHangHaiHN.class))).thenReturn(testEntity);

        UpdateTaiThongTinHangHaiHNRequest request = UpdateTaiThongTinHangHaiHNRequest.builder()
                .name("THN cap nhat")
                .frequency(new BigDecimal("2185.000"))
                .range(20)
                .department("VPHH-MIEN-BAC")
                .build();

        TaiThongTinHangHaiHNResponse result = service.update(testId, request);

        assertNotNull(result);
        verify(taiRepo).save(any(TaiThongTinHangHaiHN.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-101: update — throws when not found")
    void testUpdateNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class,
                () -> service.update(testId, UpdateTaiThongTinHangHaiHNRequest.builder().build()));
    }

    @Test
    @DisplayName("F-101: update — throws when entity deleted")
    void testUpdateDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        assertThrows(jakarta.persistence.EntityNotFoundException.class,
                () -> service.update(testId, UpdateTaiThongTinHangHaiHNRequest.builder().build()));
    }

    // -- DELETE --

    @Test
    @DisplayName("F-102: delete — soft deletes with history")
    void testDeleteSoftDelete() {
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiThongTinHangHaiHN.class))).thenReturn(testEntity);

        service.delete("THN-001");

        assertTrue(testEntity.getDeleted());
        assertNotNull(testEntity.getDeletedAt());
        assertNotNull(testEntity.getDeletedBy());
        verify(taiRepo).save(any(TaiThongTinHangHaiHN.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-102: delete — throws when not found")
    void testDeleteNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.delete("THN-001"));
    }

    @Test
    @DisplayName("F-102: delete — throws if already deleted")
    void testDeleteAlreadyDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalArgumentException.class, () -> service.delete("THN-001"));
    }

    // -- APPROVAL --

    @Test
    @DisplayName("F-103: approve — sets APPROVED, saves history")
    void testApproveSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiThongTinHangHaiHN.class))).thenReturn(testEntity);

        TaiThongTinHangHaiHNResponse result = service.approve("THN-001", "OK", testId);

        assertEquals(TaiApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(testId, result.getApprovedBy());
        assertNotNull(result.getApprovedAt());
        assertEquals("OK", result.getApprovedRemarks());
        verify(taiRepo).save(any(TaiThongTinHangHaiHN.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-103: approve — throws when not found")
    void testApproveNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.approve("THN-001", "OK", testId));
    }

    @Test
    @DisplayName("F-103: reject — sets REJECTED status")
    void testRejectSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiThongTinHangHaiHN.class))).thenReturn(testEntity);

        TaiThongTinHangHaiHNResponse result = service.reject("THN-001", "Ly do tu choi", testId);

        assertEquals(TaiApprovalStatus.REJECTED, result.getApprovalStatus());
        assertEquals(testId, result.getUnapprovedBy());
        assertNotNull(result.getUnapprovedAt());
        verify(taiRepo).save(any(TaiThongTinHangHaiHN.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-103: reject — throws when not found")
    void testRejectNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("THN-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.reject("THN-001", "Ly do", testId));
    }

    // -- COUNTS --

    @Test
    @DisplayName("F-104: countByStatus — returns count")
    void testCountByStatus() {
        when(taiRepo.countByStatus(TaiStatus.ACTIVE)).thenReturn(2L);
        assertEquals(2, service.countByStatus(TaiStatus.ACTIVE));
    }

    @Test
    @DisplayName("F-104: deleteByCode — delegates to repo")
    void testDeleteByCode() {
        service.deleteByCode("THN-001");
        verify(taiRepo).deleteByCode("THN-001");
    }

    // -- MAP SYNC STUBS --

    @Test
    @DisplayName("F-105: syncToMapPhao — logs message")
    void testSyncToMapPhao() {
        UUID id = UUID.randomUUID();
        service.syncToMapPhao(id);
        // syncToMapPhao is a log-only stub, no interactions expected
        verifyNoMoreInteractions(taiRepo);
    }

    @Test
    @DisplayName("F-105: hideFromMapPhao — logs message")
    void testHideFromMapPhao() {
        UUID id = UUID.randomUUID();
        service.hideFromMapPhao(id);
        verifyNoMoreInteractions(taiRepo);
    }
}
