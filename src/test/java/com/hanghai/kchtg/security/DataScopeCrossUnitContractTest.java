package com.hanghai.kchtg.security;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemCreateRequest;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemResponse;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemUpdateRequest;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsZoneRepository;
import com.hanghai.kchtg.vtssystem.service.VtsSystemService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Multi-tenant Data Scope Contract / Unit Test:
 * Verifies service-level scope contract enforcement and write guards across two
 * distinct organizational units (Unit A and Unit B).
 *
 * Test Matrix:
 * 1. User A (belongs to Unit A) searching records -> Only Unit A records
 * queried in repository; Unit B excluded.
 * 2. User A reading detail (getById) -> Unit A record succeeds; Unit B record
 * throws IllegalArgumentException.
 * 3. User A updating record -> Unit A record succeeds; Unit B record throws
 * IllegalArgumentException.
 * 4. User A deleting record -> Unit A record succeeds; Unit B record throws
 * IllegalArgumentException.
 * 5. User A creating record -> Unit A record succeeds; Unit B target throws
 * IllegalArgumentException.
 */
@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class DataScopeCrossUnitContractTest {

        private static final UUID ORG_UNIT_A_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        private static final UUID ORG_UNIT_B_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        private static final UUID VTS_A_ID = UUID.fromString("11111111-aaaa-aaaa-aaaa-111111111111");
        private static final UUID VTS_B_ID = UUID.fromString("22222222-bbbb-bbbb-bbbb-222222222222");

        @Mock
        private VtsSystemRepository vtsRepository;
        @Mock
        private InfrastructureHistoryRepository historyRepository;
        @Mock
        private InfrastructureAttachmentRepository attachmentRepository;
        @Mock
        private OrgUnitCacheService orgUnitCacheService;
        @Mock
        private PortCacheService portCacheService;
        @Mock
        private UserRepository userRepository;
        @Mock
        private VtsZoneRepository zoneRepository;
        @Mock
        private GisSpatialObjectService gisSpatialObjectService;
        @Mock
        private PortRepository portRepository;
        @Mock
        private JdbcTemplate jdbcTemplate;
        @Mock
        private InfrastructureApprovalService approvalService;

        private VtsSystemService vtsSystemService;

        private User userA;
        private OrgUnit orgUnitA;
        private OrgUnit orgUnitB;

        private VtsSystem vtsSystemA;
        private VtsSystem vtsSystemB;

        @BeforeEach
        void setUp() {
                vtsSystemService = new VtsSystemService(
                                vtsRepository, historyRepository, approvalService, gisSpatialObjectService,
                                orgUnitCacheService, portCacheService, portRepository,
                                attachmentRepository, zoneRepository, userRepository,
                                jdbcTemplate);

                // Org Units
                orgUnitA = new OrgUnit();
                orgUnitA.setId(ORG_UNIT_A_ID);
                orgUnitA.setName("Cảng vụ Hàng hải Khu vực A");

                orgUnitB = new OrgUnit();
                orgUnitB.setId(ORG_UNIT_B_ID);
                orgUnitB.setName("Cảng vụ Hàng hải Khu vực B");

                // User A belongs to Unit A
                userA = new User();
                userA.setId(UUID.randomUUID());
                userA.setUsername("user_a");
                userA.setOrgUnit(orgUnitA);

                // VTS records
                vtsSystemA = VtsSystem.builder()
                                .systemName("Hệ thống VTS Đơn vị A")
                                .code("VTS-A")
                                .orgUnitId(ORG_UNIT_A_ID)
                                .owningOrgId(ORG_UNIT_A_ID)
                                .operatingOrgId(ORG_UNIT_A_ID)
                                .provinceId(1)
                                .conditionStatus(ConditionStatus.OPERATIONAL)
                                .approvalStatus(ApprovalStatus.PROPOSED)
                                .build();
                vtsSystemA.setId(VTS_A_ID);

                vtsSystemB = VtsSystem.builder()
                                .systemName("Hệ thống VTS Đơn vị B")
                                .code("VTS-B")
                                .orgUnitId(ORG_UNIT_B_ID)
                                .owningOrgId(ORG_UNIT_B_ID)
                                .operatingOrgId(ORG_UNIT_B_ID)
                                .provinceId(2)
                                .conditionStatus(ConditionStatus.OPERATIONAL)
                                .approvalStatus(ApprovalStatus.PROPOSED)
                                .build();
                vtsSystemB.setId(VTS_B_ID);

                // Mock User A authentication with standard business permissions (not
                // nationwide)
                SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken("user_a", "pwd",
                                                List.of(new SimpleGrantedAuthority("vtssystem:read"),
                                                                new SimpleGrantedAuthority("vtssystem:create"),
                                                                new SimpleGrantedAuthority("vtssystem:update"),
                                                                new SimpleGrantedAuthority("vtssystem:delete"))));

                when(userRepository.findByUsernameWithRelations("user_a")).thenReturn(Optional.of(userA));

                // Subtree directory: Unit A contains only Unit A (no descendant of B)
                OrgUnitResponse respA = new OrgUnitResponse();
                respA.setId(ORG_UNIT_A_ID);
                OrgUnitResponse respB = new OrgUnitResponse();
                respB.setId(ORG_UNIT_B_ID);
                when(orgUnitCacheService.getList()).thenReturn(List.of(respA, respB));
        }

        @AfterEach
        void tearDown() {
                SecurityContextHolder.clearContext();
        }

        @Test
        @DisplayName("1. List/Search: User A query strictly limits database results to Unit A scope")
        void search_shouldLimitQueryToUnitAScope() {
                // Given: database query with scopeEnabled = true and scopeOrgUnitIds =
                // [ORG_UNIT_A_ID]
                when(vtsRepository.search(
                                eq(true),
                                eq(List.of(ORG_UNIT_A_ID)),
                                isNull(),
                                isNull(),
                                isNull(),
                                isNull(),
                                any(Pageable.class))).thenReturn(new PageImpl<>(List.of(vtsSystemA)));

                // When
                List<VtsSystemResponse> results = vtsSystemService.search(null, null, null, null);

                // Then: exactly Unit A records are returned
                assertNotNull(results);
                assertEquals(1, results.size());
                assertEquals(VTS_A_ID, results.get(0).getId());
                assertEquals("Hệ thống VTS Đơn vị A", results.get(0).getSystemName());

                // Verify repository was queried with scope filter active
                verify(vtsRepository).search(
                                eq(true),
                                eq(List.of(ORG_UNIT_A_ID)),
                                isNull(),
                                isNull(),
                                isNull(),
                                isNull(),
                                any(Pageable.class));
        }

        @Test
        @DisplayName("2. Detail: User A can read Unit A detail, but rejected when reading Unit B detail")
        void getById_shouldAllowOwnUnit_andRejectCrossUnit() {
                when(vtsRepository.findById(VTS_A_ID)).thenReturn(Optional.of(vtsSystemA));
                when(vtsRepository.findById(VTS_B_ID)).thenReturn(Optional.of(vtsSystemB));

                // User A reads Unit A detail -> SUCCESS
                VtsSystemResponse responseA = vtsSystemService.getById(VTS_A_ID);
                assertNotNull(responseA);
                assertEquals(VTS_A_ID, responseA.getId());

                // User A reads Unit B detail -> REJECTED
                IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                                () -> vtsSystemService.getById(VTS_B_ID));
                assertTrue(ex.getMessage().contains("không thuộc phạm vi đơn vị được phép sử dụng"));
        }

        @Test
        @DisplayName("3. Update: User A can update Unit A record, but rejected when updating Unit B record")
        void update_shouldAllowOwnUnit_andRejectCrossUnit() {
                when(vtsRepository.findById(VTS_A_ID)).thenReturn(Optional.of(vtsSystemA));
                when(vtsRepository.findById(VTS_B_ID)).thenReturn(Optional.of(vtsSystemB));
                when(vtsRepository.save(any(VtsSystem.class))).thenAnswer(inv -> inv.getArgument(0));

                VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                                .systemName("Updated System Name")
                                .build();

                // User A updates Unit A -> SUCCESS
                VtsSystemResponse updatedA = vtsSystemService.update(VTS_A_ID, updateReq, userA.getId());
                assertNotNull(updatedA);

                // User A attempts to update Unit B -> REJECTED
                IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                                () -> vtsSystemService.update(VTS_B_ID, updateReq, userA.getId()));
                assertTrue(ex.getMessage().contains("không thuộc phạm vi đơn vị được phép sử dụng"));
        }

        @Test
        @DisplayName("4. Delete: User A can delete Unit A record (when draft), but rejected when deleting Unit B record")
        void delete_shouldAllowOwnUnit_andRejectCrossUnit() {
                vtsSystemA.setApprovalStatus(ApprovalStatus.DRAFT);
                vtsSystemB.setApprovalStatus(ApprovalStatus.DRAFT);

                when(vtsRepository.findById(VTS_A_ID)).thenReturn(Optional.of(vtsSystemA));
                when(vtsRepository.findById(VTS_B_ID)).thenReturn(Optional.of(vtsSystemB));
                when(vtsRepository.save(any(VtsSystem.class))).thenAnswer(inv -> inv.getArgument(0));
                when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

                // User A deletes Unit A -> SUCCESS
                assertDoesNotThrow(() -> vtsSystemService.delete(VTS_A_ID, userA.getId()));
                assertNotNull(vtsSystemA.getDeletedAt());

                // User A attempts to delete Unit B -> REJECTED
                IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                                () -> vtsSystemService.delete(VTS_B_ID, userA.getId()));
                assertTrue(ex.getMessage().contains("không thuộc phạm vi đơn vị được phép sử dụng"));
        }

        @Test
        @DisplayName("5. Create: User A can create record for Unit A, but rejected when targeting Unit B")
        void create_shouldAllowOwnUnit_andRejectCrossUnit() {
                when(vtsRepository.save(any(VtsSystem.class))).thenAnswer(inv -> {
                        VtsSystem s = inv.getArgument(0);
                        s.setId(UUID.randomUUID());
                        return s;
                });
                when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

                // Create for Unit A -> SUCCESS
                VtsSystemCreateRequest createReqA = VtsSystemCreateRequest.builder()
                                .systemName("New VTS Unit A")
                                .code("VTS-NEW-A")
                                .orgUnitId(ORG_UNIT_A_ID)
                                .owningOrgId(ORG_UNIT_A_ID)
                                .operatingOrgId(ORG_UNIT_A_ID)
                                .provinceId(1)
                                .conditionStatus(ConditionStatus.OPERATIONAL)
                                .build();

                VtsSystemResponse createdA = vtsSystemService.create(createReqA, userA.getId());
                assertNotNull(createdA);

                // Create for Unit B -> REJECTED
                VtsSystemCreateRequest createReqB = VtsSystemCreateRequest.builder()
                                .systemName("New VTS Unit B")
                                .code("VTS-NEW-B")
                                .orgUnitId(ORG_UNIT_B_ID)
                                .owningOrgId(ORG_UNIT_B_ID)
                                .operatingOrgId(ORG_UNIT_B_ID)
                                .provinceId(2)
                                .conditionStatus(ConditionStatus.OPERATIONAL)
                                .build();

                IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                                () -> vtsSystemService.create(createReqB, userA.getId()));
                assertTrue(ex.getMessage().contains("không thuộc phạm vi đơn vị được phép sử dụng"));
        }
}
