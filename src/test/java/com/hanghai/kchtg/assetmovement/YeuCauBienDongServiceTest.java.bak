package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongResponse;
import com.hanghai.kchtg.assetmovement.entity.YeuCauBienDong;
import com.hanghai.kchtg.assetmovement.entity.LoaiBienDong;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.repository.YeuCauBienDongRepository;
import com.hanghai.kchtg.assetmovement.service.YeuCauBienDongService;
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
class YeuCauBienDongServiceTest {

    @InjectMocks
    private YeuCauBienDongService service;

    @Mock
    private YeuCauBienDongRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-127: create — returns created request")
    void testCreate() {
        YeuCauBienDongRequest request = new YeuCauBienDongRequest();
        request.setLoaiBienDong("TANG");
        request.setTenTaiSan("May tinh");
        request.setMoTa("Test bien dong");

        YeuCauBienDong entity = YeuCauBienDong.builder()
                .id(entityId)
                .loaiBienDong(LoaiBienDong.TANG)
                .moTa(request.getMoTa())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .deleted(false)
                .build();

        when(repo.save(any(YeuCauBienDong.class))).thenReturn(entity);

        YeuCauBienDongResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-127: getById — returns request by ID")
    void testGetById() {
        YeuCauBienDong entity = YeuCauBienDong.builder()
                .id(entityId)
                .loaiBienDong(LoaiBienDong.TANG)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        YeuCauBienDongResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals("TANG", result.getLoaiBienDong());
    }

    @Test
    @DisplayName("F-127: findAll — returns paginated requests")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        YeuCauBienDong entity = YeuCauBienDong.builder()
                .id(UUID.randomUUID())
                .loaiBienDong(LoaiBienDong.TANG)
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<YeuCauBienDongResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-127: update — returns updated request")
    void testUpdate() {
        YeuCauBienDong existing = YeuCauBienDong.builder()
                .id(entityId)
                .loaiBienDong(LoaiBienDong.TANG)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        YeuCauBienDong updated = YeuCauBienDong.builder()
                .id(entityId)
                .loaiBienDong(LoaiBienDong.TANG)
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.save(any(YeuCauBienDong.class))).thenReturn(updated);

        YeuCauBienDongRequest req = new YeuCauBienDongRequest();
        req.setLoaiBienDong("TANG");
        req.setTenTaiSan("May tinh");
        YeuCauBienDongResponse result = service.update(entityId, req);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-127: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-127: findByLoaiBienDong — returns requests filtered by type")
    void testFindByLoaiBienDong() {
        Pageable pageable = PageRequest.of(0, 20);
        YeuCauBienDong entity = YeuCauBienDong.builder()
                .id(UUID.randomUUID())
                .loaiBienDong(LoaiBienDong.TANG)
                .build();
        when(repo.findByLoaiBienDong(LoaiBienDong.TANG, pageable))
                .thenReturn(new PageImpl<>(List.of(entity)));

        Page<YeuCauBienDongResponse> result = service.findByLoaiBienDong(LoaiBienDong.TANG, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("TANG", result.getContent().get(0).getLoaiBienDong());
    }

    @Test
    @DisplayName("F-127: findByTrangThai — returns requests filtered by status")
    void testFindByTrangThai() {
        Pageable pageable = PageRequest.of(0, 20);
        YeuCauBienDong entity = YeuCauBienDong.builder()
                .id(UUID.randomUUID())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .build();
        when(repo.findByTrangThai(TrangThaiYeuCau.CHO_PHE_DUYET, pageable))
                .thenReturn(new PageImpl<>(List.of(entity)));

        Page<YeuCauBienDongResponse> result = service.findByTrangThai(TrangThaiYeuCau.CHO_PHE_DUYET, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("CHO_PHE_DUYET", result.getContent().get(0).getTrangThai());
    }
}
