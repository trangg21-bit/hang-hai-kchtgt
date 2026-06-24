package com.hanghai.kchtg.integration;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
@ActiveProfiles("test")
class IntegrationShareControllerEnhancedTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private PointObjectRepository pointRepository;

    @MockBean
    private LineObjectRepository lineRepository;

    @MockBean
    private PolygonObjectRepository polygonRepository;

    private static final String VALID_TOKEN = "integration-secret-token-2026";

    @Nested
    @DisplayName("GET /points/ports")
    class PortsEndpoints {

        @Test
        @DisplayName("Should return 401 when token is missing")
        void missingToken_unauthorized() throws Exception {
            mockMvc.perform(get("/api/v1/integration/share/points/ports")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Should return 401 when token is invalid")
        void invalidToken_unauthorized() throws Exception {
            mockMvc.perform(get("/api/v1/integration/share/points/ports")
                            .header("X-Integration-Token", "wrong-token")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should return 200 with PierDto data when token is valid")
        void validToken_success() throws Exception {
            PointObject port = new PointObject();
            port.setCode("PIER-001");
            port.setName("Ben caang");
            port.setObjectType(PointObject.ObjectType.PORT);
            port.setLatitude(20.8449);
            port.setLongitude(106.6881);
            port.setStatus(PointObject.Status.PUBLISHED);
            when(pointRepository.findByObjectTypeAndStatus(eq(PointObject.ObjectType.PORT), eq(PointObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(port)));

            mockMvc.perform(get("/api/v1/integration/share/points/ports")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].code").value("PIER-001"))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("PORT"));
        }
    }

    @Nested
    @DisplayName("GET /points/buoys")
    class BuoysEndpoints {

        @Test
        @DisplayName("Should return 401 when token is missing")
        void missingToken_unauthorized() throws Exception {
            mockMvc.perform(get("/api/v1/integration/share/points/buoys")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Should return 200 with BuoyBerthDto data when token is valid")
        void validToken_success() throws Exception {
            PointObject buoy = new PointObject();
            buoy.setCode("BUOY-001");
            buoy.setName("Phao tieu");
            buoy.setObjectType(PointObject.ObjectType.BUOY);
            buoy.setLatitude(10.7769);
            buoy.setLongitude(106.7004);
            buoy.setStatus(PointObject.Status.PUBLISHED);
            when(pointRepository.findByObjectTypeAndStatus(eq(PointObject.ObjectType.BUOY), eq(PointObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(buoy)));

            mockMvc.perform(get("/api/v1/integration/share/points/buoys")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("BUOY"));
        }
    }

    @Nested
    @DisplayName("GET /points/beacons")
    class BeaconsEndpoints {

        @Test
        @DisplayName("Should return 200 with BeaconDto data when token is valid")
        void validToken_success() throws Exception {
            PointObject beacon = new PointObject();
            beacon.setCode("BEACON-001");
            beacon.setName("Den bien");
            beacon.setObjectType(PointObject.ObjectType.BEACON);
            beacon.setLatitude(16.0470);
            beacon.setLongitude(108.2200);
            beacon.setStatus(PointObject.Status.PUBLISHED);
            when(pointRepository.findByObjectTypeAndStatus(eq(PointObject.ObjectType.BEACON), eq(PointObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(beacon)));

            mockMvc.perform(get("/api/v1/integration/share/points/beacons")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("BEACON"));
        }
    }

    @Nested
    @DisplayName("GET /lines/waterways")
    class WaterwaysEndpoints {

        @Test
        @DisplayName("Should return 200 with BridgeDto data when token is valid")
        void validToken_success() throws Exception {
            LineObject waterway = new LineObject();
            waterway.setCode("BRG-001");
            waterway.setName("Cau caang");
            waterway.setObjectType(LineObject.ObjectType.WATERWAY);
            waterway.setCoordinates("LINESTRING(108.2022 16.0544, 108.2296 16.0630)");
            waterway.setStatus(LineObject.Status.PUBLISHED);
            when(lineRepository.findByObjectTypeAndStatus(eq(LineObject.ObjectType.WATERWAY), eq(LineObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(waterway)));

            mockMvc.perform(get("/api/v1/integration/share/lines/waterways")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("WATERWAY"));
        }
    }

    @Nested
    @DisplayName("GET /lines/shipping-routes")
    class ShippingRoutesEndpoints {

        @Test
        @DisplayName("Should return 200 with TransportRouteDto data when token is valid")
        void validToken_success() throws Exception {
            LineObject route = new LineObject();
            route.setCode("ROUTE-001");
            route.setName("Tuyen chuyen tai");
            route.setObjectType(LineObject.ObjectType.SHIPPING_ROUTE);
            route.setCoordinates("LINESTRING(106.6881 20.8449, 108.2022 16.0544)");
            route.setStatus(LineObject.Status.PUBLISHED);
            when(lineRepository.findByObjectTypeAndStatus(eq(LineObject.ObjectType.SHIPPING_ROUTE), eq(LineObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(route)));

            mockMvc.perform(get("/api/v1/integration/share/lines/shipping-routes")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("SHIPPING_ROUTE"));
        }
    }

    @Nested
    @DisplayName("GET /polygons/anchorage")
    class AnchorageEndpoints {

        @Test
        @DisplayName("Should return 200 with AnchorageDto data when token is valid")
        void validToken_success() throws Exception {
            PolygonObject anchorage = new PolygonObject();
            anchorage.setCode("ANCH-001");
            anchorage.setName("Khu neo dau");
            anchorage.setObjectType(PolygonObject.ObjectType.ANCHORAGE);
            anchorage.setCoordinates("POLYGON((106.65 20.82, 106.72 20.82, 106.72 20.87, 106.65 20.87, 106.65 20.82))");
            anchorage.setStatus(PolygonObject.Status.PUBLISHED);
            when(polygonRepository.findByObjectTypeAndStatus(eq(PolygonObject.ObjectType.ANCHORAGE), eq(PolygonObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(anchorage)));

            mockMvc.perform(get("/api/v1/integration/share/polygons/anchorage")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("ANCHORAGE"));
        }
    }

    @Nested
    @DisplayName("GET /polygons/storm-shelter")
    class StormShelterEndpoints {

        @Test
        @DisplayName("Should return 200 with StormShelterDto data when token is valid")
        void validToken_success() throws Exception {
            PolygonObject shelter = new PolygonObject();
            shelter.setCode("STORM-001");
            shelter.setName("Khu tranh bao");
            shelter.setObjectType(PolygonObject.ObjectType.STORM_SHELTER);
            shelter.setCoordinates("POLYGON((107.10 20.90, 107.20 20.90, 107.20 21.00, 107.10 21.00, 107.10 20.90))");
            shelter.setStatus(PolygonObject.Status.PUBLISHED);
            when(polygonRepository.findByObjectTypeAndStatus(eq(PolygonObject.ObjectType.STORM_SHELTER), eq(PolygonObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(shelter)));

            mockMvc.perform(get("/api/v1/integration/share/polygons/storm-shelter")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("STORM_SHELTER"));
        }
    }

    @Nested
    @DisplayName("GET /points/repair-facilities (Wave 2)")
    class RepairFacilitiesEndpoints {

        @Test
        @DisplayName("Should return 200 with RepairFacilityDto data when token is valid")
        void validToken_success() throws Exception {
            PointObject facility = new PointObject();
            facility.setCode("REPAIR-001");
            facility.setName("Co so sua chua");
            facility.setObjectType(PointObject.ObjectType.OTHER);
            facility.setLatitude(20.8500);
            facility.setLongitude(106.6800);
            facility.setStatus(PointObject.Status.PUBLISHED);
            when(pointRepository.findByObjectTypeAndStatus(eq(PointObject.ObjectType.OTHER), eq(PointObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(facility)));

            mockMvc.perform(get("/api/v1/integration/share/points/repair-facilities")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].code").value("REPAIR-001"))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("OTHER"));
        }
    }

    @Nested
    @DisplayName("GET /points/buoy-markers (Wave 2)")
    class BuoyMarkersEndpoints {

        @Test
        @DisplayName("Should return 200 with BuoyMarkerDto data when token is valid")
        void validToken_success() throws Exception {
            PointObject marker = new PointObject();
            marker.setCode("MARKER-001");
            marker.setName("Phao tieu");
            marker.setObjectType(PointObject.ObjectType.BUOY);
            marker.setLatitude(21.1710);
            marker.setLongitude(107.1541);
            marker.setStatus(PointObject.Status.PUBLISHED);
            when(pointRepository.findByObjectTypeAndStatus(eq(PointObject.ObjectType.BUOY), eq(PointObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(marker)));

            mockMvc.perform(get("/api/v1/integration/share/points/buoy-markers")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].code").value("MARKER-001"))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("BUOY"));
        }
    }

    @Nested
    @DisplayName("GET /points/vts-systems (Wave 2)")
    class VtsSystemsEndpoints {

        @Test
        @DisplayName("Should return 200 with VtsSystemDto data when token is valid")
        void validToken_success() throws Exception {
            PointObject vts = new PointObject();
            vts.setCode("VTS-001");
            vts.setName("He thong VTS");
            vts.setObjectType(PointObject.ObjectType.PORT);
            vts.setLatitude(20.8550);
            vts.setLongitude(106.6900);
            vts.setStatus(PointObject.Status.PUBLISHED);
            when(pointRepository.findByObjectTypeAndStatus(eq(PointObject.ObjectType.PORT), eq(PointObject.Status.PUBLISHED), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(vts)));

            mockMvc.perform(get("/api/v1/integration/share/points/vts-systems")
                            .header("X-Integration-Token", VALID_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].code").value("VTS-001"))
                    .andExpect(jsonPath("$.data.content[0].objectType").value("PORT"));
        }
    }
}