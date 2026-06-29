package com.hanghai.kchtg.dataconnection.service;

import com.hanghai.kchtg.dataconnection.dto.*;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.enums.*;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
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
class DataConnectionServiceTest {

    @Mock
    private DataConnectionRepository repository;

    @Mock
    private EncryptionUtil encryptionUtil;

    @InjectMocks
    private DataConnectionService service;

    private UUID testId;
    private DataConnection sampleEntity;
    private CreateConnectionRequest createRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.of(2026, 6, 15, 10, 0);

        sampleEntity = new DataConnection();
        sampleEntity.setId(testId);
        sampleEntity.setName("Hệ thống hải quan");
        sampleEntity.setCode("DC-HQ");
        sampleEntity.setTargetSystem("Hải quan điện tử");
        sampleEntity.setConnectionType(ConnectionType.REST);
        sampleEntity.setEndpointUrl("https://api.customs.example.gov.vn");
        sampleEntity.setAuthType(AuthType.TOKEN);
        sampleEntity.setCredentials("ENCRYPTED_CREDS_12345");
        sampleEntity.setSyncFrequency(SyncFrequency.REALTIME);
        sampleEntity.setStatus(ConnectionStatus.ACTIVE);
        sampleEntity.setLastSyncAt(now);
        sampleEntity.setCreatedAt(now);
        sampleEntity.setUpdatedAt(now);

