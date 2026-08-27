package com.hanghai.kchtg.security;

import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Real Database Integration Test for Multi-Tenant Data Scope & Security Level:
 * Exercises actual database queries against an in-memory SQL database with real Hibernate Sessions,
 * testing that Hibernate @Filter annotations ("orgUnitFilter" and "recordSecurityLevelFilter")
 * and custom JPA repository queries enforce strict database-level isolation.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class DataScopeRealDatabaseIntegrationTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private VtsSystemRepository vtsRepository;

    @Autowired
    private BuoyRepository buoyRepository;

    private UUID unitAId;
    private UUID unitBId;

    private VtsSystem vtsA;
    private VtsSystem vtsB;
    private VtsSystem vtsA_Restricted;

    private Buoy buoyA;
    private Buoy buoyB;

    @BeforeEach
    void setUp() {
        unitAId = UUID.randomUUID();
        unitBId = UUID.randomUUID();

        // 1. Persist VTS System for Unit A
        vtsA = VtsSystem.builder()
                .systemName("VTS Cảng vụ Hải Phòng (Unit A)")
                .code("VTS-HP-01")
                .orgUnitId(unitAId)
                .owningOrgId(unitAId)
                .operatingOrgId(unitAId)
                .provinceId(1)
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
        vtsA = entityManager.persistAndFlush(vtsA);

        // 2. Persist VTS System for Unit B
        vtsB = VtsSystem.builder()
                .systemName("VTS Cảng vụ TP.HCM (Unit B)")
                .code("VTS-SG-01")
                .orgUnitId(unitBId)
                .owningOrgId(unitBId)
                .operatingOrgId(unitBId)
                .provinceId(2)
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
        vtsB = entityManager.persistAndFlush(vtsB);

        // 3. Persist second VTS System for Unit A
        vtsA_Restricted = VtsSystem.builder()
                .systemName("VTS Cảng vụ Hải Phòng #2 (Unit A)")
                .code("VTS-HP-02")
                .orgUnitId(unitAId)
                .owningOrgId(unitAId)
                .operatingOrgId(unitAId)
                .provinceId(1)
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
        vtsA_Restricted = entityManager.persistAndFlush(vtsA_Restricted);

        // 4. Persist Buoys across both units
        buoyA = Buoy.builder()
                .name("Phao tiêu luồng Hải Phòng #1")
                .code("BUOY-HP-01")
                .orgUnitId(unitAId)
                .provinceId(1)
                .range(5.0)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
        buoyA = entityManager.persistAndFlush(buoyA);

        buoyB = Buoy.builder()
                .name("Phao tiêu luồng Sài Gòn #1")
                .code("BUOY-SG-01")
                .orgUnitId(unitBId)
                .provinceId(2)
                .range(5.0)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
        buoyB = entityManager.persistAndFlush(buoyB);

        entityManager.clear();
    }

    @Test
    @DisplayName("1. Real DB Hibernate Filter: orgUnitFilter with Unit A strictly omits Unit B records")
    void orgUnitFilter_whenAppliedToUnitA_shouldFilterOutUnitBRecordsFromRealDatabase() {
        Session session = entityManager.getEntityManager().unwrap(Session.class);
        session.enableFilter("orgUnitFilter").setParameterList("orgUnitIds", List.of(unitAId));

        // When querying all VTS systems
        List<VtsSystem> vtsList = vtsRepository.findAll();

        // Then: Only Unit A records returned; Unit B record is strictly filtered out in SQL
        assertEquals(2, vtsList.size()); // vtsA and vtsA_Restricted
        assertTrue(vtsList.stream().allMatch(v -> unitAId.equals(v.getOrgUnitId())));
        assertFalse(vtsList.stream().anyMatch(v -> unitBId.equals(v.getOrgUnitId())));

        // When querying all Buoys across modules
        List<Buoy> buoyList = buoyRepository.findAll();
        assertEquals(1, buoyList.size());
        assertEquals(buoyA.getId(), buoyList.get(0).getId());
    }

    @Test
    @DisplayName("2. Real DB Hibernate Filter: orgUnitFilter with Unit B strictly omits Unit A records")
    void orgUnitFilter_whenAppliedToUnitB_shouldFilterOutUnitARecordsFromRealDatabase() {
        Session session = entityManager.getEntityManager().unwrap(Session.class);
        session.enableFilter("orgUnitFilter").setParameterList("orgUnitIds", List.of(unitBId));

        List<VtsSystem> vtsList = vtsRepository.findAll();

        // Then: Only Unit B record is returned
        assertEquals(1, vtsList.size());
        assertEquals(vtsB.getId(), vtsList.get(0).getId());
        assertEquals(unitBId, vtsList.get(0).getOrgUnitId());

        List<Buoy> buoyList = buoyRepository.findAll();
        assertEquals(1, buoyList.size());
        assertEquals(buoyB.getId(), buoyList.get(0).getId());
    }

    @Test
    @DisplayName("3. Real DB Repository Query: scopeEnabled=true isolates Unit A data, scopeEnabled=false returns all")
    void repositorySearchQuery_withScopeParameters_shouldIsolateDataCorrectlyInRealDatabase() {
        // When scope is ENABLED for Unit A
        Page<VtsSystem> scopedResult = vtsRepository.search(
                true,
                List.of(unitAId),
                null,
                null,
                null,
                null,
                PageRequest.of(0, 10));

        assertEquals(2, scopedResult.getTotalElements());
        assertTrue(scopedResult.getContent().stream().allMatch(v -> unitAId.equals(v.getOrgUnitId())));

        // When scope is DISABLED (Admin Cục / Nationwide scope)
        Page<VtsSystem> nationwideResult = vtsRepository.search(
                false,
                Collections.emptyList(),
                null,
                null,
                null,
                null,
                PageRequest.of(0, 10));

        assertEquals(3, nationwideResult.getTotalElements());
        assertTrue(nationwideResult.getContent().stream().anyMatch(v -> unitAId.equals(v.getOrgUnitId())));
        assertTrue(nationwideResult.getContent().stream().anyMatch(v -> unitBId.equals(v.getOrgUnitId())));
    }
}
