package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.InfraAsset;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.assetmovement.repository.InfraAssetRepository;
import com.hanghai.kchtg.assetmovement.service.InfraAssetService;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InfraAssetServiceTest {
    @InjectMocks
    private InfraAssetService service;

    @Mock
    private InfraAssetRepository repository;

    @Mock
    private UserResolverService userResolverService;

    @Test
    void createPortTerminalAssetKeepsBusinessFieldsAndCalculatesBookValues() {
        UUID berthId = UUID.randomUUID();
        UUID orgUnitId = UUID.randomUUID();
        InfraAssetRequest request = new InfraAssetRequest();
        request.setAssetName("Cầu dẫn bến số 1");
        request.setAssetType(InfraAssetType.PORT_TERMINAL);
        request.setBerthId(berthId);
        request.setOrgUnitId(orgUnitId);
        request.setAssetCondition("Tốt");
        request.setUseDate(LocalDate.of(2026, 9, 9));
        request.setOriginalValue(new BigDecimal("1000000"));
        request.setAccumulatedDepreciation(new BigDecimal("250000"));
        request.setDepreciationMonths(20);

        when(repository.findByAssetCode(any())).thenReturn(Optional.empty());
        when(repository.save(any(InfraAsset.class))).thenAnswer(invocation -> {
            InfraAsset entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });

        InfraAssetResponse response = service.create(request);

        assertNotNull(response.getId());
        assertEquals(InfraAssetType.PORT_TERMINAL.name(), response.getAssetType());
        assertEquals(berthId, response.getBerthId());
        assertEquals(orgUnitId, response.getOrgUnitId());
        assertEquals("Tốt", response.getAssetCondition());
        assertEquals(ApprovalStatus.DRAFT.name(), response.getApprovalStatus());
        assertEquals(new BigDecimal("750000"), response.getRemainingValue());
        assertEquals(new BigDecimal("50000.00"), response.getMonthlyDepreciation());
    }
}