        createRequest = new CreateConnectionRequest();
        createRequest.setName("Hệ thống tài chính");
        createRequest.setCode("DC-FIN");
        createRequest.setTargetSystem("Hệ thống tài chính");
        createRequest.setConnectionType(ConnectionType.SOAP);
        createRequest.setEndpointUrl("https://finance.example.vn/api");
        createRequest.setAuthType(AuthType.BASIC);
        createRequest.setCredentials("user:pass123");
        createRequest.setSyncFrequency(SyncFrequency.DAILY);
    }

    // ── listAll ────────────────────────────────────────────────────────

    @Test
    void listAll_shouldReturnDecryptedResponses() {
        when(repository.findAll()).thenReturn(List.of(sampleEntity));
        when(encryptionUtil.decrypt("ENCRYPTED_CREDS_12345")).thenReturn("plain_credentials");

        List<ConnectionResponse> result = service.listAll();

        assertEquals(1, result.size());
        assertEquals("Hệ thống hải quan", result.get(0).getName());
        assertEquals(ConnectionType.REST, result.get(0).getConnectionType());
    }

    @Test
    void listAll_empty_shouldReturnEmptyList() {
        when(repository.findAll()).thenReturn(List.of());

        List<ConnectionResponse> result = service.listAll();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ── getById ────────────────────────────────────────────────────────

    @Test
    void getById_shouldReturnResponse() {
        when(repository.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(encryptionUtil.decrypt("ENCRYPTED_CREDS_12345")).thenReturn("plain_credentials");

        ConnectionResponse result = service.getById(testId);

        assertNotNull(result);
        assertEquals(testId, result.getId());
        assertEquals("DC-HQ", result.getCode());
        assertEquals(ConnectionStatus.ACTIVE, result.getStatus());
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
    }

    // ── create ─────────────────────────────────────────────────────────

    @Test
    void create_shouldEncryptCredentialsAndSave() {
        when(repository.existsByCode("DC-FIN")).thenReturn(false);
        when(encryptionUtil.encrypt("user:pass123")).thenReturn("ENC:new");
        when(repository.save(any(DataConnection.class))).thenAnswer(inv -> inv.getArgument(0));

        ConnectionResponse result = service.create(createRequest);

        assertNotNull(result);
        assertEquals("Hệ thống tài chính", result.getName());
        verify(repository).save(any(DataConnection.class));
    }

    @Test
    void create_shouldThrowWhenDuplicateCode() {
        when(repository.existsByCode("DC-FIN")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(createRequest));
    }

    // ── update ─────────────────────────────────────────────────────────

    @Test
    void update_shouldPartialUpdateFields() {
        UpdateConnectionRequest req = new UpdateConnectionRequest();
        req.setName("Updated name");
        req.setEndpointUrl("https://new.example.com");

        when(repository.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(encryptionUtil.encrypt(anyString())).thenReturn("ENC:new");
        when(repository.save(any(DataConnection.class))).thenReturn(sampleEntity);

        ConnectionResponse result = service.update(testId, req);

        assertEquals("Updated name", result.getName());
        verify(repository).save(any(DataConnection.class));
    }

    @Test
    void update_shouldThrowWhenNotFound() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> service.update(testId, new UpdateConnectionRequest()));
    }

    @Test
    void update_shouldThrowWhenCodeDuplicate() {
        sampleEntity.setCode("DC-OLD");
        when(repository.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(repository.existsByCode("DC-HQ")).thenReturn(true);

        UpdateConnectionRequest req = new UpdateConnectionRequest();
        req.setCode("DC-HQ");

        assertThrows(IllegalArgumentException.class,
                () -> service.update(testId, req));
    }

    // ── delete ─────────────────────────────────────────────────────────

    @Test
    void delete_shouldSoftDeleteEntity() {
        when(repository.existsById(testId)).thenReturn(true);
        when(repository.findById(testId)).thenReturn(Optional.of(sampleEntity));
        when(repository.save(any(DataConnection.class))).thenReturn(sampleEntity);

        assertDoesNotThrow(() -> service.delete(testId));

        assertNotNull(sampleEntity.getDeletedAt());
        verify(repository).save(sampleEntity);
    }

    @Test
    void delete_shouldThrowWhenNotFound() {
        when(repository.existsById(testId)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> service.delete(testId));
    }

    // ── testConnection ─────────────────────────────────────────────────

    @Test
    void testConnection_database_shouldReturnConfigOnly() {
        sampleEntity.setConnectionType(ConnectionType.DATABASE);
        when(repository.findById(testId)).thenReturn(Optional.of(sampleEntity));

        TestConnectionResponse result = service.testConnection(testId, new TestConnectionRequest());

        assertTrue(result.isSuccess());
        assertTrue(result.getMessage().contains("Configuration valid"));
    }

    @Test
    void testConnection_file_shouldReturnConfigOnly() {
        sampleEntity.setConnectionType(ConnectionType.FILE);
        when(repository.findById(testId)).thenReturn(Optional.of(sampleEntity));

        TestConnectionResponse result = service.testConnection(testId, new TestConnectionRequest());

        assertTrue(result.isSuccess());
        assertTrue(result.getMessage().contains("Configuration valid"));
    }

    @Test
    void testConnection_nullEndpoint_shouldFail() {
        sampleEntity.setEndpointUrl(null);
        when(repository.findById(testId)).thenReturn(Optional.of(sampleEntity));

        TestConnectionResponse result = service.testConnection(testId, new TestConnectionRequest());

        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("No endpoint URL configured"));
    }

    @Test
    void testConnection_overriddenEndpoint_shouldUseOverride() {
        when(repository.findById(testId)).thenReturn(Optional.of(sampleEntity));

        TestConnectionRequest overrides = new TestConnectionRequest();
        overrides.setEndpointUrl("https://invalid.example.com");

        TestConnectionResponse result = service.testConnection(testId, overrides);

        // URL is unreachable; result should show failure
        assertFalse(result.isSuccess());
    }

    @Test
    void testConnection_shouldThrowWhenNotFound() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> service.testConnection(testId, new TestConnectionRequest()));
    }

    // ── encryption round-trip ──────────────────────────────────────────

    @Test
    void create_shouldEncryptCredentials() {
        when(repository.existsByCode("DC-NEW")).thenReturn(false);
        when(encryptionUtil.encrypt("secret")).thenReturn("ENC:secret");

        DataConnection saved = new DataConnection();
        saved.setId(UUID.randomUUID());
        saved.setCode("DC-NEW");
        saved.setName("Test");
        saved.setTargetSystem("Test");
        saved.setConnectionType(ConnectionType.REST);
        saved.setAuthType(AuthType.NONE);
        saved.setSyncFrequency(SyncFrequency.MANUAL);
        saved.setCredentials("ENC:secret");
        saved.setStatus(ConnectionStatus.INACTIVE);
        when(repository.save(any(DataConnection.class))).thenReturn(saved);

        CreateConnectionRequest req = new CreateConnectionRequest();
        req.setName("Test");
        req.setCode("DC-NEW");
        req.setTargetSystem("Test");
        req.setConnectionType(ConnectionType.REST);
        req.setAuthType(AuthType.NONE);
        req.setSyncFrequency(SyncFrequency.MANUAL);
        req.setCredentials("secret");

        ConnectionResponse response = service.create(req);

        verify(encryptionUtil).encrypt("secret");
    }
}
