package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JPA repository tests for VtsSystem — verifies unique code constraint,
 * query behavior, and Flyway migration effects on the actual database schema.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class VtsSystemRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private VtsSystemRepository repository;

    private UUID testOrgUnitId;
    private UUID testOwningOrgId;
    private UUID testOperatingOrgId;

    @BeforeEach
    void setUp() {
        testOrgUnitId = UUID.randomUUID();
        testOwningOrgId = UUID.randomUUID();
        testOperatingOrgId = UUID.randomUUID();
        // Clean up any existing test records
        repository.deleteAll();
        entityManager.flush();
    }

    @Test
    void testUniqueCodeConstraint() {
        VtsSystem first = createVtsSystem("VTS-UNIQUE");
        repository.saveAndFlush(first);

        VtsSystem duplicate = createVtsSystem("VTS-UNIQUE");

        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> {
            repository.saveAndFlush(duplicate);
        });
    }

    @Test
    void testExistsByCode() {
        repository.save(createVtsSystem("VTS-EXISTS"));
        entityManager.flush();

        assertTrue(repository.existsByCode("VTS-EXISTS"));
        assertFalse(repository.existsByCode("VTS-NOT-EXIST"));
        assertFalse(repository.existsByCode(""));
        assertFalse(repository.existsByCode(null));
    }

    @Test
    void testExistsByCodeAndIdNot() {
        VtsSystem existing = repository.save(createVtsSystem("VTS-EXISTING"));
        entityManager.flush();

        // Same code, different ID → true
        assertTrue(repository.existsByCodeAndIdNot("VTS-EXISTING", UUID.randomUUID()));

        // Same code, same ID → false
        assertFalse(repository.existsByCodeAndIdNot("VTS-EXISTING", existing.getId()));

        // Different code → false
        assertFalse(repository.existsByCodeAndIdNot("VTS-DIFFERENT", existing.getId()));
    }

    @Test
    void testFindByApprovalStatusAndIsDeletedFalse() {
        VtsSystem proposed = repository.save(createVtsSystem("VTS-1"));
        proposed.setApprovalStatus(ApprovalStatus.PROPOSED);
        repository.save(proposed);

        VtsSystem approved = repository.save(createVtsSystem("VTS-2"));
        approved.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(approved);

        VtsSystem rejected = repository.save(createVtsSystem("VTS-3"));
        rejected.setApprovalStatus(ApprovalStatus.REJECTED);
        repository.save(rejected);

        entityManager.flush();

        assertEquals(1, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.PROPOSED).size());
        assertEquals(1, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.APPROVED).size());
        assertEquals(1, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.REJECTED).size());
        assertEquals(0, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.DRAFT).size());
    }

    @Test
    void testFindByApprovalStatus_ExcludesDeleted() {
        VtsSystem proposed = repository.save(createVtsSystem("VTS-DELETED"));
        proposed.setApprovalStatus(ApprovalStatus.PROPOSED);
        repository.save(proposed);
        proposed.softDelete(UUID.randomUUID());
        repository.save(proposed);
        entityManager.flush();

        assertEquals(0, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.PROPOSED).size());
    }

    @Test
    void testSearchKeyword_MatchesCodeAndName() {
        repository.save(createVtsSystemWithCodeAndName("VTS-HAIPHONG", "VTS Hải Phòng"));
        repository.save(createVtsSystemWithCodeAndName("VTS-HANOI", "VTS Hà Nội"));
        entityManager.flush();

        List<VtsSystem> results = repository.searchFiltered(null, "%haiphong%");
        assertEquals(1, results.size());
        assertEquals("VTS-HAIPHONG", results.get(0).getCode());

        results = repository.searchFiltered(null, "%hai phong%");
        assertEquals(1, results.size());
        assertEquals("VTS Hải Phòng", results.get(0).getSystemName());
    }

    @Test
    void testSearchFilteredWithOrgUnitId() {
        VtsSystem vts = repository.save(createVtsSystem("VTS-ORG"));
        UUID orgId = vts.getOrgUnitId();
        entityManager.flush();

        List<VtsSystem> results = repository.searchFiltered(orgId, "%vts-org%");
        assertEquals(1, results.size());
        assertEquals(vts.getId(), results.get(0).getId());

        // Different org unit should exclude
        List<VtsSystem> excluded = repository.searchFiltered(UUID.randomUUID(), "%vts-org%");
        assertEquals(0, excluded.size());
    }

    @Test
    void testCountByApprovalStatus() {
        repository.save(createVtsSystem("VTS-A1"));
        repository.save(createVtsSystem("VTS-A2"));
        entityManager.flush();

        List<Object[]> counts = repository.countByApprovalStatus(
                false, List.of(), null, null, null);

        assertNotNull(counts);
        long draftCount = 0;
        for (Object[] row : counts) {
            if (row[0] instanceof ApprovalStatus && ((ApprovalStatus) row[0]) == ApprovalStatus.DRAFT) {
                draftCount = ((Number) row[1]).longValue();
            }
        }
        assertEquals(2, draftCount);
    }

    @Test
    void testFindById() {
        VtsSystem saved = repository.save(createVtsSystem("VTS-FIND"));
        entityManager.flush();

        Optional<VtsSystem> found = repository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("VTS-FIND", found.get().getCode());
        assertEquals("VTS VTS-FIND", found.get().getSystemName());
    }

    @Test
    void testUpdate() {
        VtsSystem saved = repository.save(createVtsSystem("VTS-UPDATE"));
        entityManager.flush();

        saved.setSystemName("VTS Updated");
        saved.setConditionStatus(ConditionStatus.MAINTENANCE);
        VtsSystem updated = repository.save(saved);
        entityManager.flush();

        assertEquals("VTS Updated", updated.getSystemName());
        assertEquals(ConditionStatus.MAINTENANCE, updated.getConditionStatus());
    }

    @Test
    void testSearchList_WithPendingApproval_MatchesPendingApproval() {
        VtsSystem pending1 = createVtsSystem("VTS-P1");
        pending1.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        repository.save(pending1);

        VtsSystem pending2 = createVtsSystem("VTS-P2");
        pending2.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        repository.save(pending2);

        VtsSystem approved = createVtsSystem("VTS-P3");
        approved.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(approved);

        entityManager.flush();

        var result = repository.searchList(false, List.of(), null, null, null,
                ApprovalStatus.PENDING_APPROVAL, null, null, org.springframework.data.domain.PageRequest.of(0, 20));

        assertEquals(2, result.getTotalElements());
    }

    @Test
    void testSearchList_WithApproved_MatchesApproved() {
        VtsSystem app1 = createVtsSystem("VTS-A1");
        app1.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(app1);

        VtsSystem app2 = createVtsSystem("VTS-A2");
        app2.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(app2);

        VtsSystem pending = createVtsSystem("VTS-A3");
        pending.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        repository.save(pending);

        entityManager.flush();

        var result = repository.searchList(false, List.of(), null, null, null,
                ApprovalStatus.APPROVED, null, null, org.springframework.data.domain.PageRequest.of(0, 20));

        assertEquals(2, result.getTotalElements());
    }

    @Test
    void testSearchList_WithRejected_MatchesRejectedLevel1AndLevel2() {
        VtsSystem r1 = createVtsSystem("VTS-R1");
        r1.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
        repository.save(r1);

        VtsSystem r2 = createVtsSystem("VTS-R2");
        r2.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL2);
        repository.save(r2);

        VtsSystem pending = createVtsSystem("VTS-R3");
        pending.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        repository.save(pending);

        entityManager.flush();

        var result = repository.searchList(false, List.of(), null, null, null,
                ApprovalStatus.REJECTED_LEVEL1, null, null, org.springframework.data.domain.PageRequest.of(0, 20));

        assertEquals(2, result.getTotalElements());
    }

    // Helper methods

    private VtsSystem createVtsSystem(String code) {
        return createVtsSystemWithCodeAndName(code, "VTS " + code);
    }

    private VtsSystem createVtsSystemWithCodeAndName(String code, String name) {
        VtsSystem vts = new VtsSystem();
        vts.setCode(code);
        vts.setSystemName(name);
        vts.setConditionStatus(ConditionStatus.OPERATIONAL);
        vts.setOrgUnitId(testOrgUnitId);
        vts.setOwningOrgId(testOwningOrgId);
        vts.setOperatingOrgId(testOperatingOrgId);
        vts.setProvinceId(1);
        vts.setApprovalStatus(ApprovalStatus.DRAFT);
        return vts;
    }
}
