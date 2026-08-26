package com.hanghai.kchtg.gis.controller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanningGisControllerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void updateStatusUsesCompleteSourceFeatureIdentity() {
        String sql = "UPDATE qhcb_all.area SET status = ?, color = ? "
                + "WHERE schema_name = ? AND table_name = ? AND fid = ?";
        when(jdbcTemplate.update(sql, "Bến cảng phát triển có điều kiện", 1,
                "nam_dinh", "BenCangPhatTrienCoDieuKien_A", 3L)).thenReturn(1);

        PlanningGisController controller = new PlanningGisController(jdbcTemplate);
        var response = controller.updateFeatureStatus("AREA", 3L, "nam_dinh",
                "BenCangPhatTrienCoDieuKien_A", "Bến cảng phát triển có điều kiện", 1);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        verify(jdbcTemplate).update(sql, "Bến cảng phát triển có điều kiện", 1,
                "nam_dinh", "BenCangPhatTrienCoDieuKien_A", 3L);
    }

    @Test
    void updateStatusRejectsUnknownGeometryTable() {
        PlanningGisController controller = new PlanningGisController(jdbcTemplate);

        assertThatThrownBy(() -> controller.updateFeatureStatus("unknown", 3L,
                "nam_dinh", "BenCangPhatTrienCoDieuKien_A", "Trạng thái", 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
        verifyNoInteractions(jdbcTemplate);
    }
}
