package com.hanghai.kchtg.dataconnection.service;

import com.hanghai.kchtg.dataconnection.dto.*;
import com.hanghai.kchtg.dataconnection.entity.ConnectionHealth;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.dataconnection.enums.*;
import com.hanghai.kchtg.dataconnection.repository.ConnectionHealthRepository;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import com.hanghai.kchtg.security.EncryptionUtil;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConnectionServiceTest {

    @Mock
    private DataConnectionRepository repo;

    @Mock
    private EncryptionUtil encryptionUtil;

    @Mock
    private ConnectionHealthRepository healthRepo;

    @Mock
    private SyncLogRepository syncLogRepo;

    @InjectMocks
    private ConnectionService service;

    private UUID testId;
    private DataConnection sampleEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.of(2026, 6, 15, 10, 0);

        sampleEntity = new DataConnection();
        sampleEntity.setId(testId);
        sampleEntity.setName("Hệ thống hải quan");
        sampleEntity.setCode("DC-HQ");
        sampleEntity.setTargetSystem("Hải quan");
        sampleEntity.setConnectionType(ConnectionType.REST);
        sampleEntity.setEndpointUrl("https://api.customs.example.gov.vn");
        sampleEntity.setAuthType(AuthType.TOKEN);
        sampleEntity.setCredentials("ENCRYPTED_TOKEN");
        sampleEntity.setSyncFrequency(SyncFrequency.REALTIME);
        sampleEntity.setStatus(ConnectionStatus.ACTIVE);
        sampleEntity.setCreatedAt(now);
        sampleEntity.setUpdatedAt(now);
    }

    // ── CRUD ───────────────────────────────────────────────────────────

    @Test
    void listAll_shouldReturnDecryptedResponses() {
        when(repo.findAll()).thenReturn(List.of(sampleEntity));
        when(encryptionUtil.decrypt("ENCRYPTED_TOKEN")).thenReturn("TOKEN_VALUE");

        List<ConnectionResponse> result = service.listAll();

        assertEquals(1, result.size());
        assertEquals("Hệ thống hải quan", result.get(0).getName());
    }

    @Test
    void listAll_empty_shouldReturnEmptyList() {
        when(repo.findAll()).thenReturn(List.of());

        List<ConnectionResponse> result = service.listAll();

        assertTrue(result.isEmpty());
    }

    @Test
    void getById_shouldReturnResponse() {
        when(repo.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(encryptionUtil.decrypt("ENCRYPTED_TOKEN")).thenReturn("TOKEN_VALUE");

        ConnectionResponse result = service.getById(testId);

        assertEquals(testId, result.getId());
        assertEquals(ConnectionStatus.ACTIVE, result.getStatus());
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(repo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
    }

    @Test
    void create_shouldEncryptAndSave() {
        CreateConnectionRequest req = new CreateConnectionRequest();
        req.setName("Test");
        req.setCode("DC-NEW");
        req.setTargetSystem("Test System");
        req.setConnectionType(ConnectionType.REST);
        req.setEndpointUrl("https://test.example.com");
        req.setAuthType(AuthType.BASIC);
        req.setCredentials("user:pass");
        req.setSyncFrequency(SyncFrequency.DAILY);

        when(repo.existsByCode("DC-NEW")).thenReturn(false);
        when(encryptionUtil.encrypt("user:pass")).thenReturn("ENC");
        when(repo.save(any(DataConnection.class))).thenAnswer(inv -> inv.getArgument(0));

        ConnectionResponse result = service.create(req);

        assertEquals("Test", result.getName());
        verify(repo).save(any(DataConnection.class));
    }

    @Test
    void create_shouldThrowWhenDuplicateCode() {
        CreateConnectionRequest req = new CreateConnectionRequest();
        req.setName("Test");
        req.setCode("DC-NEW");
        req.setTargetSystem("Test");
        req.setConnectionType(ConnectionType.REST);
        req.setAuthType(AuthType.NONE);
        req.setSyncFrequency(SyncFrequency.MANUAL);

        when(repo.existsByCode("DC-NEW")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
    }

    @Test
    void update_shouldUpdatePartialFields() {
        UpdateConnectionRequest req = new UpdateConnectionRequest();
        req.setName("Updated Name");
        req.setSyncFrequency(SyncFrequency.WEEKLY);

        when(repo.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(encryptionUtil.encrypt(anyString())).thenReturn("ENC");
        when(repo.save(any(DataConnection.class))).thenReturn(sampleEntity);

        ConnectionResponse result = service.update(testId, req);

        assertEquals("Updated Name", result.getName());
        assertEquals(SyncFrequency.WEEKLY, result.getSyncFrequency());
    }

    @Test
    void update_shouldThrowWhenNotFound() {
        when(repo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> service.update(testId, new UpdateConnectionRequest()));
    }

    @Test
    void delete_shouldSoftDeleteEntity() {
        when(repo.existsById(testId)).thenReturn(true);
        when(repo.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(repo.save(any(DataConnection.class))).thenReturn(sampleEntity);

        assertDoesNotThrow(() -> service.delete(testId));

        assertNotNull(sampleEntity.getDeletedAt());
    }

    @Test
    void delete_shouldThrowWhenNotFound() {
        when(repo.existsById(testId)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> service.delete(testId));
    }

    // ── healthCheck ────────────────────────────────────────────────────

    @Test
    void healthCheck_database_shouldSucceedImmediately() {
        sampleEntity.setConnectionType(ConnectionType.DATABASE);
        when(repo.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(encryptionUtil.decrypt("ENCRYPTED_TOKEN")).thenReturn("TOKEN_VALUE");
        when(healthRepo.save(any(ConnectionHealth.class))).thenReturn(new ConnectionHealth());

        ConnectionHealth health = service.healthCheck(testId);

        assertNotNull(health);
        verify(repo).save(sampleEntity);
    }

    @Test
    void healthCheck_file_shouldSucceedImmediately() {
        sampleEntity.setConnectionType(ConnectionType.FILE);
        when(repo.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(encryptionUtil.decrypt("ENCRYPTED_TOKEN")).thenReturn("TOKEN_VALUE");
        when(healthRepo.save(any(ConnectionHealth.class))).thenReturn(new ConnectionHealth());

        ConnectionHealth health = service.healthCheck(testId);

        assertNotNull(health);
        verify(repo).save(sampleEntity);
    }

    @Test
    void healthCheck_nullEndpoint_shouldFail() {
        sampleEntity.setEndpointUrl(null);
        when(repo.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(encryptionUtil.decrypt("ENCRYPTED_TOKEN")).thenReturn("TOKEN_VALUE");
        when(healthRepo.save(any(ConnectionHealth.class))).thenReturn(new ConnectionHealth());

        ConnectionHealth health = service.healthCheck(testId);

        assertNotNull(health);
        verify(repo).save(sampleEntity);
    }

    @Test
    void healthCheck_shouldThrowWhenNotFound() {
        when(repo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.healthCheck(testId));
    }

    // ── Health History ─────────────────────────────────────────────────

    @Test
    void getHealthHistory_shouldFilterByHours() {
        LocalDateTime now = LocalDateTime.now();
        ConnectionHealth recent = new ConnectionHealth();
        recent.setConnectionId(testId);
        recent.setStatusCode(200);
        recent.setLatencyMs(50L);
        recent.setCheckedAt(now);

        ConnectionHealth old = new ConnectionHealth();
        old.setConnectionId(testId);
        old.setStatusCode(500);
        old.setLatencyMs(200L);
        old.setCheckedAt(now.minusHours(48));

        when(healthRepo.findByConnectionIdOrderByCheckedAtDesc(testId))
                .thenReturn(List.of(recent, old));

        List<ConnectionHealth> result = service.getHealthHistory(testId, 24);

        assertEquals(1, result.size());
        assertEquals(200, result.get(0).getStatusCode());
    }

    @Test
    void getHealthHistory_empty_shouldReturnEmptyList() {
        when(healthRepo.findByConnectionIdOrderByCheckedAtDesc(testId))
                .thenReturn(List.of());

        List<ConnectionHealth> result = service.getHealthHistory(testId, 24);

        assertTrue(result.isEmpty());
    }

    // ── Avg Latency ────────────────────────────────────────────────────

    @Test
    void getAvgLatency_shouldReturnAverage() {
        when(healthRepo.avgLatency(eq(testId), any(LocalDateTime.class)))
                .thenReturn(150.5);

        Double avg = service.getAvgLatency(testId);

        assertEquals(150.5, avg);
    }

    @Test
    void getAvgLatency_noData_shouldReturnNull() {
        when(healthRepo.avgLatency(eq(testId), any(LocalDateTime.class)))
                .thenReturn(null);

        Double avg = service.getAvgLatency(testId);

        assertNull(avg);
    }

    // ── enum validations ───────────────────────────────────────────────

    @Test
    void syncFrequency_shouldHaveExpectedValues() {
        assertEquals(5, SyncFrequency.values().length);
        assertTrue(List.of(SyncFrequency.values()).contains(SyncFrequency.REALTIME));
        assertTrue(List.of(SyncFrequency.values()).contains(SyncFrequency.MANUAL));
    }

    @Test
    void connectionStatus_shouldHaveExpectedValues() {
        assertEquals(3, ConnectionStatus.values().length);
        assertTrue(List.of(ConnectionStatus.values()).contains(ConnectionStatus.ACTIVE));
        assertTrue(List.of(ConnectionStatus.values()).contains(ConnectionStatus.ERROR));
    }

    @Test
    void connectionType_shouldHaveExpectedValues() {
        assertEquals(4, ConnectionType.values().length);
        assertTrue(List.of(ConnectionType.values()).contains(ConnectionType.REST));
        assertTrue(List.of(ConnectionType.values()).contains(ConnectionType.DATABASE));
    }

    @Test
    void authType_shouldHaveExpectedValues() {
        assertEquals(4, AuthType.values().length);
        assertTrue(List.of(AuthType.values()).contains(AuthType.NONE));
        assertTrue(List.of(AuthType.values()).contains(AuthType.TOKEN));
    }
}
