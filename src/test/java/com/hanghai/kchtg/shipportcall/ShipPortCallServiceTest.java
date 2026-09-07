package com.hanghai.kchtg.shipportcall;

import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.shipportcall.dto.ShipPortCallCreateRequest;
import com.hanghai.kchtg.shipportcall.dto.ShipPortCallResponse;
import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import com.hanghai.kchtg.shipportcall.repository.ShipPortCallRepository;
import com.hanghai.kchtg.shipportcall.service.ShipPortCallService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ShipPortCallService} (F-300 «Tàu biển ra vào cảng biển»).
 * Covers the create write path: orgUnit assignment (NOT NULL), write-scope rejection via
 * {@link OrgUnitScopeService.Scope#allows(UUID)}, server-side text trimming, and the
 * response mapping of {@code orgUnitName} through {@link OrgUnitCacheService}.
 */
@ExtendWith(MockitoExtension.class)
class ShipPortCallServiceTest {

    private static final UUID ORG_UNIT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID OTHER_ORG_UNIT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID USER_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private ShipPortCallRepository repository;

    @Mock
    private OrgUnitScopeService orgUnitScopeService;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @InjectMocks
    private ShipPortCallService service;

    private ShipPortCallCreateRequest validRequest() {
        ShipPortCallCreateRequest request = new ShipPortCallCreateRequest();
        request.setOrgUnitId(ORG_UNIT_ID);
        request.setReportDate(LocalDate.of(2026, 9, 1));
        request.setShipName("  Tàu Hải An 01  ");
        request.setCallSign("   ");
        request.setNationality("  HỒNG KÔNG  ");
        request.setExportTons(new BigDecimal("123.5000"));
        return request;
    }

    @Test
    void create_persistsRowWithNonNullOrgUnitTrimsTextAndSetsOperator() {
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(orgUnitCacheService.getName(ORG_UNIT_ID)).thenReturn("Cảng vụ Hàng hải Hải Phòng");
        when(repository.save(any(ShipPortCall.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ShipPortCallResponse response = service.create(validRequest(), USER_ID);

        ArgumentCaptor<ShipPortCall> captor = ArgumentCaptor.forClass(ShipPortCall.class);
        verify(repository).save(captor.capture());
        ShipPortCall saved = captor.getValue();
        // AC-025-02: row carries non-null org_unit_id chosen by the user
        assertThat(saved.getOrgUnitId()).isNotNull().isEqualTo(ORG_UNIT_ID);
        assertThat(saved.getReportDate()).isEqualTo(LocalDate.of(2026, 9, 1));
        // AC-025-04: leading/trailing whitespace trimmed before persist
        assertThat(saved.getShipName()).isEqualTo("Tàu Hải An 01");
        assertThat(saved.getNationality()).isEqualTo("HỒNG KÔNG");
        // Blank input becomes null (trim-to-null)
        assertThat(saved.getCallSign()).isNull();
        assertThat(saved.getCreatedBy()).isEqualTo(USER_ID);
        // orgUnitName resolved through OrgUnitCacheService in the response
        assertThat(response.getOrgUnitId()).isEqualTo(ORG_UNIT_ID);
        assertThat(response.getOrgUnitName()).isEqualTo("Cảng vụ Hàng hải Hải Phòng");
    }

    @Test
    void create_acceptsOrgUnitInsideUserScope() {
        // OrgUnitScopeService.Scope.allows(ORG_UNIT_ID) == true via real restricted Scope
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(OrgUnitScopeService.Scope.restricted(List.of(ORG_UNIT_ID)));
        when(orgUnitCacheService.getName(ORG_UNIT_ID)).thenReturn("Cảng vụ Hàng hải Hải Phòng");
        when(repository.save(any(ShipPortCall.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ShipPortCallResponse response = service.create(validRequest(), USER_ID);

        assertThat(response.getOrgUnitId()).isEqualTo(ORG_UNIT_ID);
        verify(repository).save(any(ShipPortCall.class));
    }

    @Test
    void create_rejectsOutOfScopeOrgUnitWithoutPersisting() {
        // AC-025-05: orgUnit outside the caller's subtree → 403-equivalent rejection, no row
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(OrgUnitScopeService.Scope.restricted(List.of(OTHER_ORG_UNIT_ID)));

        ShipPortCallCreateRequest request = validRequest();

        assertThatThrownBy(() -> service.create(request, USER_ID))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Đơn vị báo cáo ngoài phạm vi cho phép");
        verify(repository, never()).save(any(ShipPortCall.class));
    }
}
