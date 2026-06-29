package com.hanghai.kchtg.businessintegration;

import com.hanghai.kchtg.businessintegration.dto.*;
import com.hanghai.kchtg.businessintegration.entity.BusinessDataIntegrationRecord;
import com.hanghai.kchtg.businessintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import com.hanghai.kchtg.businessintegration.repository.BusinessDataIntegrationRecordRepository;
import com.hanghai.kchtg.businessintegration.service.BusinessIntegrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessIntegrationServiceTest {

    @Mock
    private BusinessDataIntegrationRecordRepository repository;

    @InjectMocks
    private BusinessIntegrationService integrationService;

    private BusinessDataIntegrationRequest request;

    @BeforeEach
    void setUp() {
        request = new BusinessDataIntegrationRequest(
            IntegrationType.TAU_BIEN_RA_VAO_CANG, "{\"data\":\"test\"}");
    }

    @Test
    void createIntegration_shouldReturnResponse() {
        when(repository.save(any(BusinessDataIntegrationRecord.class))).thenAnswer(invocation -> {
            BusinessDataIntegrationRecord record = invocation.getArgument(0);
            record.setId("test-id-001");
            return record;
        });
        BusinessDataIntegrationResponse response = integrationService.createIntegration(request);
        assertNotNull(response);
        assertEquals("TAU_BIEN_RA_VAO_CANG", response.getIntegrationType());
        assertEquals("PENDING", response.getStatus());
    }

    @Test
    void findById_shouldReturnResponse() {
        BusinessDataIntegrationRecord record = new BusinessDataIntegrationRecord();
        record.setId("test-id-001");
        record.setIntegrationType(IntegrationType.TAU_BIEN_RA_VAO_CANG);
        record.setStatus(IntegrationStatus.SUCCESS);
        when(repository.findById("test-id-001")).thenReturn(Optional.of(record));
        BusinessDataIntegrationResponse response = integrationService.findById("test-id-001");
        assertNotNull(response);
        assertEquals("TAU_BIEN_RA_VAO_CANG", response.getIntegrationType());
    }

    @Test
    void findByType_shouldReturnList() {
        BusinessDataIntegrationRecord record1 = new BusinessDataIntegrationRecord();
        record1.setIntegrationType(IntegrationType.TAU_BIEN_RA_VAO_CANG);
        record1.setStatus(IntegrationStatus.SUCCESS);
        BusinessDataIntegrationRecord record2 = new BusinessDataIntegrationRecord();
        record2.setIntegrationType(IntegrationType.TAU_BIEN_RA_VAO_CANG);
        record2.setStatus(IntegrationStatus.FAILED);
        when(repository.findByIntegrationType(IntegrationType.TAU_BIEN_RA_VAO_CANG))
            .thenReturn(Arrays.asList(record1, record2));
        List<BusinessDataIntegrationResponse> responses = integrationService.findByType(IntegrationType.TAU_BIEN_RA_VAO_CANG);
        assertEquals(2, responses.size());
    }

    @Test
    void findByStatus_shouldReturnList() {
        BusinessDataIntegrationRecord record1 = new BusinessDataIntegrationRecord();
        record1.setIntegrationType(IntegrationType.TAU_BIEN_RA_VAO_CANG);
        record1.setStatus(IntegrationStatus.PENDING);
        BusinessDataIntegrationRecord record2 = new BusinessDataIntegrationRecord();
        record2.setIntegrationType(IntegrationType.TAU_BIEN_RA_VAO_CANG);
        record2.setStatus(IntegrationStatus.PENDING);
        when(repository.findByStatus(IntegrationStatus.PENDING))
            .thenReturn(Arrays.asList(record1, record2));
        List<BusinessDataIntegrationResponse> responses = integrationService.findByStatus(IntegrationStatus.PENDING);
        assertEquals(2, responses.size());
    }

    @Test
    void processIntegration_shouldMarkSuccess() {
        BusinessDataIntegrationRecord record = new BusinessDataIntegrationRecord();
        record.setId("test-id-001");
        record.setIntegrationType(IntegrationType.TAU_BIEN_RA_VAO_CANG);
        record.setStatus(IntegrationStatus.PENDING);
        when(repository.findById("test-id-001")).thenReturn(Optional.of(record));
        when(repository.save(any(BusinessDataIntegrationRecord.class))).thenReturn(record);
        BusinessDataIntegrationResponse response = integrationService.processIntegration("test-id-001");
        assertEquals("SUCCESS", response.getStatus());
        verify(repository, times(2)).save(any());
    }

    @Test
    void getStatistics_shouldReturnStats() {
        when(repository.count()).thenReturn(10L);
        when(repository.countByStatus(IntegrationStatus.SUCCESS)).thenReturn(7L);
        when(repository.countByStatus(IntegrationStatus.FAILED)).thenReturn(2L);
        when(repository.countByStatus(IntegrationStatus.PENDING)).thenReturn(1L);
        BusinessIntegrationStatistics stats = integrationService.getStatistics();
        assertEquals(10, stats.getTotalCount());
        assertEquals(7, stats.getSuccessCount());
        assertEquals(70.0, stats.getSuccessRate());
    }

    @Test
    void findById_shouldReturnNullForNotFound() {
        when(repository.findById("non-existent")).thenReturn(Optional.empty());
        BusinessDataIntegrationResponse response = integrationService.findById("non-existent");
        assertNull(response);
    }

    @Test
    void createIntegration_shouldSetPeriod() {
        BusinessDataIntegrationRequest req = new BusinessDataIntegrationRequest();
        req.setIntegrationType(IntegrationType.KHOI_LUONG_HANG_HOA_THEO_THANG);
        req.setIntegrationPeriod("2026-01");
        req.setDataPayload("{\"volume\":1000}");
        when(repository.save(any(BusinessDataIntegrationRecord.class))).thenAnswer(invocation -> {
            BusinessDataIntegrationRecord record = invocation.getArgument(0);
            record.setId("period-001");
            return record;
        });
        BusinessDataIntegrationResponse response = integrationService.createIntegration(req);
        assertEquals("2026-01", response.getIntegrationPeriod());
    }
}
