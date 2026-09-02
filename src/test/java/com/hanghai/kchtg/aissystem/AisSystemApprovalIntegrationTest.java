package com.hanghai.kchtg.aissystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.aissystem.dto.AisSystemRequest;
import com.hanghai.kchtg.aissystem.entity.AisSystem;
import com.hanghai.kchtg.aissystem.repository.AisSystemRepository;
import com.hanghai.kchtg.common.dto.ApprovalRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.UnitOfMeasure;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
public class AisSystemApprovalIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AisSystemRepository aisSystemRepository;

    @Autowired
    private VtsOperationCenterRepository vtsOperationCenterRepository;

    @Autowired
    private VtsSystemRepository vtsSystemRepository;

    @Autowired
    private OrgUnitRepository orgUnitRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InfrastructureHistoryRepository historyRepository;

    private UUID orgUnitId;
    private UUID opCenterId;
    private User creatorUser;
    private User approver1User;
    private User approver2User;

    @BeforeEach
    void setUp() {
        OrgUnit cangVu = orgUnitRepository.findAll().stream()
                .filter(o -> o.getName() != null && o.getName().contains("Cảng vụ"))
                .findFirst()
                .orElseGet(() -> orgUnitRepository.save(OrgUnit.builder().name("Cảng vụ Hàng hải Quảng Ninh").build()));
        orgUnitId = cangVu.getId();

        OrgUnit cuc = orgUnitRepository.findAll().stream()
                .filter(o -> o.getName() != null && o.getName().contains("Cục"))
                .findFirst()
                .orElseGet(() -> orgUnitRepository.save(OrgUnit.builder().name("Cục Hàng hải Việt Nam").build()));

        // 1. Creator user (Cảng vụ)
        creatorUser = userRepository.findByUsername("creator_ais").orElseGet(() -> {
            User u = new User();
            u.setUsername("creator_ais");
            u.setEmail("creator_ais@test.gov.vn");
            u.setPassword("password123");
            u.setFullName("Cán bộ Tạo Hồ sơ");
            u.setStatus(UserStatus.ACTIVE);
            return u;
        });
        creatorUser.setOrgUnit(cangVu);
        creatorUser = userRepository.save(creatorUser);

        // 2. Approver 1 user (Lãnh đạo Cảng vụ)
        approver1User = userRepository.findByUsername("approver1_ais").orElseGet(() -> {
            User u = new User();
            u.setUsername("approver1_ais");
            u.setEmail("approver1_ais@test.gov.vn");
            u.setPassword("password123");
            u.setFullName("Lãnh đạo Cảng vụ Quảng Ninh");
            u.setStatus(UserStatus.ACTIVE);
            return u;
        });
        approver1User.setOrgUnit(cangVu);
        approver1User = userRepository.save(approver1User);

        // 3. Approver 2 user (Lãnh đạo Cục)
        approver2User = userRepository.findByUsername("approver2_ais").orElseGet(() -> {
            User u = new User();
            u.setUsername("approver2_ais");
            u.setEmail("approver2_ais@test.gov.vn");
            u.setPassword("password123");
            u.setFullName("Lãnh đạo Cục Hàng hải");
            u.setStatus(UserStatus.ACTIVE);
            return u;
        });
        approver2User.setOrgUnit(cuc);
        approver2User = userRepository.save(approver2User);

        VtsSystem vtsSystem = vtsSystemRepository.findAll().stream().findFirst().orElseGet(() -> {
            VtsSystem vs = VtsSystem.builder()
                    .code("VTS-TEST-01")
                    .systemName("Hệ thống VTS Test")
                    .orgUnitId(orgUnitId)
                    .conditionStatus(ConditionStatus.OPERATIONAL)
                    .approvalStatus(ApprovalStatus.APPROVED)
                    .build();
            return vtsSystemRepository.save(vs);
        });

        VtsOperationCenter opCenter = vtsOperationCenterRepository.findAll().stream().findFirst().orElseGet(() -> {
            VtsOperationCenter oc = VtsOperationCenter.builder()
                    .code("TTDH-TEST-01")
                    .name("Trung tâm VTS Test")
                    .vtsSystemId(vtsSystem.getId())
                    .orgUnitId(orgUnitId)
                    .conditionStatus(ConditionStatus.OPERATIONAL)
                    .approvalStatus(ApprovalStatus.APPROVED)
                    .build();
            return vtsOperationCenterRepository.save(oc);
        });
        opCenterId = opCenter.getId();
    }

    private void authenticateAs(User user, String... permissions) {
        List<SimpleGrantedAuthority> authorities = java.util.Arrays.stream(permissions)
                .map(SimpleGrantedAuthority::new)
                .toList();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Quy trình duyệt 2 cấp chuẩn qua REST API: Tạo mới -> Gửi duyệt -> Duyệt C1 -> Duyệt C2 -> Kiểm tra DB")
    void testFullApprovalLifecycleViaApi() throws Exception {
        // =========================================================================
        // BƯỚC 1: Gọi API Tạo mới bởi creatorUser (POST /api/v1/ais-system)
        // =========================================================================
        authenticateAs(creatorUser, "aissystem:create", "orgunit:scope_all", "admin:all");

        String code = "AIS-API-FLOW-" + System.currentTimeMillis();
        AisSystemRequest createRequest = AisSystemRequest.builder()
                .code(code)
                .name("Trạm AIS Luồng Kiểm Thử API")
                .vtsOperationCenterId(opCenterId)
                .operatingOrgId(orgUnitId)
                .orgUnitId(orgUnitId)
                .unitOfMeasure(UnitOfMeasure.SET)
                .quantity(1)
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .model("Model T500")
                .specifications("Công suất 12.5W")
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/ais-system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value(code))
                .andExpect(jsonPath("$.data.approvalStatus").value("DRAFT"))
                .andReturn();

        String responseBody = createResult.getResponse().getContentAsString();
        UUID aisId = UUID.fromString(objectMapper.readTree(responseBody).path("data").path("id").asText());

        // Kiểm tra trong DB sau Bước 1: Các trường người duyệt phải là null
        AisSystem inDbStep1 = aisSystemRepository.findById(aisId).orElseThrow();
        assertEquals(ApprovalStatus.DRAFT, inDbStep1.getApprovalStatus());
        assertNull(inDbStep1.getApproverLevel1(), "Bước 1 (Lưu tạm): approverLevel1 phải là null");
        assertNull(inDbStep1.getApprovedDateLevel1(), "Bước 1 (Lưu tạm): approvedDateLevel1 phải là null");
        assertNull(inDbStep1.getApproverLevel2(), "Bước 1 (Lưu tạm): approverLevel2 phải là null");
        assertNull(inDbStep1.getApprovedDateLevel2(), "Bước 1 (Lưu tạm): approvedDateLevel2 phải là null");

        // =========================================================================
        // BƯỚC 2: Gọi API Gửi duyệt bởi creatorUser (POST /api/v1/ais-system/{id}/submit)
        // =========================================================================
        mockMvc.perform(post("/api/v1/ais-system/{id}/submit", aisId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Kiểm tra trong DB sau Bước 2: Chuyển sang PENDING_APPROVAL (Chờ Cảng vụ duyệt)
        AisSystem inDbStep2 = aisSystemRepository.findById(aisId).orElseThrow();
        assertEquals(ApprovalStatus.PENDING_APPROVAL, inDbStep2.getApprovalStatus());
        assertNull(inDbStep2.getApproverLevel1());
        assertNull(inDbStep2.getApproverLevel2());

        // =========================================================================
        // BƯỚC 3: Gọi API Phê duyệt Cấp 1 bởi approver1User (POST /api/v1/ais-system/{id}/approve-c1)
        // =========================================================================
        authenticateAs(approver1User, "aissystem:approvec1", "orgunit:scope_all", "admin:all");

        ApprovalRequest approveC1Req = new ApprovalRequest();
        approveC1Req.setDecision("APPROVED");
        approveC1Req.setReason("Hồ sơ hợp lệ, Lãnh đạo Cảng vụ đồng ý duyệt C1");

        mockMvc.perform(post("/api/v1/ais-system/{id}/approve-c1", aisId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveC1Req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Kiểm tra trong DB sau Bước 3: approverLevel1 và approvedDateLevel1 ĐÃ CÓ GIÁ TRỊ!
        AisSystem inDbStep3 = aisSystemRepository.findById(aisId).orElseThrow();
        assertEquals(ApprovalStatus.APPROVED_LEVEL1, inDbStep3.getApprovalStatus());
        assertEquals(approver1User.getId(), inDbStep3.getApproverLevel1(), "Bước 3 (Duyệt C1): approverLevel1 PHẢI là UUID của approver1User");
        assertNotNull(inDbStep3.getApprovedDateLevel1(), "Bước 3 (Duyệt C1): approvedDateLevel1 PHẢI có thời gian duyệt");
        assertNull(inDbStep3.getApproverLevel2(), "Bước 3 (Duyệt C1): approverLevel2 vẫn phải là null");
        assertNull(inDbStep3.getApprovedDateLevel2(), "Bước 3 (Duyệt C1): approvedDateLevel2 vẫn phải là null");

        // =========================================================================
        // BƯỚC 4: Gọi API Phê duyệt Cấp 2 bởi approver2User (POST /api/v1/ais-system/{id}/approve-c2)
        // =========================================================================
        authenticateAs(approver2User, "aissystem:approvec2", "orgunit:scope_all", "admin:all");

        ApprovalRequest approveC2Req = new ApprovalRequest();
        approveC2Req.setDecision("APPROVED");
        approveC2Req.setReason("Lãnh đạo Cục phê duyệt ban hành chính thức");

        mockMvc.perform(post("/api/v1/ais-system/{id}/approve-c2", aisId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveC2Req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Kiểm tra trong DB sau Bước 4: CẢ approverLevel1 VÀ approverLevel2 ĐỀU ĐẦY ĐỦ!
        AisSystem inDbStep4 = aisSystemRepository.findById(aisId).orElseThrow();
        assertEquals(ApprovalStatus.APPROVED, inDbStep4.getApprovalStatus());
        assertEquals(approver1User.getId(), inDbStep4.getApproverLevel1(), "Bước 4 (Duyệt C2): approverLevel1 phải giữ nguyên");
        assertNotNull(inDbStep4.getApprovedDateLevel1(), "Bước 4 (Duyệt C2): approvedDateLevel1 phải giữ nguyên");
        assertEquals(approver2User.getId(), inDbStep4.getApproverLevel2(), "Bước 4 (Duyệt C2): approverLevel2 PHẢI là UUID của approver2User");
        assertNotNull(inDbStep4.getApprovedDateLevel2(), "Bước 4 (Duyệt C2): approvedDateLevel2 PHẢI có thời gian duyệt Cục");

        // =========================================================================
        // BƯỚC 5: Gọi API Xem chi tiết & Lịch sử (GET /api/v1/ais-system/{id}/history)
        // =========================================================================
        mockMvc.perform(get("/api/v1/ais-system/{id}", aisId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.approverLevel1").isNotEmpty())
                .andExpect(jsonPath("$.data.approvedDateLevel1").isNotEmpty())
                .andExpect(jsonPath("$.data.approverLevel2").isNotEmpty())
                .andExpect(jsonPath("$.data.approvedDateLevel2").isNotEmpty());

        mockMvc.perform(get("/api/v1/ais-system/{id}/history", aisId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("Quy trình Từ chối qua REST API: Tạo mới -> Gửi duyệt -> Từ chối kèm lý do -> Kiểm tra DB")
    void testRejectionLifecycleViaApi() throws Exception {
        // 1. Tạo mới bởi creatorUser
        authenticateAs(creatorUser, "aissystem:create", "orgunit:scope_all", "admin:all");

        String code = "AIS-API-REJ-" + System.currentTimeMillis();
        AisSystemRequest createRequest = AisSystemRequest.builder()
                .code(code)
                .name("Trạm AIS Bị Từ Chối Test")
                .vtsOperationCenterId(opCenterId)
                .operatingOrgId(orgUnitId)
                .orgUnitId(orgUnitId)
                .unitOfMeasure(UnitOfMeasure.SET)
                .quantity(1)
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/ais-system")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        UUID aisId = UUID.fromString(objectMapper.readTree(createResult.getResponse().getContentAsString()).path("data").path("id").asText());

        // 2. Gửi duyệt bởi creatorUser
        mockMvc.perform(post("/api/v1/ais-system/{id}/submit", aisId)).andExpect(status().isOk());

        // 3. Từ chối phê duyệt bởi approver1User (Lãnh đạo Cảng vụ)
        authenticateAs(approver1User, "aissystem:approvec1", "orgunit:scope_all", "admin:all");

        String reason = "Công suất phát không đạt tiêu chuẩn kỹ thuật hàng hải";
        ApprovalRequest rejectReq = new ApprovalRequest();
        rejectReq.setReason(reason);

        mockMvc.perform(post("/api/v1/ais-system/{id}/reject", aisId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk());

        // Kiểm tra trong DB: rejectionReason đã được lưu
        AisSystem inDb = aisSystemRepository.findById(aisId).orElseThrow();
        assertEquals(ApprovalStatus.REJECTED_LEVEL1, inDb.getApprovalStatus());
        assertEquals(reason, inDb.getRejectionReason());
    }
}
