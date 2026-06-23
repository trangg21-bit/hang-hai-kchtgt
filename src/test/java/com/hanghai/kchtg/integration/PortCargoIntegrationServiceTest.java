package com.hanghai.kchtg.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.integration.entity.IntegrationSyncJob;
import com.hanghai.kchtg.integration.repository.IntegrationDlqRepository;
import com.hanghai.kchtg.integration.repository.IntegrationSyncJobRepository;
import com.hanghai.kchtg.integration.service.PortCargoIntegrationService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortCargoIntegrationServiceTest {

    @Mock
    private DataConnectionRepository connectionRepository;

    @Mock
    private IntegrationSyncJobRepository syncJobRepository;

    @Mock
    private IntegrationDlqRepository dlqRepository;

    @Mock
    private PointObjectRepository pointRepository;

    @Mock
    private LineObjectRepository lineRepository;

    @Mock
    private PolygonObjectRepository polygonRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PortCargoIntegrationService integrationService;

    private UUID connectionId;
    private DataConnection connection;
    private UUID jobId;
    private IntegrationSyncJob job;

    @BeforeEach
    void setUp() {
        connectionId = UUID.randomUUID();
        connection = new DataConnection();
        connection.setId(connectionId);
        connection.setName("Maritime Connection");
        connection.setCode("F-227");

        jobId = UUID.randomUUID();
        job = IntegrationSyncJob.builder()
                .featureCode("F-227")
                .sourceUrl("http://localhost/api/sync")
                .status(IntegrationSyncJob.SyncStatus.FAILED)
                .retryCount(0)
                .build();
        job.setId(jobId);
    }

    @Test
    @DisplayName("Should throw EntityNotFoundException when connection is not found")
    void executeSync_connectionNotFound_throws() {
        when(connectionRepository.findById(connectionId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> integrationService.executeSync("F-227", connectionId));
    }

    @Test
    @DisplayName("Should fail sync job when URL is empty")
    void executeSync_emptyUrl_fails() {
        connection.setEndpointUrl("");
        when(connectionRepository.findById(connectionId)).thenReturn(Optional.of(connection));
        when(syncJobRepository.save(any(IntegrationSyncJob.class))).thenAnswer(i -> i.getArgument(0));

        IntegrationSyncJob result = integrationService.executeSync("F-227", connectionId);

        assertNotNull(result);
        assertEquals(IntegrationSyncJob.SyncStatus.FAILED, result.getStatus());
        assertEquals("Endpoint URL is empty", result.getErrorMessage());
    }

    @Test
    @DisplayName("Should fail sync job when URL has disallowed scheme (SSRF check)")
    void executeSync_disallowedUrlScheme_fails() {
        connection.setEndpointUrl("file:///etc/passwd");
        when(connectionRepository.findById(connectionId)).thenReturn(Optional.of(connection));
        when(syncJobRepository.save(any(IntegrationSyncJob.class))).thenAnswer(i -> i.getArgument(0));

        IntegrationSyncJob result = integrationService.executeSync("F-227", connectionId);

        assertNotNull(result);
        assertEquals(IntegrationSyncJob.SyncStatus.FAILED, result.getStatus());
        assertTrue(result.getErrorMessage().contains("URL scheme not allowed"));
    }

    @Test
    @DisplayName("Should throw EntityNotFoundException when retrying a non-existent job")
    void retrySyncJob_jobNotFound_throws() {
        when(syncJobRepository.findById(jobId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> integrationService.retrySyncJob(jobId));
    }

    @Test
    @DisplayName("Should throw IllegalStateException when retry limit is reached")
    void retrySyncJob_maxRetryReached_throws() {
        job.setRetryCount(3);
        when(syncJobRepository.findById(jobId)).thenReturn(Optional.of(job));

        assertThrows(IllegalStateException.class, () -> integrationService.retrySyncJob(jobId));
    }

    @Test
    @DisplayName("Should increment retryCount when retrying a job")
    void retrySyncJob_incrementRetryCount() {
        job.setRetryCount(1);
        job.setSourceUrl("file:///invalid-scheme"); // to trigger fast fail
        when(syncJobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(syncJobRepository.save(any(IntegrationSyncJob.class))).thenAnswer(i -> i.getArgument(0));

        IntegrationSyncJob result = integrationService.retrySyncJob(jobId);

        assertNotNull(result);
        assertEquals(2, result.getRetryCount());
        assertEquals(IntegrationSyncJob.SyncStatus.FAILED, result.getStatus());
    }
}
