package com.hanghai.kchtg.businessintegration;

import com.hanghai.kchtg.businessintegration.entity.BusinessDataIntegrationRecord;
import com.hanghai.kchtg.businessintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.businessintegration.repository.BusinessDataIntegrationRecordRepository;
import com.hanghai.kchtg.businessintegration.service.BusinessDataSchedulingService;
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
class BusinessDataSchedulingServiceTest {

    @Mock
    private BusinessDataIntegrationRecordRepository repository;

    @InjectMocks
    private BusinessDataSchedulingService schedulingService;

    @Test
    void processPendingIntegrations_shouldProcessAllPending() {
        BusinessDataIntegrationRecord record1 = new BusinessDataIntegrationRecord();
        record1.setId("pending-001");
        record1.setStatus(IntegrationStatus.PENDING);
        BusinessDataIntegrationRecord record2 = new BusinessDataIntegrationRecord();
        record2.setId("pending-002");
        record2.setStatus(IntegrationStatus.PENDING);
        when(repository.findByStatus(IntegrationStatus.PENDING))
            .thenReturn(Arrays.asList(record1, record2));
        when(repository.save(any(BusinessDataIntegrationRecord.class))).thenAnswer(invocation -> {
            BusinessDataIntegrationRecord saved = invocation.getArgument(0);
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
        BusinessDataIntegrationRecord record = new BusinessDataIntegrationRecord();
        record.setId("failed-001");
        record.setStatus(IntegrationStatus.FAILED);
        record.setRetryCount(1);
        when(repository.findByStatus(IntegrationStatus.FAILED))
            .thenReturn(Arrays.asList(record));
        when(repository.save(any(BusinessDataIntegrationRecord.class))).thenAnswer(invocation -> {
            BusinessDataIntegrationRecord saved = invocation.getArgument(0);
            saved.setStatus(IntegrationStatus.RETRYING);
            return saved;
        });
        schedulingService.retryFailedIntegrations();
        verify(repository).save(any());
    }

    @Test
    void retryFailedIntegrations_shouldNotRetryWhenAtLimit() {
        BusinessDataIntegrationRecord record = new BusinessDataIntegrationRecord();
        record.setId("failed-001");
        record.setStatus(IntegrationStatus.FAILED);
        record.setRetryCount(3);
        when(repository.findByStatus(IntegrationStatus.FAILED))
            .thenReturn(Arrays.asList(record));
        schedulingService.retryFailedIntegrations();
        verify(repository, never()).save(any());
    }
}
