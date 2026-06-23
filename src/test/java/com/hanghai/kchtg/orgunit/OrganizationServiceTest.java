package com.hanghai.kchtg.orgunit;

import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
    private UUID testUnitId;

    @BeforeEach
    void setUp() {
        testUnitId = UUID.randomUUID();
        testUnit = new OrgUnit();
        testUnit.setId(testUnitId);
        testUnit.setName("Cục Hàng hải");
        testUnit.setCode("HAI");
        testUnit.setType(OrgUnitType.DEPARTMENT);
        testUnit.setStatus(OrgUnitStatus.ACTIVE);
        testUnit.setParentId(null);
    }

    @Nested
    @DisplayName("Create OrgUnit")
    class CreateTests {

        @Test
        @DisplayName("Should create unit successfully")
        void createUnit_success() {
            CreateOrgUnitRequest request = new CreateOrgUnitRequest();
            request.setName("Chi cục");
            request.setCode("CC1");
            request.setType(OrgUnitType.DIVISION);
            request.setParentId(testUnitId);
            request.setStatus(OrgUnitStatus.ACTIVE);

            when(orgUnitRepository.existsByCode("CC1")).thenReturn(false);
            when(orgUnitRepository.existsById(testUnitId)).thenReturn(true);
            when(orgUnitRepository.save(any(OrgUnit.class))).thenReturn(testUnit);

            OrgUnitResponse result = orgUnitService.create(request);

            assertNotNull(result);
            verify(orgUnitRepository).save(any(OrgUnit.class));
        }

        @Test
        @DisplayName("Should throw when unit code already exists")
        void createDuplicateCode_throwsException() {
            CreateOrgUnitRequest request = new CreateOrgUnitRequest();
            request.setName("Chi cục");
            request.setCode("HAI");

            when(orgUnitRepository.existsByCode("HAI")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> orgUnitService.create(request));
            verify(orgUnitRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Read OrgUnits")
    class ReadTests {

        @Test
        @DisplayName("Should find unit by ID")
        void findById_success() {
            when(orgUnitRepository.findById(testUnitId)).thenReturn(Optional.of(testUnit));

            OrgUnitResponse result = orgUnitService.findById(testUnitId);
            assertNotNull(result);
            assertEquals(testUnit.getCode(), result.getCode());
        }

        @Test
        @DisplayName("Should throw when not found")
        void findById_notFound_throws() {
            when(orgUnitRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class, () -> orgUnitService.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should return all units flat list")
        void findAll_success() {
            when(orgUnitRepository.findAll()).thenReturn(List.of(testUnit));

            List<OrgUnitResponse> result = orgUnitService.findAll();
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find units by parent ID")
        void findByParentId_success() {
            UUID parentId = UUID.randomUUID();
            when(orgUnitRepository.findByParentId(parentId)).thenReturn(List.of(testUnit));

            List<OrgUnitResponse> result = orgUnitService.findByParentId(parentId);
            assertEquals(1, result.size());
        }
    }

    @Nested
    @DisplayName("Update OrgUnit")
    class UpdateTests {

        @Test
        @DisplayName("Should update unit details")
        void updateUnit_success() {
            UpdateOrgUnitRequest request = new UpdateOrgUnitRequest();
            request.setName("Cục Hàng hải mới");
            request.setCode("HAI_NEW");

            when(orgUnitRepository.findById(testUnitId)).thenReturn(Optional.of(testUnit));
            when(orgUnitRepository.existsByCodeAndIdNot("HAI_NEW", testUnitId)).thenReturn(false);
            when(orgUnitRepository.save(any(OrgUnit.class))).thenReturn(testUnit);

            OrgUnitResponse result = orgUnitService.update(testUnitId, request);

            assertNotNull(result);
            verify(orgUnitRepository).save(any(OrgUnit.class));
        }
    }

    @Nested
    @DisplayName("Delete OrgUnit")
    class DeleteTests {

        @Test
        @DisplayName("Should delete unit successfully when it has no children")
        void deleteUnit_success() {
            when(orgUnitRepository.existsById(testUnitId)).thenReturn(true);
            when(orgUnitRepository.findByParentId(testUnitId)).thenReturn(Collections.emptyList());
            when(orgUnitRepository.findById(testUnitId)).thenReturn(Optional.of(testUnit));
            when(orgUnitRepository.save(any(OrgUnit.class))).thenReturn(testUnit);

            orgUnitService.delete(testUnitId);

            assertNotNull(testUnit.getDeletedAt());
            verify(orgUnitRepository).save(testUnit);
        }

        @Test
        @DisplayName("Should throw exception when deleting unit with children")
        void deleteUnitWithChildren_throwsException() {
            OrgUnit child = new OrgUnit();
            child.setId(UUID.randomUUID());
            child.setParentId(testUnitId);

            when(orgUnitRepository.existsById(testUnitId)).thenReturn(true);
            when(orgUnitRepository.findByParentId(testUnitId)).thenReturn(List.of(child));

            assertThrows(IllegalArgumentException.class, () -> orgUnitService.delete(testUnitId));
            verify(orgUnitRepository, never()).save(any());
        }
    }
}
