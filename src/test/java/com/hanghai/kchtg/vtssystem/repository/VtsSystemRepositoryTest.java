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
        long proposedCount = 0;
        for (Object[] row : counts) {
            if (row[0] instanceof ApprovalStatus && ((ApprovalStatus) row[0]) == ApprovalStatus.PROPOSED) {
                proposedCount = ((Number) row[1]).longValue();
            }
        }
        assertEquals(2, proposedCount);
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
    void testDeleteSoft() {
        VtsSystem saved = repository.save(createVtsSystem("VTS-SOFT"));
        entityManager.flush();

        saved.softDelete(UUID.randomUUID());
        repository.save(saved);
        entityManager.flush();

        assertTrue(saved.getDeletedAt() != null);

        // Should not appear in status search
        assertEquals(0, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.PROPOSED).size());
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
        vts.setApprovalStatus(ApprovalStatus.PROPOSED);
        return vts;
    }
}
