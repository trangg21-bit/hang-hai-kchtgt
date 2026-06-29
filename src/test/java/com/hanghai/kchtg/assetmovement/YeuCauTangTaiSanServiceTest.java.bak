package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.YeuCauTangTaiSan;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.repository.YeuCauTangTaiSanRepository;
import com.hanghai.kchtg.assetmovement.service.YeuCauTangTaiSanService;
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
class YeuCauTangTaiSanServiceTest {

    @InjectMocks
    private YeuCauTangTaiSanService service;

    @Mock
    private YeuCauTangTaiSanRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-122: create — returns created request")
    void testCreate() {
        YeuCauTangTaiSanRequest request = new YeuCauTangTaiSanRequest();
        request.setTaiSanId(UUID.randomUUID());
        request.setLyDo("Test tang");

        YeuCauTangTaiSan entity = YeuCauTangTaiSan.builder()
                .id(entityId)
                .taiSanId(request.getTaiSanId())
                .moTa(request.getLyDo())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .deleted(false)
                .build();

        when(repo.save(any(YeuCauTangTaiSan.class))).thenReturn(entity);

        YeuCauTangTaiSanResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-122: getById — returns request by ID")
    void testGetById() {
        YeuCauTangTaiSan entity = YeuCauTangTaiSan.builder()
                .id(entityId)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        YeuCauTangTaiSanResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-122: findAll — returns paginated requests")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        YeuCauTangTaiSan entity = YeuCauTangTaiSan.builder()
                .id(UUID.randomUUID())
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<YeuCauTangTaiSanResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-122: update — returns updated request")
    void testUpdate() {
        YeuCauTangTaiSan existing = YeuCauTangTaiSan.builder()
                .id(entityId)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        YeuCauTangTaiSan updated = YeuCauTangTaiSan.builder()
                .id(entityId)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.save(any(YeuCauTangTaiSan.class))).thenReturn(updated);

        YeuCauTangTaiSanResponse result = service.update(entityId, new YeuCauTangTaiSanRequest());

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-122: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-122: findByTaiSanId — returns requests filtered by asset ID")
    void testFindByTaiSanId() {
        UUID taiSanId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        YeuCauTangTaiSan entity = YeuCauTangTaiSan.builder()
                .id(UUID.randomUUID())
                .taiSanId(taiSanId)
                .build();
        when(repo.findByTaiSanId(taiSanId, pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<YeuCauTangTaiSanResponse> result = service.findByTaiSanId(taiSanId, pageable);

        assertEquals(1, result.getTotalElements());
    }
}
