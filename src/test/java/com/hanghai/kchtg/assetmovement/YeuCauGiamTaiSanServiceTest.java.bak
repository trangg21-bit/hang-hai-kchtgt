package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.YeuCauGiamTaiSan;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.repository.YeuCauGiamTaiSanRepository;
import com.hanghai.kchtg.assetmovement.service.YeuCauGiamTaiSanService;
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
class YeuCauGiamTaiSanServiceTest {

    @InjectMocks
    private YeuCauGiamTaiSanService service;

    @Mock
    private YeuCauGiamTaiSanRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-123: create — returns created request")
    void testCreate() {
        YeuCauGiamTaiSanRequest request = new YeuCauGiamTaiSanRequest();
        request.setTaiSanId(UUID.randomUUID());
        request.setLyDo("Test giam");

        YeuCauGiamTaiSan entity = YeuCauGiamTaiSan.builder()
                .id(entityId)
                .taiSanId(request.getTaiSanId())
                .moTa(request.getLyDo())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .deleted(false)
                .build();

        when(repo.save(any(YeuCauGiamTaiSan.class))).thenReturn(entity);

        YeuCauGiamTaiSanResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-123: getById — returns request by ID")
    void testGetById() {
        YeuCauGiamTaiSan entity = YeuCauGiamTaiSan.builder()
                .id(entityId)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        YeuCauGiamTaiSanResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-123: findAll — returns paginated requests")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        YeuCauGiamTaiSan entity = YeuCauGiamTaiSan.builder()
                .id(UUID.randomUUID())
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<YeuCauGiamTaiSanResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-123: update — returns updated request")
    void testUpdate() {
        YeuCauGiamTaiSan existing = YeuCauGiamTaiSan.builder()
                .id(entityId)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        YeuCauGiamTaiSan updated = YeuCauGiamTaiSan.builder()
                .id(entityId)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.save(any(YeuCauGiamTaiSan.class))).thenReturn(updated);

        YeuCauGiamTaiSanResponse result = service.update(entityId, new YeuCauGiamTaiSanRequest());

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-123: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-123: findByTaiSanId — returns requests filtered by asset ID")
    void testFindByTaiSanId() {
        UUID taiSanId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        YeuCauGiamTaiSan entity = YeuCauGiamTaiSan.builder()
                .id(UUID.randomUUID())
                .taiSanId(taiSanId)
                .build();
        when(repo.findByTaiSanId(taiSanId, pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<YeuCauGiamTaiSanResponse> result = service.findByTaiSanId(taiSanId, pageable);

        assertEquals(1, result.getTotalElements());
    }
}
