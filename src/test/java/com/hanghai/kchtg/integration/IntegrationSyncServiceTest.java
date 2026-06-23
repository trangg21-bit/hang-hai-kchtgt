package com.hanghai.kchtg.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.integration.service.IntegrationSyncService;
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
class IntegrationSyncServiceTest {

    @Mock
    private DataConnectionRepository connectionRepository;

    @Mock
    private SyncLogRepository syncLogRepository;

    @Mock
    private PointObjectRepository pointRepository;

    @Mock
    private LineObjectRepository lineRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private IntegrationSyncService syncService;

    private UUID connectionId;
    private DataConnection connection;

    @BeforeEach
    void setUp() {
        connectionId = UUID.randomUUID();
        connection = new DataConnection();
        connection.setId(connectionId);
        connection.setName("Partner API");
        connection.setCode("PARTNER");
    }

    @Test
    @DisplayName("Should throw EntityNotFoundException when connection does not exist")
    void executeSync_connectionNotFound_throws() {
        when(connectionRepository.findById(connectionId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> syncService.executeSync(connectionId));
    }

    @Test
    @DisplayName("Should mark SyncLog as failed when URL is empty")
    void executeSync_emptyUrl_fails() {
        connection.setEndpointUrl("");
        when(connectionRepository.findById(connectionId)).thenReturn(Optional.of(connection));
        when(syncLogRepository.save(any(SyncLog.class))).thenAnswer(i -> i.getArgument(0));

        SyncLog result = syncService.executeSync(connectionId);

        assertNotNull(result);
        assertEquals(SyncLog.SyncStatus.FAILED, result.getStatus());
    }

    @Test
    @DisplayName("Should fail when endpoint is unreachable")
    void executeSync_unreachableEndpoint_fails() {
        connection.setEndpointUrl("http://non-existent-domain-xyz.com/api");
        when(connectionRepository.findById(connectionId)).thenReturn(Optional.of(connection));
        when(syncLogRepository.save(any(SyncLog.class))).thenAnswer(i -> i.getArgument(0));

        SyncLog result = syncService.executeSync(connectionId);

        assertNotNull(result);
        assertEquals(SyncLog.SyncStatus.FAILED, result.getStatus());
    }

    @Test
    @DisplayName("Should fail when URL scheme is disallowed (SSRF protection)")
    void executeSync_disallowedUrlScheme_fails() {
        connection.setEndpointUrl("file:///etc/passwd");
        when(connectionRepository.findById(connectionId)).thenReturn(Optional.of(connection));
        when(syncLogRepository.save(any(SyncLog.class))).thenAnswer(i -> i.getArgument(0));

        SyncLog result = syncService.executeSync(connectionId);

        assertNotNull(result);
        assertEquals(SyncLog.SyncStatus.FAILED, result.getStatus());
    }
}
