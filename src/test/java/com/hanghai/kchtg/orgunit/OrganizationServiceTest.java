package com.hanghai.kchtg.orgunit;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @InjectMocks
    private OrgUnitService orgUnitService;

    private OrgUnit testUnit;

    @BeforeEach
    void setUp() {
        testUnit = new OrgUnit();
        testUnit.setId(1L);
        testUnit.setName("Cục Hàng hải");
        testUnit.setCode("HAI");
        testUnit.setType(OrgUnitType.CUC);
        testUnit.setStatus(OrgUnitStatus.ACTIVE);
        testUnit.setParentId(null);
        testUnit.setLevel(1);
        testUnit.setCoefficient(new java.math.BigDecimal("1.50"));
    }

    // ==================== CRUD TESTS ====================

    @Test
    void createUnit_shouldReturnUnit() {
        var request = new com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest();
        request.setName("Chi cục");
        request.setCode("CC1");
        request.setType(OrgUnitType.CHI_CUC);
        request.setParentId(1L);

        when(orgUnitRepository.existsByCode("CC1")).thenReturn(false);
        when(orgUnitRepository.findById(1L)).thenReturn(Optional.of(testUnit));
        when(orgUnitRepository.save(any(OrgUnit.class))).thenReturn(testUnit);

        OrgUnit result = orgUnitService.createUnit(request);

        assertNotNull(result);
        assertEquals("Chi cục", result.getName());
        verify(orgUnitRepository).save(any());
    }

    @Test
    void createUnit_shouldThrowWhenCodeExists() {
        var request = new com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest();
        request.setName("Chi cục");
        request.setCode("HAI");

        when(orgUnitRepository.existsByCode("HAI")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> orgUnitService.createUnit(request));
        verify(orgUnitRepository, never()).save(any());
    }

    @Test
    void updateUnit_shouldChangeName() {
        OrgUnit existing = new OrgUnit(testUnit);
        existing.setName("Cục Hàng hải");
        existing.setCode("HAI");

        var request = new com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest();
        request.setName("Cục Hàng hải mới");

        when(orgUnitRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(orgUnitRepository.save(any())).thenReturn(existing);

        OrgUnit result = orgUnitService.updateUnit(1L, request);

        assertEquals("Cục Hàng hải mới", result.getName());
        verify(orgUnitRepository).save(existing);
    }

    @Test
    void deleteUnit_shouldSoftDelete() {
        OrgUnit existing = new OrgUnit(testUnit);
        when(orgUnitRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(orgUnitRepository.save(any())).thenReturn(existing);

        orgUnitService.deleteUnit(1L);

        assertNotNull(existing.getDeletedAt());
    }

    // ==================== TREE TESTS ====================

    @Test
    void findRoots_shouldReturnRootUnits() {
        List<OrgUnit> roots = List.of(testUnit);
        when(orgUnitRepository.findByParentIdIsNull()).thenReturn(roots);

        List<OrgUnit> result = orgUnitService.findAllRoots();

        assertEquals(1, result.size());
        assertEquals("Cục Hàng hải", result.get(0).getName());
    }

    @Test
    void findChildren_shouldReturnChildren() {
        List<OrgUnit> children = new ArrayList<>();
        OrgUnit child = new OrgUnit();
        child.setId(2L);
        child.setName("Chi cục 1");
        child.setParentId(1L);
        child.setLevel(2);
        children.add(child);

        when(orgUnitRepository.findByParentId(1L)).thenReturn(children);

        List<OrgUnit> result = orgUnitService.findAllChildren(1L);

        assertEquals(1, result.size());
        assertEquals("Chi cục 1", result.get(0).getName());
    }

    @Test
    void buildTree_shouldReturnRootWithChildren() {
        OrgUnit parent = new OrgUnit(testUnit);
        parent.setName("Cục Hàng hải");
        parent.setLevel(1);

        OrgUnit child = new OrgUnit();
        child.setId(2L);
        child.setName("Chi cục 1");
        child.setParentId(1L);
        child.setLevel(2);

        List<OrgUnit> children = List.of(child);

        when(orgUnitRepository.findByParentIdIsNull()).thenReturn(List.of(parent));
        when(orgUnitRepository.findByParentId(1L)).thenReturn(children);

        List<OrgUnit> tree = orgUnitService.buildTree();

        assertNotNull(tree);
        assertEquals(1, tree.size());
        assertEquals("Cục Hàng hải", tree.get(0).getName());
    }

    // ==================== APPROVAL TESTS ====================

    @Test
    void approveUnit_shouldSetApprovedAt() {
        OrgUnit existing = new OrgUnit(testUnit);
        existing.setName("Cục Hàng hải");
        existing.setStatus(OrgUnitStatus.PENDING);
        existing.setApprovedAt(null);

        when(orgUnitRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(orgUnitRepository.save(any())).thenReturn(existing);

        orgUnitService.approveUnit(1L);

        assertNotNull(existing.getApprovedAt());
        assertEquals(OrgUnitStatus.ACTIVE, existing.getStatus());
    }

    @Test
    void rejectUnit_shouldSetStatusRejected() {
        OrgUnit existing = new OrgUnit(testUnit);
        existing.setName("Cục Hàng hải");
        existing.setStatus(OrgUnitStatus.PENDING);

        when(orgUnitRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(orgUnitRepository.save(any())).thenReturn(existing);

        orgUnitService.rejectUnit(1L, "Không hợp lệ");

        assertEquals(OrgUnitStatus.REJECTED, existing.getStatus());
    }
}
