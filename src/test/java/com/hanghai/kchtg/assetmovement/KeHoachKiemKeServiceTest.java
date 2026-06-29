package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.KeHoachKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKeHoach;
import com.hanghai.kchtg.assetmovement.repository.KeHoachKiemKeRepository;
import com.hanghai.kchtg.assetmovement.service.KeHoachKiemKeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KeHoachKiemKeServiceTest {

    @InjectMocks
    private KeHoachKiemKeService service;

    @Mock
    private KeHoachKiemKeRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-125: create — returns created plan")
    void testCreate() {
        KeHoachKiemKeRequest request = new KeHoachKiemKeRequest();
        request.setTenKeHoach("Kiem ke tai san 2025");
        request.setMoTa("Mo ta ke hoach");

        KeHoachKiemKe entity = KeHoachKiemKe.builder()
                .id(entityId)
                .phamVi(request.getTenKeHoach())
                .moTa(request.getMoTa())
                .trangThai(TrangThaiKeHoach.CHO_PHE_DUYET)
                .deleted(false)
                .build();

        when(repo.save(any(KeHoachKiemKe.class))).thenReturn(entity);

        KeHoachKiemKeResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
        assertEquals(null, result.getTenKeHoach());
    }

    @Test
    @DisplayName("F-125: getById — returns plan by ID")
    void testGetById() {
        KeHoachKiemKe entity = KeHoachKiemKe.builder()
                .id(entityId)
                .phamVi("Kiem ke tai san 2025")
                .trangThai(TrangThaiKeHoach.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        KeHoachKiemKeResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals(null, result.getTenKeHoach());
    }

    @Test
    @DisplayName("F-125: findAll — returns paginated plans")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        KeHoachKiemKe entity = KeHoachKiemKe.builder()
                .id(UUID.randomUUID())
                .phamVi("Kiem ke 2025")
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<KeHoachKiemKeResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-125: update — returns updated plan")
    void testUpdate() {
        KeHoachKiemKe existing = KeHoachKiemKe.builder()
                .id(entityId)
                .phamVi("Kiem ke 2025")
                .trangThai(TrangThaiKeHoach.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        KeHoachKiemKe updated = KeHoachKiemKe.builder()
                .id(entityId)
                .phamVi("Kiem ke 2025 moi")
                .trangThai(TrangThaiKeHoach.CHO_PHE_DUYET)
                .build();
        when(repo.save(any(KeHoachKiemKe.class))).thenReturn(updated);

        KeHoachKiemKeRequest req = new KeHoachKiemKeRequest();
        req.setTenKeHoach("Kiem ke 2025 moi");
        KeHoachKiemKeResponse result = service.update(entityId, req);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
        assertEquals(null, result.getTenKeHoach());
    }

    @Test
    @DisplayName("F-125: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-125: findByTrangThai — returns plans filtered by status")
    void testFindByTrangThai() {
        Pageable pageable = PageRequest.of(0, 20);
        KeHoachKiemKe entity = KeHoachKiemKe.builder()
                .id(UUID.randomUUID())
                .phamVi("Kiem ke 2025")
                .trangThai(TrangThaiKeHoach.CHO_PHE_DUYET)
                .build();
        when(repo.findByTrangThai(TrangThaiKeHoach.CHO_PHE_DUYET, pageable))
                .thenReturn(new PageImpl<>(List.of(entity)));

        Page<KeHoachKiemKeResponse> result = service.findByTrangThai(TrangThaiKeHoach.CHO_PHE_DUYET, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("CHO_PHE_DUYET", result.getContent().get(0).getTrangThai());
    }
}
