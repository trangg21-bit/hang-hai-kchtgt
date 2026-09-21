package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.dto.buoyberth.HistoryEntry;
import com.hanghai.kchtg.port.entity.BuoyBerth;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuoyBerthApprovalServiceTest {

    private static final UUID BUOY_BERTH_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID UNKNOWN_USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private BuoyBerthRepository buoyBerthRepository;

    @Mock
    private InfrastructureApprovalService infrastructureApprovalService;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserResolverService userResolverService;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @InjectMocks
    private BuoyBerthApprovalService service;

    @Test
    void getHistory_doesNotExposeUuidWhenActorCannotBeResolved() {
        BuoyBerth buoyBerth = BuoyBerth.builder()
                .id(BUOY_BERTH_ID)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
        InfrastructureHistory history = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(BUOY_BERTH_ID)
                .refType(InfrastructureType.BUOY_BERTH)
                .status(InfrastructureHistoryStatus.UPDATED)
                .approvedBy(UNKNOWN_USER_ID)
                .approvedDate(LocalDateTime.now())
                .changedField("buoyBerthName")
                .previousValue("Bến phao cũ")
                .newValue("Bến phao mới")
                .build();

        when(buoyBerthRepository.findById(BUOY_BERTH_ID)).thenReturn(Optional.of(buoyBerth));
        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                InfrastructureType.BUOY_BERTH, BUOY_BERTH_ID)).thenReturn(List.of(history));
        when(userResolverService.resolveName(UNKNOWN_USER_ID)).thenReturn(null);

        List<HistoryEntry> result = service.getHistory(BUOY_BERTH_ID);

        assertThat(result).hasSize(1);
        HistoryEntry entry = result.get(0);
        assertThat(entry.getApprovedBy()).isEmpty();
        assertThat(entry.getApprovedByName()).isEmpty();
        assertThat(entry.getChangedBy()).isEmpty();
        assertThat(entry.getChangedByName()).isEmpty();
        assertThat(entry.getActor()).isEmpty();
        assertThat(entry.getActor()).doesNotContain(UNKNOWN_USER_ID.toString());
    }
}
