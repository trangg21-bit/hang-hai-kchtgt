package com.hanghai.kchtg.systemintegration;

import com.hanghai.kchtg.systemintegration.dto.*;
import com.hanghai.kchtg.systemintegration.entity.SystemIntegrationRecord;
import com.hanghai.kchtg.systemintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import com.hanghai.kchtg.systemintegration.repository.SystemIntegrationRecordRepository;
import com.hanghai.kchtg.systemintegration.service.SystemIntegrationService;
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
class SystemIntegrationServiceTest {

    @Mock
    private SystemIntegrationRecordRepository repository;

    @InjectMocks
    private SystemIntegrationService integrationService;

    private SystemIntegrationRequest request;

    @BeforeEach
    void setUp() {
        request = new SystemIntegrationRequest(
            IntegrationType.HE_THONG_VTS, "VTS-SYS-001", "KCHTGT-CORE", "{\"data\":\"test\"}");
    }

    @Test
    void createIntegration_shouldReturnResponse() {
        when(repository.save(any(SystemIntegrationRecord.class))).thenAnswer(invocation -> {
            SystemIntegrationRecord record = invocation.getArgument(0);
            record.setId("test-id-001");
            return record;
        });
        SystemIntegrationResponse response = integrationService.createIntegration(request);
        assertNotNull(response);
        assertEquals("HE_THONG_VTS", response.getIntegrationType());
        assertEquals("PENDING", response.getStatus());
    }

    @Test
    void findById_shouldReturnResponse() {
        SystemIntegrationRecord record = new SystemIntegrationRecord();
        record.setId("test-id-001");
        record.setIntegrationType(IntegrationType.HE_THONG_VTS);
        record.setStatus(IntegrationStatus.SUCCESS);
        when(repository.findById("test-id-001")).thenReturn(Optional.of(record));
        SystemIntegrationResponse response = integrationService.findById("test-id-001");
        assertNotNull(response);
        assertEquals("HE_THONG_VTS", response.getIntegrationType());
    }

    @Test
    void findByType_shouldReturnList() {
        SystemIntegrationRecord record1 = new SystemIntegrationRecord();
        record1.setIntegrationType(IntegrationType.HE_THONG_VTS);
        record1.setStatus(IntegrationStatus.SUCCESS);
        SystemIntegrationRecord record2 = new SystemIntegrationRecord();
        record2.setIntegrationType(IntegrationType.HE_THONG_VTS);
        record2.setStatus(IntegrationStatus.FAILED);
        when(repository.findByIntegrationType(IntegrationType.HE_THONG_VTS))
            .thenReturn(Arrays.asList(record1, record2));
        List<SystemIntegrationResponse> responses = integrationService.findByType(IntegrationType.HE_THONG_VTS);
        assertEquals(2, responses.size());
    }

    @Test
    void findByStatus_shouldReturnList() {
        SystemIntegrationRecord record1 = new SystemIntegrationRecord();
        record1.setStatus(IntegrationStatus.PENDING);
        record1.setIntegrationType(IntegrationType.HE_THONG_VTS);
        SystemIntegrationRecord record2 = new SystemIntegrationRecord();
        record2.setStatus(IntegrationStatus.PENDING);
        record2.setIntegrationType(IntegrationType.HE_THONG_VTS);
        when(repository.findByStatus(IntegrationStatus.PENDING))
            .thenReturn(Arrays.asList(record1, record2));
        List<SystemIntegrationResponse> responses = integrationService.findByStatus(IntegrationStatus.PENDING);
        assertEquals(2, responses.size());
    }

    @Test
    void processIntegration_shouldMarkSuccess() {
        SystemIntegrationRecord record = new SystemIntegrationRecord();
        record.setId("test-id-001");
        record.setStatus(IntegrationStatus.PENDING);
        record.setIntegrationType(IntegrationType.HE_THONG_VTS);
        when(repository.findById("test-id-001")).thenReturn(Optional.of(record));
        when(repository.save(any(SystemIntegrationRecord.class))).thenReturn(record);
        SystemIntegrationResponse response = integrationService.processIntegration("test-id-001");
        assertEquals("SUCCESS", response.getStatus());
        verify(repository, times(2)).save(any());
    }

    @Test
    void getStatistics_shouldReturnStats() {
        when(repository.count()).thenReturn(10L);
        when(repository.countByStatus(IntegrationStatus.SUCCESS)).thenReturn(7L);
        when(repository.countByStatus(IntegrationStatus.FAILED)).thenReturn(2L);
        when(repository.countByStatus(IntegrationStatus.PENDING)).thenReturn(1L);
        when(repository.countByStatus(IntegrationStatus.RETRYING)).thenReturn(0L);
        IntegrationStatistics stats = integrationService.getStatistics();
        assertEquals(10, stats.getTotalCount());
        assertEquals(7, stats.getSuccessCount());
        assertEquals(70.0, stats.getSuccessRate());
    }

    @Test
    void processIntegration_shouldMarkFailedOnError() {
        SystemIntegrationRecord record = new SystemIntegrationRecord();
        record.setId("test-id-001");
        record.setStatus(IntegrationStatus.PENDING);
        record.setRetryCount(0);
        record.setIntegrationType(IntegrationType.HE_THONG_VTS);
        
        SystemIntegrationRecord spyRecord = spy(record);
        lenient().doThrow(new RuntimeException("Integration failed")).when(spyRecord).setStatus(IntegrationStatus.SUCCESS);
        
        when(repository.findById("test-id-001")).thenReturn(Optional.of(spyRecord));
        when(repository.save(any(SystemIntegrationRecord.class))).thenReturn(spyRecord);
        
        SystemIntegrationResponse response = integrationService.processIntegration("test-id-001");
        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertEquals("Integration failed", response.getErrorMessage());
        assertEquals(1, response.getRetryCount());
        verify(repository, times(2)).save(any());
    }

    @Test
    void findById_shouldReturnNullForNotFound() {
        when(repository.findById("non-existent")).thenReturn(Optional.empty());
        SystemIntegrationResponse response = integrationService.findById("non-existent");
        assertNull(response);
    }
}
