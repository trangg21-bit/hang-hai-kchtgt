package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.TaiSanKCHTRequest;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKCHTResponse;
import com.hanghai.kchtg.assetmovement.entity.TaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.LoaiTaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiTaiSan;
import com.hanghai.kchtg.assetmovement.repository.TaiSanKCHTRepository;
import com.hanghai.kchtg.assetmovement.service.TaiSanKCHTService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaiSanKCHTServiceTest {

    @InjectMocks
    private TaiSanKCHTService service;

    @Mock
    private TaiSanKCHTRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-101: create — returns response")
    void testCreate() {
        TaiSanKCHTRequest request = new TaiSanKCHTRequest();
        request.setMaTaiSan("TS-001");
        request.setTenTaiSan("May tinh");

        TaiSanKCHT entity = TaiSanKCHT.builder()
                .id(entityId)
                .maTaiSan(request.getMaTaiSan())
                .tenTaiSan(request.getTenTaiSan())
                .trangThai(TrangThaiTaiSan.DANG_QUAN_LY)
                .deleted(false)
                .build();

        when(repo.save(any(TaiSanKCHT.class))).thenReturn(entity);

        TaiSanKCHTResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-101: getById — returns asset by ID")
    void testGetById() {
        TaiSanKCHT entity = TaiSanKCHT.builder()
                .id(entityId)
                .maTaiSan("TS-001")
                .tenTaiSan("May tinh")
                .trangThai(TrangThaiTaiSan.DANG_QUAN_LY)
                .build();

        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        TaiSanKCHTResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals("TS-001", result.getMaTaiSan());
    }

    @Test
    @DisplayName("F-101: findAll — returns paginated assets")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        TaiSanKCHT entity = TaiSanKCHT.builder()
                .id(UUID.randomUUID())
                .maTaiSan("TS-001")
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<TaiSanKCHTResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-101: update — returns updated asset")
    void testUpdate() {
        TaiSanKCHT existing = TaiSanKCHT.builder()
                .id(entityId)
                .maTaiSan("TS-001")
                .tenTaiSan("May tinh")
                .trangThai(TrangThaiTaiSan.DANG_QUAN_LY)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        TaiSanKCHT updated = TaiSanKCHT.builder()
                .id(entityId)
                .maTaiSan("TS-001")
                .tenTaiSan("May tinh")
                .trangThai(TrangThaiTaiSan.DANG_QUAN_LY)
                .build();
        when(repo.save(any(TaiSanKCHT.class))).thenReturn(updated);

        TaiSanKCHTResponse result = service.update(entityId, new TaiSanKCHTRequest());

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-101: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-101: findByMaTaiSan — returns assets filtered by code")
    void testFindByMaTaiSan() {
        Pageable pageable = PageRequest.of(0, 20);
        TaiSanKCHT entity = TaiSanKCHT.builder()
                .id(UUID.randomUUID())
                .maTaiSan("TS-001")
                .build();
        when(repo.findByMaTaiSan("TS-001", pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<TaiSanKCHTResponse> result = service.findByMaTaiSan("TS-001", pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("TS-001", result.getContent().get(0).getMaTaiSan());
    }
}
