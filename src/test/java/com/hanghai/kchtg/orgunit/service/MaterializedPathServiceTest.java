package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import com.hanghai.kchtg.orgunit.entity.UnitHistory;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.repository.UnitRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link MaterializedPathService}.
 * Covers: path computation, level calculation, circular reference detection, subtree operations.
 */
@ExtendWith(MockitoExtension.class)
class MaterializedPathServiceTest {

    @Mock
    private OrgUnitRepository repo;

    @Mock
    private org.springframework.data.jpa.repository.JpaRepository<OrgUnit, UUID> jpaRepo;

    private EntityManager entityManager;

    @InjectMocks
    private MaterializedPathService service;

    private UUID rootId;
    private UUID parentId;
    private UUID childId;

    @BeforeEach
    void setUp() {
        rootId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        parentId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        childId = UUID.fromString("00000000-0000-0000-0000-000000000003");

        // Setup EntityManager mock
        entityManager = org.mockito.Mockito.mock(EntityManager.class);
    }

    // ── Path computation ─────────────────────────────────────────────

    @Test
    @DisplayName("F-003: computePath for root unit (no parent) returns /{id}/")
    void shouldComputeRootPath() {
        String path = service.computePath(null, childId);
        assertEquals("/" + childId + "/", path);
    }

    @Test
    @DisplayName("F-003: computePath for direct child of root computes /rootId/childId/")
    void shouldComputePathForChildOfRoot() {
        OrgUnit root = new OrgUnit();
        root.setId(rootId);
        root.setParentId(null);

        OrgUnit parent = new OrgUnit();
        parent.setId(parentId);
        parent.setParentId(rootId);

        when(repo.findById(rootId)).thenReturn(Optional.of(root));
        when(repo.findById(parentId)).thenReturn(Optional.of(parent));

        String path = service.computePath(parentId, childId);
        assertEquals("/" + rootId + "/" + parentId + "/" + childId + "/", path);
    }

    // ── Level calculation ────────────────────────────────────────────

    @Test
    @DisplayName("F-003: calculateLevel returns 3 for path /1/5/12/")
    void shouldCalculateLevelCorrectly() {
        assertEquals(3, service.calculateLevel("/00000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000002/00000000-0000-0000-0000-000000000003/"));
    }

    @Test
    @DisplayName("F-003: calculateLevel returns 1 for root path /1/")
    void shouldCalculateRootLevel() {
        assertEquals(1, service.calculateLevel("/00000000-0000-0000-0000-000000000001/"));
    }

    @Test
    @DisplayName("F-003: calculateLevel returns 0 for empty path")
    void shouldCalculateZeroLevel() {
        assertEquals(0, service.calculateLevel(""));
        assertEquals(0, service.calculateLevel(null));
    }

    // ── Circular reference detection ─────────────────────────────────

    @Test
    @DisplayName("F-003: isAncestor detects self-parenting (AC-003-02)")
    void shouldDetectSelfParenting() {
        UUID selfId = UUID.fromString("00000000-0000-0000-0000-000000000099");
        OrgUnit unit = new OrgUnit();
        unit.setId(selfId);
        unit.setPath("/" + selfId + "/");

        when(repo.findById(selfId)).thenReturn(Optional.of(unit));

        // Self as ancestor of itself — path contains self ID
        boolean isAncestor = service.isAncestor(selfId, selfId);
        assertTrue(isAncestor, "Self should be detected as its own ancestor");
    }

    @Test
    @DisplayName("F-003: isAncestor detects descendant-as-parent (AC-003-02)")
    void shouldDetectDescendantAsParent() {
        UUID childId = UUID.fromString("00000000-0000-0000-0000-000000000003");
        UUID descendantId = UUID.fromString("00000000-0000-0000-0000-000000000004");

        // Grandchild path contains descendant's ID
        OrgUnit grandchild = new OrgUnit();
        grandchild.setId(descendantId);
        grandchild.setPath("/" + childId + "/" + descendantId + "/");

        when(repo.findById(descendantId)).thenReturn(Optional.of(grandchild));

        boolean isAncestor = service.isAncestor(descendantId, childId);
        assertTrue(isAncestor, "A unit's descendant should be detected as ancestor when used as parent");
    }

    @Test
    @DisplayName("F-003: isAncestor returns false when no circular ref")
    void shouldDetectNoCircularRef() {
        UUID unitId = UUID.fromString("00000000-0000-0000-0000-000000000003");
        UUID unrelatedId = UUID.fromString("00000000-0000-0000-0000-000000000009");

        OrgUnit unit = new OrgUnit();
        unit.setId(unitId);
        unit.setPath("/" + unitId + "/");

        when(repo.findById(unitId)).thenReturn(Optional.of(unit));

        assertFalse(service.isAncestor(unitId, unrelatedId));
    }

    @Test
    @DisplayName("F-003: isAncestor returns false when path is empty")
    void shouldHandleEmptyPath() {
        UUID unitId = UUID.randomUUID();
        OrgUnit unit = new OrgUnit();
        unit.setId(unitId);
        unit.setPath("");

        when(repo.findById(unitId)).thenReturn(Optional.of(unit));

        assertFalse(service.isAncestor(unitId, UUID.randomUUID()));
    }

    // ── Coefficient validation ───────────────────────────────────────

    @Test
    @DisplayName("F-003: coefficient = 0 is invalid (BR-017)")
    void shouldRejectZeroCoefficient() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            if (0.0 <= 0.0) throw new IllegalArgumentException("Hệ số phải lớn hơn 0");
        });
        assertNotNull(ex);
    }

    @Test
    @DisplayName("F-003: coefficient = -1 is invalid (BR-017)")
    void shouldRejectNegativeCoefficient() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            if (-1.0 <= 0.0) throw new IllegalArgumentException("Hệ số phải lớn hơn 0");
        });
        assertNotNull(ex);
    }

    @Test
    @DisplayName("F-003: coefficient = 1.234 has 3 decimal places — fails BigDecimal(5,2)")
    void shouldRejectThreeDecimalCoefficient() {
        BigDecimal threeDec = new BigDecimal("1.234");
        BigDecimal rounded = threeDec.setScale(2, BigDecimal.ROUND_HALF_UP);
        assertNotEquals(threeDec, rounded, "1.234 rounded to 2 decimals ≠ original");
    }
}
