package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.orgunit.dto.CandidateParentResponse;
import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
import com.hanghai.kchtg.orgunit.entity.UnitHistory;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.repository.UnitHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link OrganizationService}.
 * Covers: unique code constraint (BR-013), delete guard (BR-014),
 * circular reference detection (BR-016).
 */
@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock
    private OrgUnitRepository orgUnitRepo;

    @Mock
    private UnitHistoryRepository unitHistoryRepo;

    @Mock
    private MaterializedPathService materializedPathService;

    @Mock
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @InjectMocks
    private OrganizationService service;

    private UUID rootId;
    private UUID parentId;
    private UUID childId;

    @BeforeEach
    void setUp() {
        rootId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        parentId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        childId = UUID.fromString("00000000-0000-0000-0000-000000000003");

        lenient().doAnswer(invocation -> {
            java.util.function.Consumer<org.springframework.transaction.TransactionStatus> callback = invocation.getArgument(0);
            callback.accept(mock(org.springframework.transaction.TransactionStatus.class));
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
    }

    // ── BR-014: Delete guard ─────────────────────────────────────────

    @Nested
    @DisplayName("BR-014: Delete guard — no children allowed")
    class DeleteGuardTests {

        @Test
        @DisplayName("shouldRejectDeleteWhenUnitHasChildren")
        void shouldRejectDeleteWhenHasChildren() {
            when(orgUnitRepo.findById(childId)).thenReturn(Optional.of(
                    makeUnit(childId, "Cảng vụ")));
            when(orgUnitRepo.countByParentIdAndDeletedAtIsNull(childId)).thenReturn(2L);

            assertThrows(IllegalArgumentException.class,
                    () -> service.delete(childId, UUID.randomUUID(), "admin"));
        }

        @Test
        @DisplayName("shouldAllowDeleteWhenUnitHasNoChildren")
        void shouldAllowDeleteWhenNoChildren() {
            when(orgUnitRepo.findById(childId)).thenReturn(Optional.of(
                    makeUnit(childId, "Cảng vụ")));
            when(orgUnitRepo.countByParentIdAndDeletedAtIsNull(childId)).thenReturn(0L);

            assertDoesNotThrow(() -> service.delete(childId, UUID.randomUUID(), "admin"));
        }

        @Test
        @DisplayName("shouldRejectDeleteWhenUnitDoesNotExist")
        void shouldRejectDeleteWhenNotFound() {
            when(orgUnitRepo.findById(childId)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.delete(childId, UUID.randomUUID(), "admin"));
        }
    }

    // ── BR-016: Hierarchy / tree ─────────────────────────────────────

    @Nested
    @DisplayName("BR-016: Parent-child hierarchy with circular ref detection")
    class HierarchyTests {

        @Test
        @DisplayName("shouldRejectSelfAsParent")
        void shouldRejectSelfAsParent() {
            OrgUnit unit = makeUnit(childId, "Cảng vụ");
            when(orgUnitRepo.findById(childId)).thenReturn(Optional.of(unit));

            UpdateOrgUnitRequest request = new UpdateOrgUnitRequest();
            request.setParentId(childId);

            assertThrows(IllegalArgumentException.class,
                    () -> service.update(childId, request, UUID.randomUUID(), "admin"));
        }

        @Test
        @DisplayName("shouldRejectCircularReferenceWhenChildBecomesParentOfAncestor")
        void shouldRejectCircularReference() {
            OrgUnit unit = makeUnit(childId, "Cảng vụ");
            unit.setPath("/" + rootId + "/" + parentId + "/" + childId + "/");
            when(orgUnitRepo.findById(childId)).thenReturn(Optional.of(unit));
            when(orgUnitRepo.findById(rootId)).thenReturn(Optional.of(
                    makeUnit(rootId, "Cục")));

            when(materializedPathService.isAncestor(childId, rootId)).thenReturn(true);

            UpdateOrgUnitRequest request = new UpdateOrgUnitRequest();
            request.setParentId(rootId);

            assertThrows(IllegalArgumentException.class,
                    () -> service.update(childId, request, UUID.randomUUID(), "admin"));
        }

        @Test
        @DisplayName("shouldRejectCreatingUnitWhenParentAtLevel3")
        void shouldRejectCreatingUnitWhenParentAtLevel3() {
            OrgUnit level3Parent = makeUnit(parentId, "Đại diện");
            level3Parent.setLevel(3);
            when(orgUnitRepo.findById(parentId)).thenReturn(Optional.of(level3Parent));

            CreateOrgUnitRequest request = new CreateOrgUnitRequest();
            request.setName("Đơn vị cấp 4");
            request.setParentId(parentId);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.create(request, UUID.randomUUID(), "admin"));
            assertEquals("Cây đơn vị chỉ được phép tối đa 3 cấp", ex.getMessage());
        }

        @Test
        @DisplayName("shouldRejectCreatingUnitWhenComputedLevelExceeds3")
        void shouldRejectCreatingUnitWhenComputedLevelExceeds3() {
            OrgUnit level2Parent = makeUnit(parentId, "Chi cục");
            level2Parent.setLevel(2);
            when(orgUnitRepo.findById(parentId)).thenReturn(Optional.of(level2Parent));
            when(materializedPathService.computePath(eq(parentId), any())).thenReturn("/root/parent/child/grandchild/");
            when(materializedPathService.calculateLevel(anyString())).thenReturn(4);

            CreateOrgUnitRequest request = new CreateOrgUnitRequest();
            request.setName("Đơn vị cấp 4");
            request.setParentId(parentId);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.create(request, UUID.randomUUID(), "admin"));
            assertEquals("Cây đơn vị chỉ được phép tối đa 3 cấp", ex.getMessage());
        }

        @Test
        @DisplayName("shouldRejectReparentingWhenSubtreeDepthExceeds3")
        void shouldRejectReparentingWhenSubtreeDepthExceeds3() {
            OrgUnit unit = makeUnit(childId, "Chi cục");
            unit.setLevel(2);

            OrgUnit newParent = makeUnit(parentId, "Chi cục khác");
            newParent.setLevel(2);

            when(orgUnitRepo.findById(childId)).thenReturn(Optional.of(unit));
            when(orgUnitRepo.findById(parentId)).thenReturn(Optional.of(newParent));

            OrgUnit grandchild = makeUnit(UUID.randomUUID(), "Đại diện");
            grandchild.setLevel(3);
            when(materializedPathService.getSubtree(childId)).thenReturn(java.util.List.of(unit, grandchild));

            UpdateOrgUnitRequest request = new UpdateOrgUnitRequest();
            request.setParentId(parentId);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.update(childId, request, UUID.randomUUID(), "admin"));
            assertEquals("Cây đơn vị chỉ được phép tối đa 3 cấp", ex.getMessage());
        }

        @Test
        @DisplayName("shouldAllowReparentingWhenTotalDepthWithin3")
        void shouldAllowReparentingWhenTotalDepthWithin3() {
            OrgUnit unit = makeUnit(childId, "Chi cục");
            unit.setLevel(2);

            OrgUnit root = makeUnit(rootId, "Cục");
            root.setLevel(1);

            when(orgUnitRepo.findById(childId)).thenReturn(Optional.of(unit));
            when(orgUnitRepo.findById(rootId)).thenReturn(Optional.of(root));

            OrgUnit grandchild = makeUnit(UUID.randomUUID(), "Đại diện");
            grandchild.setLevel(3);
            when(materializedPathService.getSubtree(childId)).thenReturn(java.util.List.of(unit, grandchild));
            when(materializedPathService.computePath(eq(rootId), eq(childId))).thenReturn("/" + rootId + "/" + childId + "/");
            when(materializedPathService.calculateLevel("/" + rootId + "/" + childId + "/")).thenReturn(2);
            when(orgUnitRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateOrgUnitRequest request = new UpdateOrgUnitRequest();
            request.setParentId(rootId);

            assertDoesNotThrow(() -> service.update(childId, request, UUID.randomUUID(), "admin"));
        }
    }

    // ── Candidate parents for create and reparenting ──────────────────

    @Nested
    @DisplayName("Candidate parents lookup")
    class CandidateParentsTests {

        @Test
        @DisplayName("shouldExcludeLevel3CandidatesForCreate")
        void shouldExcludeLevel3CandidatesForCreate() {
            OrgUnit r = makeUnit(rootId, "Cục");
            r.setLevel(1);
            OrgUnit p = makeUnit(parentId, "Chi cục");
            p.setLevel(2);
            OrgUnit c = makeUnit(childId, "Đại diện");
            c.setLevel(3);

            when(orgUnitRepo.findAllActiveOrderByPath()).thenReturn(java.util.List.of(r, p, c));

            List<CandidateParentResponse> candidates = service.findCandidateParents(null);
            assertEquals(2, candidates.size());

            CandidateParentResponse candRoot = candidates.stream().filter(x -> x.getId().equals(rootId)).findFirst().orElseThrow();
            assertFalse(candRoot.isDisabled());

            CandidateParentResponse candParent = candidates.stream().filter(x -> x.getId().equals(parentId)).findFirst().orElseThrow();
            assertFalse(candParent.isDisabled());

            assertTrue(candidates.stream().noneMatch(x -> x.getId().equals(childId)));
        }

        @Test
        @DisplayName("shouldExcludeSelfAndDescendantsForEdit")
        void shouldExcludeSelfAndDescendantsForEdit() {
            OrgUnit r = makeUnit(rootId, "Cục");
            r.setLevel(1);

            OrgUnit p = makeUnit(parentId, "Chi cục");
            p.setLevel(2);
            p.setParentId(rootId);

            OrgUnit c = makeUnit(childId, "Đại diện");
            c.setLevel(3);
            c.setParentId(parentId);

            when(orgUnitRepo.findById(parentId)).thenReturn(Optional.of(p));
            when(materializedPathService.getSubtree(parentId)).thenReturn(java.util.List.of(p, c));
            when(orgUnitRepo.findAllActiveOrderByPath()).thenReturn(java.util.List.of(r, p, c));

            List<CandidateParentResponse> candidates = service.findCandidateParents(parentId);

            // Self (p) and child (c) must be excluded
            assertEquals(1, candidates.size());
            CandidateParentResponse cand = candidates.get(0);
            assertEquals(rootId, cand.getId());
            assertTrue(cand.isCurrentParent());
            assertFalse(cand.isDisabled());
        }

        @Test
        @DisplayName("shouldExcludeCandidatesWhenTotalSubtreeDepthExceeds3")
        void shouldExcludeCandidatesWhenTotalSubtreeDepthExceeds3() {
            OrgUnit r = makeUnit(rootId, "Cục");
            r.setLevel(1);

            UUID otherParentId = UUID.randomUUID();
            OrgUnit otherParent = makeUnit(otherParentId, "Chi cục 2");
            otherParent.setLevel(2);

            OrgUnit target = makeUnit(parentId, "Chi cục 1");
            target.setLevel(2);
            target.setParentId(rootId);

            OrgUnit childOfTarget = makeUnit(childId, "Đại diện 1");
            childOfTarget.setLevel(3);
            childOfTarget.setParentId(parentId);

            when(orgUnitRepo.findById(parentId)).thenReturn(Optional.of(target));
            when(materializedPathService.getSubtree(parentId)).thenReturn(java.util.List.of(target, childOfTarget));
            when(orgUnitRepo.findAllActiveOrderByPath()).thenReturn(java.util.List.of(r, otherParent, target, childOfTarget));

            List<CandidateParentResponse> candidates = service.findCandidateParents(parentId);

            // target and childOfTarget are excluded.
            // otherParent (Level 2, total = 2 + 1 + 1 = 4 > 3) exceeds depth -> excluded.
            // Remaining: r (currentParent, enabled)
            assertEquals(1, candidates.size());

            CandidateParentResponse candRoot = candidates.stream().filter(x -> x.getId().equals(rootId)).findFirst().orElseThrow();
            assertTrue(candRoot.isCurrentParent());
            assertFalse(candRoot.isDisabled());
            assertTrue(candidates.stream().noneMatch(x -> x.getId().equals(otherParentId)));
        }
    }

    // ── BR-003-12/13: Rank ("Cấp đơn vị") resolution ────────────────

    @Nested
    @DisplayName("Rank (Cấp đơn vị) resolution")
    class RankResolutionTests {

        @Test
        @DisplayName("shouldUseExplicitRankOnCreate")
        void shouldUseExplicitRankOnCreate() {
            CreateOrgUnitRequest request = new CreateOrgUnitRequest();
            request.setName("Đại diện 1");
            request.setRank(OrgUnitRank.REPRESENTATIVE);

            when(orgUnitRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(materializedPathService.computePath(any(), any())).thenReturn("/" + childId + "/");
            when(materializedPathService.calculateLevel(anyString())).thenReturn(1);
            when(unitHistoryRepo.save(any())).thenReturn(UnitHistory.builder().build());

            OrgUnitResponse response = service.create(request, UUID.randomUUID(), "admin");
            assertEquals(OrgUnitRank.REPRESENTATIVE, response.getRank());
        }

        @Test
        @DisplayName("shouldDefaultRankToCucForRootUnit")
        void shouldDefaultRankToCucForRootUnit() {
            CreateOrgUnitRequest request = new CreateOrgUnitRequest();
            request.setName("Cục");

            when(orgUnitRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(materializedPathService.computePath(any(), any())).thenReturn("/" + childId + "/");
            when(materializedPathService.calculateLevel(anyString())).thenReturn(1);
            when(unitHistoryRepo.save(any())).thenReturn(UnitHistory.builder().build());

            OrgUnitResponse response = service.create(request, UUID.randomUUID(), "admin");
            assertEquals(OrgUnitRank.DEPARTMENT, response.getRank());
        }

        @Test
        @DisplayName("shouldInferRankFromLevelOneParent")
        void shouldInferRankFromLevelOneParent() {
            OrgUnit parent = makeUnit(parentId, "Cục");
            parent.setLevel(1);

            when(orgUnitRepo.findById(parentId)).thenReturn(Optional.of(parent));
            when(orgUnitRepo.countByParentIdAndDeletedAtIsNull(parentId)).thenReturn(0L);
            when(orgUnitRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(materializedPathService.computePath(any(), any())).thenReturn("/" + childId + "/");
            when(materializedPathService.calculateLevel(anyString())).thenReturn(2);
            when(unitHistoryRepo.save(any())).thenReturn(UnitHistory.builder().build());

            CreateOrgUnitRequest request = new CreateOrgUnitRequest();
            request.setName("Chi cục 1");
            request.setParentId(parentId);

            OrgUnitResponse response = service.create(request, UUID.randomUUID(), "admin");
            assertEquals(OrgUnitRank.BRANCH, response.getRank());
        }

        @Test
        @DisplayName("shouldInferRankFromLevelTwoParent")
        void shouldInferRankFromLevelTwoParent() {
            OrgUnit parent = makeUnit(parentId, "Chi cục");
            parent.setLevel(2);

            when(orgUnitRepo.findById(parentId)).thenReturn(Optional.of(parent));
            when(orgUnitRepo.countByParentIdAndDeletedAtIsNull(parentId)).thenReturn(0L);
            when(orgUnitRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(materializedPathService.computePath(any(), any())).thenReturn("/" + childId + "/");
            when(materializedPathService.calculateLevel(anyString())).thenReturn(3);
            when(unitHistoryRepo.save(any())).thenReturn(UnitHistory.builder().build());

            CreateOrgUnitRequest request = new CreateOrgUnitRequest();
            request.setName("Đại diện 1");
            request.setParentId(parentId);

            OrgUnitResponse response = service.create(request, UUID.randomUUID(), "admin");
            assertEquals(OrgUnitRank.REPRESENTATIVE, response.getRank());
        }

        @Test
        @DisplayName("shouldSetRankOnUpdate")
        void shouldSetRankOnUpdate() {
            OrgUnit unit = makeUnit(childId, "Cảng vụ");
            when(orgUnitRepo.findById(childId)).thenReturn(Optional.of(unit));
            when(orgUnitRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateOrgUnitRequest request = new UpdateOrgUnitRequest();
            request.setRank(OrgUnitRank.REPRESENTATIVE);

            OrgUnitResponse response = service.update(childId, request, UUID.randomUUID(), "admin");
            assertEquals(OrgUnitRank.REPRESENTATIVE, response.getRank());
        }
    }

    // ── Utility helpers ──────────────────────────────────────────────

    private OrgUnit makeUnit(UUID id, String name) {
        OrgUnit unit = new OrgUnit();
        unit.setId(id);
        unit.setName(name);
        unit.setPath("/" + id + "/");
        unit.setLevel(1);
        unit.setSortOrder(0);
        unit.setCreatedAt(LocalDateTime.now());
        unit.setUpdatedAt(LocalDateTime.now());
        return unit;
    }
}
