package com.hanghai.kchtg.gis.search.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.search.dto.GisObjectType;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchPage;
import com.hanghai.kchtg.gis.search.service.KchtGis155Service;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KchtGis155RestControllerTest {

    @Mock
    private KchtGis155Service service;

    @Test
    void searchUsesCurrentParameterNamesAndReturnsPagedEnvelope() {
        UUID orgUnitId = UUID.randomUUID();
        List<InfrastructureType> types = List.of(
                InfrastructureType.SEAPORT,
                InfrastructureType.NAVIGATION_CHANNEL);
        KchtGisSearchPage page = KchtGisSearchPage.builder()
                .content(List.of())
                .totalElements(42)
                .page(1)
                .size(20)
                .build();
        when(service.search(orgUnitId, types, 31, "Hải Phòng", "Lạch Huyện",
                GisObjectType.POINT, 1, 20)).thenReturn(page);

        KchtGis155RestController controller = new KchtGis155RestController(service);
        ResponseEntity<ApiResponse<KchtGisSearchPage>> response = controller.search(
                orgUnitId, types, null, 31, "Hải Phòng", null, "Lạch Huyện",
                GisObjectType.POINT, 1, 20);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).isSameAs(page);
        verify(service).search(orgUnitId, types, 31, "Hải Phòng", "Lạch Huyện",
                GisObjectType.POINT, 1, 20);
    }

    @Test
    void searchAcceptsLegacyInfrastructureTypeAlias() {
        List<InfrastructureType> legacyTypes = List.of(InfrastructureType.BUOY);
        KchtGisSearchPage page = KchtGisSearchPage.builder()
                .content(List.of())
                .totalElements(0)
                .page(0)
                .size(10)
                .build();
        when(service.search(null, legacyTypes, null, null, null, null, 0, 10)).thenReturn(page);

        KchtGis155RestController controller = new KchtGis155RestController(service);
        controller.search(null, null, legacyTypes, null, null, null, null, null, 0, 10);

        verify(service).search(null, legacyTypes, null, null, null, null, 0, 10);
    }

    @Test
    void searchAcceptsLegacyProvinceAlias() {
        KchtGisSearchPage page = KchtGisSearchPage.builder()
                .content(List.of())
                .totalElements(0)
                .page(0)
                .size(20)
                .build();
        when(service.search(null, null, null, "Hải Phòng", null, null, 0, 20)).thenReturn(page);

        KchtGis155RestController controller = new KchtGis155RestController(service);
        controller.search(null, null, null, null, null, "Hải Phòng", null, null, 0, 20);

        verify(service).search(null, null, null, "Hải Phòng", null, null, 0, 20);
    }
}
