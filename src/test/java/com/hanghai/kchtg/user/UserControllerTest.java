package com.hanghai.kchtg.user;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.controller.UserController;
import com.hanghai.kchtg.user.dto.ChangeStatusRequest;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.dto.UserResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController controller;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setUsername("john");
        testUser.setEmail("john@example.com");
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setRole("ROLE_USER");
    }

    @Test
    void createUser_shouldReturn201() {
        var request = new CreateUserRequest();
        request.setUsername("john");
        request.setEmail("john@example.com");
        request.setPassword("Secure123!");

        when(userService.create(any())).thenReturn(testUser);

        ResponseEntity<ApiResponse<UserResponse>> response = controller.create(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(userService).create(any());
    }

    @Test
    void getUserById_shouldReturn200() {
        when(userService.findById(testUserId)).thenReturn(testUser);

        ResponseEntity<ApiResponse<UserResponse>> response = controller.getById(testUserId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void listUsers_shouldReturn200() {
        when(userService.findAll()).thenReturn(List.of(testUser));

        ResponseEntity<ApiResponse<List<UserResponse>>> response = controller.list();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void updateUser_shouldReturn200() {
        var request = new UpdateUserRequest();
        request.setEmail("john.new@example.com");

        when(userService.update(eq(testUserId), any())).thenReturn(testUser);

        ResponseEntity<ApiResponse<UserResponse>> response = controller.update(testUserId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void deleteUser_shouldReturn200() {
        ResponseEntity<ApiResponse<Void>> response = controller.delete(testUserId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).delete(testUserId);
    }

    @Test
    void changeStatus_shouldReturn200() {
        ChangeStatusRequest request = new ChangeStatusRequest();
        request.setStatus(UserStatus.LOCKED);

        when(userService.changeStatus(eq(testUserId), eq(UserStatus.LOCKED))).thenReturn(testUser);

        ResponseEntity<ApiResponse<UserResponse>> response = controller.changeStatus(testUserId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
}
