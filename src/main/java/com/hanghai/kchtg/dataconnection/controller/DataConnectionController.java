package com.hanghai.kchtg.dataconnection.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.dataconnection.dto.ConnectionResponse;
import com.hanghai.kchtg.dataconnection.dto.CreateConnectionRequest;
import com.hanghai.kchtg.dataconnection.dto.TestConnectionRequest;
import com.hanghai.kchtg.dataconnection.dto.TestConnectionResponse;
import com.hanghai.kchtg.dataconnection.dto.UpdateConnectionRequest;
import com.hanghai.kchtg.dataconnection.service.DataConnectionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for {@code /api/data-connections}.
 * <p>
 * Provides full CRUD plus a connectivity-test endpoint.
 * </p>
 */
@RestController
@RequestMapping("/api/data-connections")
public class DataConnectionController {

    private final DataConnectionService service;

    public DataConnectionController(DataConnectionService service) {
        this.service = service;
    }

    // Ă¢â€â‚¬Ă¢â€â‚¬ CRUD Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬

    /**
     * Lists all data connections.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> listAll() {
        List<ConnectionResponse> connections = service.listAll();
        return ResponseEntity.ok(ApiResponse.success(connections));
    }

    /**
     * Retrieves a single connection by its UUID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<ConnectionResponse>> getById(@PathVariable UUID id) {
        ConnectionResponse connection = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success(connection));
    }

    /**
     * Creates a new data connection.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<ConnectionResponse>> create(
            @Valid @RequestBody CreateConnectionRequest request) {
        ConnectionResponse connection = service.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Data connection created", connection));
    }

    /**
     * Updates (partial) an existing data connection.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<ConnectionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConnectionRequest request) {
        ConnectionResponse connection = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Data connection updated", connection));
    }

    /**
     * Deletes a data connection.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity
                .status(HttpStatus.NO_CONTENT)
                .body(ApiResponse.success("Data connection deleted", null));
    }

    // Ă¢â€â‚¬Ă¢â€â‚¬ Test Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬

    /**
     * Tests connectivity to the target system for the given connection.
     * Accepts optional overrides for endpoint URL and credentials.
     */
    @PostMapping("/{id}/test")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<TestConnectionResponse>> testConnection(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) TestConnectionRequest request) {
        TestConnectionRequest overrides = request != null ? request : new TestConnectionRequest();
        TestConnectionResponse result = service.testConnection(id, overrides);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
