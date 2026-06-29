package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.TaiSanKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.TaiSanKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKiemKe;
import com.hanghai.kchtg.assetmovement.repository.TaiSanKiemKeRepository;
import com.hanghai.kchtg.assetmovement.service.TaiSanKiemKeService;
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
class TaiSanKiemKeServiceTest {

    @InjectMocks
    private TaiSanKiemKeService service;

    @Mock
    private TaiSanKiemKeRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-125: create — returns created inventory record")
    void testCreate() {
        TaiSanKiemKeRequest request = new TaiSanKiemKeRequest();
        request.setKeHoachId(UUID.randomUUID());
        request.setTaiSanId(UUID.randomUUID());

        TaiSanKiemKe entity = TaiSanKiemKe.builder()
                .id(entityId)
                .keHoachId(request.getKeHoachId())
                .taiSanId(request.getTaiSanId())
                .trangThaiKiemKe(TrangThaiKiemKe.DA_KIEM_KE)
                .deleted(false)
                .build();

        when(repo.save(any(TaiSanKiemKe.class))).thenReturn(entity);

        TaiSanKiemKeResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-125: getById — returns inventory record by ID")
    void testGetById() {
        TaiSanKiemKe entity = TaiSanKiemKe.builder()
                .id(entityId)
                .trangThaiKiemKe(TrangThaiKiemKe.DA_KIEM_KE)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        TaiSanKiemKeResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals("DA_KIEM_KE", result.getTrangThaiKiemKe());
    }

    @Test
    @DisplayName("F-125: findAll — returns paginated inventory records")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        TaiSanKiemKe entity = TaiSanKiemKe.builder()
                .id(UUID.randomUUID())
                .trangThaiKiemKe(TrangThaiKiemKe.DA_KIEM_KE)
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<TaiSanKiemKeResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-125: update — returns updated inventory record")
    void testUpdate() {
        TaiSanKiemKe existing = TaiSanKiemKe.builder()
                .id(entityId)
                .trangThaiKiemKe(TrangThaiKiemKe.DA_KIEM_KE)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        TaiSanKiemKe updated = TaiSanKiemKe.builder()
                .id(entityId)
                .trangThaiKiemKe(TrangThaiKiemKe.DA_KIEM_KE)
                .build();
        when(repo.save(any(TaiSanKiemKe.class))).thenReturn(updated);

        TaiSanKiemKeResponse result = service.update(entityId, new TaiSanKiemKeRequest());

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-125: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-125: findByKeHoachId — returns records filtered by plan ID")
    void testFindByKeHoachId() {
        UUID keHoachId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        TaiSanKiemKe entity = TaiSanKiemKe.builder()
                .id(UUID.randomUUID())
                .keHoachId(keHoachId)
                .build();
        when(repo.findByKeHoachId(keHoachId, pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<TaiSanKiemKeResponse> result = service.findByKeHoachId(keHoachId, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-125: findByTrangThai — returns records filtered by status")
    void testFindByTrangThai() {
        Pageable pageable = PageRequest.of(0, 20);
        TaiSanKiemKe entity = TaiSanKiemKe.builder()
                .id(UUID.randomUUID())
                .trangThaiKiemKe(TrangThaiKiemKe.DA_KIEM_KE)
                .build();
        when(repo.findByTrangThaiKiemKe(TrangThaiKiemKe.DA_KIEM_KE, pageable))
                .thenReturn(new PageImpl<>(List.of(entity)));

        Page<TaiSanKiemKeResponse> result = service.findByTrangThai(TrangThaiKiemKe.DA_KIEM_KE, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("DA_KIEM_KE", result.getContent().get(0).getTrangThaiKiemKe());
    }
}
