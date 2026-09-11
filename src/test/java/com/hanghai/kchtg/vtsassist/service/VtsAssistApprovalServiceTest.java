package com.hanghai.kchtg.vtsassist.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsassist.dto.ApprovalRequest;
import com.hanghai.kchtg.vtsassist.dto.VtsAssistResponse;
import com.hanghai.kchtg.vtsassist.entity.VtsAssist;
import com.hanghai.kchtg.vtsassist.repository.VtsAssistRepository;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.security.access.AccessDeniedException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VtsAssistApprovalServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID CREATOR = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID APPROVER_A = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID APPROVER_B = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @Mock
    private VtsAssistRepository vtsAssistRepository;
    @Mock
    private VtsAssistService vtsAssistService;
    @Mock
    private InfrastructureHistoryRepository historyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrgUnitCacheService orgUnitCacheService;
    @Mock
    private OrgUnitScopeService orgUnitScopeService;
    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private VtsOperationCenterRepository vtsOperationCenterRepository;
    @Mock
    private RadarStationRepository radarStationRepository;

    private VtsAssistApprovalService service;
    private VtsAssist entity;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        service = new VtsAssistApprovalService(vtsAssistRepository, approvalService, vtsAssistService,
                historyRepository, userRepository,
                orgUnitCacheService, orgUnitScopeService, jdbcTemplate,
                vtsOperationCenterRepository, radarStationRepository);

        entity = VtsAssist.builder()
                .id(ID)
                .deviceCode("PTVTS-000001")
                .deviceName("Hệ thống phụ trợ VTS Vũng Tàu")
                .orgUnitId(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();

        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vtsAssistRepository.save(any(VtsAssist.class))).thenAnswer(inv -> inv.getArgument(0));
        when(vtsAssistService.toResponse(any(VtsAssist.class))).thenReturn(VtsAssistResponse.builder().id(ID).build());
    }

    @Test
    @DisplayName("Submit: chuyển trạng thái sang PENDING_APPROVAL và lưu submittedBy, submittedDate")
    void testSubmit() {
        VtsAssistResponse res = service.submit(ID, "Trình duyệt hệ thống phụ trợ VTS", CREATOR);

        assertNotNull(res);
        verify(vtsAssistRepository).save(entity);
        assertEquals(CREATOR, entity.getSubmittedBy());
        assertNotNull(entity.getSubmittedDate());
        assertEquals("Trình duyệt hệ thống phụ trợ VTS", entity.getApprovalContentLevel1());
    }

    @Test
    @DisplayName("Approve C1: phê duyệt cấp 1 hợp lệ")
    void testApproveC1() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        ApprovalRequest req = ApprovalRequest.builder()
                .decision("APPROVED")
                .reason("Đồng ý phê duyệt cấp 1")
                .build();

        service.approveC1(ID, req, APPROVER_A);

        verify(vtsAssistRepository).save(entity);
        assertEquals("Đồng ý phê duyệt cấp 1", entity.getApprovalContentLevel1());
    }

    @Test
    @DisplayName("Approve C1: từ chối mà không có lý do sẽ quăng IllegalArgumentException")
    void testApproveC1_RejectionRequiresReason() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        ApprovalRequest req = ApprovalRequest.builder()
                .decision("REJECTED")
                .reason("   ")
                .build();

        assertThrows(IllegalArgumentException.class, () -> service.approveC1(ID, req, APPROVER_A));
    }

    @Test
    @DisplayName("Approve C2: phê duyệt cấp 2 hợp lệ")
    void testApproveC2() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        ApprovalRequest req = ApprovalRequest.builder()
                .decision("APPROVED")
                .reason("Đồng ý phê duyệt cấp 2")
                .build();

        service.approveC2(ID, req, APPROVER_B);

        verify(vtsAssistRepository).save(entity);
        assertEquals("Đồng ý phê duyệt cấp 2", entity.getApprovalContentLevel2());
    }

    @Test
    @DisplayName("Lịch sử: Người cập nhật lấy đúng tên cán bộ và Đơn vị lấy đúng đơn vị")
    void testGetHistory_UserAndOrgUnitResolution() {
        UUID userId = UUID.randomUUID();
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setFullName("Nguyễn Văn A");
        OrgUnit mockOrg = new OrgUnit();
        mockOrg.setName("Cảng vụ Hàng hải Vũng Tàu");
        mockUser.setOrgUnit(mockOrg);

        when(userRepository.findAllByIdInWithOrgUnit(Set.of(userId))).thenReturn(List.of(mockUser));

        InfrastructureHistory hist = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.VTS_ASSIST)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(InfrastructureHistoryStatus.UPDATED)
                .approvedBy(userId)
                .approvedDate(LocalDateTime.now())
                .changedField("operationalStatus")
                .previousValue("0")
                .newValue("1")
                .reason("Phê duyệt cấp 1")
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VTS_ASSIST, ID))
                .thenReturn(List.of(hist));

        List<HistoryEntry> result = service.getHistory(ID);

        assertThat(result).hasSize(1);
        HistoryEntry entry = result.get(0);
        assertEquals("Nguyễn Văn A", entry.getApprovedBy());
        assertEquals("Cảng vụ Hàng hải Vũng Tàu", entry.getOrgUnitName());
        assertEquals("Chưa khai thác/vận hành", entry.getPreviousValue());
        assertEquals("Đang khai thác/vận hành", entry.getNewValue());
    }

    @Test
    @DisplayName("Lịch sử: Fallback người cập nhật sang 'Hệ thống' và đơn vị sang 'Cục Hàng hải Việt Nam'")
    void testGetHistory_FallbackUserAndOrgUnit() {
        UUID userId = UUID.randomUUID();
        InfrastructureHistory hist = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.VTS_ASSIST)
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.UPDATED)
                .approvedBy(userId)
                .approvedDate(LocalDateTime.now())
                .changedField("deviceName")
                .previousValue("Cũ")
                .newValue("Mới")
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VTS_ASSIST, ID))
                .thenReturn(List.of(hist));
        when(userRepository.findAllByIdInWithOrgUnit(Set.of(userId))).thenReturn(List.of());

        List<HistoryEntry> result = service.getHistory(ID);

        assertThat(result).hasSize(1);
        assertEquals("Hệ thống", result.get(0).getApprovedBy());
        assertEquals("Cục Hàng hải Việt Nam", result.get(0).getOrgUnitName());
    }

    @Test
    @DisplayName("Lịch sử: Hỗ trợ tìm kiếm từ khóa và khoảng ngày dạng chuỗi YYYY-MM-DD")
    void testGetHistory_SearchKeywordAndDateRange() {
        InfrastructureHistory hist = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.VTS_ASSIST)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(InfrastructureHistoryStatus.UPDATED)
                .approvedDate(LocalDateTime.now())
                .changedField("note")
                .previousValue("Ghi chú cũ")
                .newValue("Ghi chú mới")
                .build();

        when(historyRepository.searchHistory(eq(InfrastructureType.VTS_ASSIST), eq(ID), eq("ghi chu"),
                eq(LocalDate.parse("2026-01-01").atStartOfDay()), any(LocalDateTime.class), any()))
                .thenReturn(List.of(hist));

        List<HistoryEntry> result = service.getHistory(ID, 0, 10, "Ghi chú", "2026-01-01", "2026-12-31");

        assertThat(result).hasSize(1);
        assertEquals("Ghi chú cũ", result.get(0).getPreviousValue());
        assertEquals("Ghi chú mới", result.get(0).getNewValue());
    }

    @Test
    @DisplayName("formatDisplayValue: Map các ID và mã trạng thái sang tiếng Việt")
    void testFormatDisplayValue() {
        assertEquals("Chưa có", service.formatDisplayValue("deviceName", null));
        assertEquals("Chưa có", service.formatDisplayValue("deviceName", ""));
        assertEquals("Chưa có", service.formatDisplayValue("deviceName", "null"));

        assertEquals("TTDH VTS", service.formatDisplayValue("attachedInfrastructureType", "1"));
        assertEquals("Trạm Radar", service.formatDisplayValue("attachedInfrastructureType", "2"));

        assertEquals("Chưa khai thác/vận hành", service.formatDisplayValue("operationalStatus", "0"));
        assertEquals("Đang khai thác/vận hành", service.formatDisplayValue("operationalStatus", "1"));
        assertEquals("Dừng khai thác/vận hành", service.formatDisplayValue("operationalStatus", "2"));

        assertEquals("Bộ", service.formatDisplayValue("unitOfMeasure", "1"));
        assertEquals("Hệ thống", service.formatDisplayValue("unitOfMeasure", "11"));

        assertEquals("WGS 84", service.formatDisplayValue("coordinateSystem", "1"));
        assertEquals("VN-2000", service.formatDisplayValue("coordinateSystem", "2"));

        assertEquals("Đối tượng điểm", service.formatDisplayValue("objectType", "POINT"));
        assertEquals("Đối tượng đường", service.formatDisplayValue("objectType", "LINE"));
        assertEquals("Đối tượng vùng", service.formatDisplayValue("objectType", "POLYGON"));

        assertEquals("Lưu tạm", service.formatDisplayValue("approvalStatus", "DRAFT"));
        assertEquals("Chờ Cảng vụ duyệt", service.formatDisplayValue("approvalStatus", "PENDING_APPROVAL"));
        assertEquals("Chờ Cục duyệt", service.formatDisplayValue("approvalStatus", "APPROVED_LEVEL1"));
        assertEquals("Đã duyệt", service.formatDisplayValue("approvalStatus", "APPROVED"));
    }

    @Test
    @DisplayName("Kiểm tra OrgUnit Scope: Quăng ngoại lệ nếu đơn vị không nằm trong phạm vi truy cập")
    void testValidateAllowedOrgUnit_OutOfScope() {
        UUID restrictedOrgId = UUID.randomUUID();
        entity.setOrgUnitId(restrictedOrgId);

        when(orgUnitScopeService.currentUserScope())
                .thenReturn(OrgUnitScopeService.Scope.restricted(List.of(UUID.randomUUID())));

        assertThrows(AccessDeniedException.class, () -> service.submit(ID, "Trình duyệt", CREATOR));
        assertThrows(AccessDeniedException.class, () -> service.getHistory(ID));
    }
}