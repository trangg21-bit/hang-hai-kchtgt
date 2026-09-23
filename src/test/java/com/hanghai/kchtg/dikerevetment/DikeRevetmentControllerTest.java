package com.hanghai.kchtg.dikerevetment;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.dikerevetment.controller.DikeRevetmentController;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentCreateRequest;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentResponse;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.service.DikeRevetmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DikeRevetmentControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private DikeRevetmentController controller;
    private DikeRevetmentService service;
    private Authentication authentication;

    private DikeRevetmentResponse testResp;
    private DikeRevetmentCreateRequest createReq;

    @BeforeEach
    void setUp() {
        service = mock(DikeRevetmentService.class);
        controller = new DikeRevetmentController(service);
        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("testuser");

        testResp = DikeRevetmentResponse.builder()
                .id(TEST_ID)
                .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                .location("Bac Giang")
                .length(new BigDecimal("150.5"))
                .crestElevation(new BigDecimal("10.0"))
                .height(new BigDecimal("5.0"))
                .surfaceMaterial("Betong")
                .status("1")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        createReq = DikeRevetmentCreateRequest.builder()
                .dikeRevetmentType(DikeRevetmentType.SAND_DIKE)
                .location("Ha Noi")
                .length(new BigDecimal("200.0"))
                .crestElevation(new BigDecimal("20.0"))
                .height(new BigDecimal("8.0"))
                .surfaceMaterial("Thep")
                .status("1")
                .build();
    }

    @Test
    void create_shouldReturnSuccessResponse() {
        when(service.create(any(), nullable(UUID.class))).thenReturn(testResp);
        var resp = controller.create(createReq, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Tạo đê kè thành công");
        verify(service, times(1)).create(any(), nullable(UUID.class));
    }

    @Test
    void getById_shouldReturnResponse() {
        when(service.getById(TEST_ID)).thenReturn(testResp);
        var resp = controller.getById(TEST_ID);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).getById(TEST_ID);
    }

    @Test
    void delete_shouldReturnOk() {
        doNothing().when(service).delete(eq(TEST_ID), any());
        var resp = controller.delete(TEST_ID, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Xóa đê kè thành công");
        verify(service, times(1)).delete(eq(TEST_ID), any());
    }

    @Test
    void approveC1_shouldReturnSuccess() {
        when(service.approveLevel1(eq(TEST_ID), nullable(UUID.class), any())).thenReturn(testResp);
        var resp = controller.approveC1(TEST_ID, "Duyệt C1", null, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).approveLevel1(eq(TEST_ID), nullable(UUID.class), eq("Duyệt C1"));
    }

    @Test
    void approveC2_shouldReturnSuccess() {
        when(service.approveLevel2(eq(TEST_ID), nullable(UUID.class), any())).thenReturn(testResp);
        var resp = controller.approveC2(TEST_ID, "Duyệt C2", null, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).approveLevel2(eq(TEST_ID), nullable(UUID.class), eq("Duyệt C2"));
    }

    @Test
    void rejectC1_shouldReturnSuccess() {
        when(service.rejectLevel1(eq(TEST_ID), nullable(UUID.class), any())).thenReturn(testResp);
        var resp = controller.rejectC1(TEST_ID, "Từ chối C1", null, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).rejectLevel1(eq(TEST_ID), nullable(UUID.class), eq("Từ chối C1"));
    }

    @Test
    void rejectC2_shouldReturnSuccess() {
        when(service.rejectLevel2(eq(TEST_ID), nullable(UUID.class), any())).thenReturn(testResp);
        var resp = controller.rejectC2(TEST_ID, "Từ chối C2", null, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).rejectLevel2(eq(TEST_ID), nullable(UUID.class), eq("Từ chối C2"));
    }

    @Test
    void getHistory_shouldReturnSuccess() {
        when(service.getHistory(eq(TEST_ID), any(), any(), any(), any(String.class), any(String.class))).thenReturn(List.of());
        var resp = controller.getHistory(TEST_ID, 0, 10, "keyword", "2026-01-01", "2026-01-31");
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData()).isEmpty();
        verify(service, times(1)).getHistory(eq(TEST_ID), eq(0), eq(10), eq("keyword"), eq("2026-01-01"), eq("2026-01-31"));
    }

    @Test
    void testResolveSort_Default() {
        org.springframework.data.domain.Sort sortNull = DikeRevetmentController.resolveSort(null, null);
        assertThat(sortNull.getOrderFor("d.updatedAt")).isNotNull();
        assertThat(sortNull.getOrderFor("d.updatedAt").getDirection()).isEqualTo(org.springframework.data.domain.Sort.Direction.DESC);

        org.springframework.data.domain.Sort sortEmpty = DikeRevetmentController.resolveSort("", "ASC");
        assertThat(sortEmpty.getOrderFor("d.updatedAt")).isNotNull();
    }

    @Test
    void testResolveSort_CodeAndName() {
        org.springframework.data.domain.Sort sort = DikeRevetmentController.resolveSort("codeAndName", "ASC");
        var orders = sort.toList();
        assertThat(orders.get(0).getProperty()).isEqualTo("LOWER(d.dikeRevetmentName)");
        assertThat(orders.get(0).getDirection()).isEqualTo(org.springframework.data.domain.Sort.Direction.ASC);

        org.springframework.data.domain.Sort sortDesc = DikeRevetmentController.resolveSort("codeAndName", "DESC");
        var ordersDesc = sortDesc.toList();
        assertThat(ordersDesc.get(0).getProperty()).isEqualTo("LOWER(d.dikeRevetmentName)");
        assertThat(ordersDesc.get(0).getDirection()).isEqualTo(org.springframework.data.domain.Sort.Direction.DESC);
    }

    @Test
    void testResolveSort_DikeRevetmentNameAndCode() {
        org.springframework.data.domain.Sort sortName = DikeRevetmentController.resolveSort("dikeRevetmentName", "ASC");
        assertThat(sortName.toList().get(0).getProperty()).isEqualTo("LOWER(d.dikeRevetmentName)");

        org.springframework.data.domain.Sort sortCode = DikeRevetmentController.resolveSort("code", "ASC");
        assertThat(sortCode.toList().get(0).getProperty()).isEqualTo("LOWER(d.code)");
    }

    @Test
    void testResolveSort_OrgUnitAndSeaport() {
        org.springframework.data.domain.Sort sortOrg = DikeRevetmentController.resolveSort("orgUnitName", "ASC");
        assertThat(sortOrg.toList().get(0).getProperty()).isEqualTo("LOWER(o.name)");

        org.springframework.data.domain.Sort sortPort = DikeRevetmentController.resolveSort("seaportName", "DESC");
        assertThat(sortPort.toList().get(0).getProperty()).isEqualTo("LOWER(p.portName)");
        assertThat(sortPort.toList().get(0).getDirection()).isEqualTo(org.springframework.data.domain.Sort.Direction.DESC);
    }

    @Test
    void testResolveSort_AuditFields() {
        assertThat(DikeRevetmentController.resolveSort("updatedByName", "ASC").toList().get(0).getProperty()).isEqualTo("d.updatedAt");
        assertThat(DikeRevetmentController.resolveSort("submittedByName", "DESC").toList().get(0).getProperty()).isEqualTo("d.submittedAt");
        assertThat(DikeRevetmentController.resolveSort("approvedByNameLevel1", "ASC").toList().get(0).getProperty()).isEqualTo("d.approvedDateLevel1");
        assertThat(DikeRevetmentController.resolveSort("approvedByNameLevel2", "ASC").toList().get(0).getProperty()).isEqualTo("d.approvedDateLevel2");
    }

    @Test
    void testSearchPaged_DelegatesToServiceWithSort() {
        when(service.searchPaged(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(testResp)));

        var resp = controller.searchPaged(
                null, null, null, null, null, null, null, false, null, null, null, null, null, null,
                0, 20, "codeAndName", "ASC"
        );

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        verify(service).searchPaged(
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                argThat(pageable -> {
                    var orders = pageable.getSort().toList();
                    return orders.size() >= 1 && "LOWER(d.dikeRevetmentName)".equals(orders.get(0).getProperty());
                })
        );
    }
}
