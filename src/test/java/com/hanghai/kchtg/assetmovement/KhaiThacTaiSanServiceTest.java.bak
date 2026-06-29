package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.KhaiThacTaiSan;
import com.hanghai.kchtg.assetmovement.repository.KhaiThacTaiSanRepository;
import com.hanghai.kchtg.assetmovement.service.KhaiThacTaiSanService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KhaiThacTaiSanServiceTest {

    @InjectMocks
    private KhaiThacTaiSanService service;

    @Mock
    private KhaiThacTaiSanRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-126: create — returns created exploitation record")
    void testCreate() {
        KhaiThacTaiSanRequest request = new KhaiThacTaiSanRequest();
        request.setTaiSanId(UUID.randomUUID());
        request.setNamKhaiThac(2025);

        KhaiThacTaiSan entity = KhaiThacTaiSan.builder()
                .id(entityId)
                .taiSanId(request.getTaiSanId())
                .namKhaiThac(request.getNamKhaiThac())
                .deleted(false)
                .build();

        when(repo.save(any(KhaiThacTaiSan.class))).thenReturn(entity);

        KhaiThacTaiSanResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-126: getById — returns exploitation record by ID")
    void testGetById() {
        KhaiThacTaiSan entity = KhaiThacTaiSan.builder()
                .id(entityId)
                .namKhaiThac(2025)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        KhaiThacTaiSanResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals(2025, result.getNamKhaiThac());
    }

    @Test
    @DisplayName("F-126: findAll — returns paginated exploitation records")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        KhaiThacTaiSan entity = KhaiThacTaiSan.builder()
                .id(UUID.randomUUID())
                .namKhaiThac(2025)
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<KhaiThacTaiSanResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-126: update — returns updated exploitation record")
    void testUpdate() {
        KhaiThacTaiSan existing = KhaiThacTaiSan.builder()
                .id(entityId)
                .namKhaiThac(2025)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        KhaiThacTaiSan updated = KhaiThacTaiSan.builder()
                .id(entityId)
                .namKhaiThac(2025)
                .build();
        when(repo.save(any(KhaiThacTaiSan.class))).thenReturn(updated);

        KhaiThacTaiSanResponse result = service.update(entityId, new KhaiThacTaiSanRequest());

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-126: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-126: findByNamKhaiThac — returns records filtered by year")
    void testFindByNamKhaiThac() {
        Pageable pageable = PageRequest.of(0, 20);
        KhaiThacTaiSan entity = KhaiThacTaiSan.builder()
                .id(UUID.randomUUID())
                .namKhaiThac(2025)
                .build();
        when(repo.findByNamKhaiThac(2025, pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<KhaiThacTaiSanResponse> result = service.findByNamKhaiThac(2025, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(2025, result.getContent().get(0).getNamKhaiThac());
    }

    @Test
    @DisplayName("F-126: calculateHaoMon — returns BigDecimal")
    void testCalculateHaoMon() {
        KhaiThacTaiSan entity = KhaiThacTaiSan.builder()
                .id(entityId)
                .taiSanId(entityId)
                .chiPhiVanHanh(BigDecimal.TEN)
                .build();
        when(repo.findByTaiSanId(entityId)).thenReturn(List.of(entity));

        BigDecimal result = service.calculateHaoMon(entityId);
        assertNotNull(result);
        assertEquals(BigDecimal.TEN, result);
    }
}
