package com.hanghai.kchtg.systemintegration;

import com.hanghai.kchtg.systemintegration.entity.SystemIntegrationRecord;
import com.hanghai.kchtg.systemintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.systemintegration.repository.SystemIntegrationRecordRepository;
import com.hanghai.kchtg.systemintegration.service.IntegrationSchedulingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Arrays;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IntegrationSchedulingServiceTest {

    @Mock
    private SystemIntegrationRecordRepository repository;

    @InjectMocks
    private IntegrationSchedulingService schedulingService;

    @Test
    void processPendingIntegrations_shouldProcessAllPending() {
        SystemIntegrationRecord record1 = new SystemIntegrationRecord();
        record1.setId("pending-001");
        record1.setStatus(IntegrationStatus.PENDING);
        SystemIntegrationRecord record2 = new SystemIntegrationRecord();
        record2.setId("pending-002");
        record2.setStatus(IntegrationStatus.PENDING);
        when(repository.findByStatus(IntegrationStatus.PENDING))
            .thenReturn(Arrays.asList(record1, record2));
        when(repository.save(any(SystemIntegrationRecord.class))).thenAnswer(invocation -> {
            SystemIntegrationRecord saved = invocation.getArgument(0);
            saved.setStatus(IntegrationStatus.SUCCESS);
            return saved;
        });
        schedulingService.processPendingIntegrations();
        verify(repository, times(4)).save(any());
    }

    @Test
    void processPendingIntegrations_shouldHandleEmptyPendingList() {
        when(repository.findByStatus(IntegrationStatus.PENDING)).thenReturn(List.of());
        schedulingService.processPendingIntegrations();
        verify(repository, never()).save(any());
    }

    @Test
    void retryFailedIntegrations_shouldRetryWhenUnderLimit() {
        SystemIntegrationRecord record = new SystemIntegrationRecord();
        record.setId("failed-001");
        record.setStatus(IntegrationStatus.FAILED);
        record.setRetryCount(1);
        when(repository.findByStatus(IntegrationStatus.FAILED))
            .thenReturn(Arrays.asList(record));
        when(repository.save(any(SystemIntegrationRecord.class))).thenAnswer(invocation -> {
            SystemIntegrationRecord saved = invocation.getArgument(0);
            saved.setStatus(IntegrationStatus.RETRYING);
            return saved;
        });
        schedulingService.retryFailedIntegrations();
        verify(repository).save(any());
    }

    @Test
    void retryFailedIntegrations_shouldNotRetryWhenAtLimit() {
        SystemIntegrationRecord record = new SystemIntegrationRecord();
        record.setId("failed-001");
        record.setStatus(IntegrationStatus.FAILED);
        record.setRetryCount(3);
        when(repository.findByStatus(IntegrationStatus.FAILED))
            .thenReturn(Arrays.asList(record));
        schedulingService.retryFailedIntegrations();
        verify(repository, never()).save(any());
    }
}
