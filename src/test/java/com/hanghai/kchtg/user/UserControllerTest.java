package com.hanghai.kchtg.user;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.controller.UserController;
import com.hanghai.kchtg.user.service.UserService;
import com.hanghai.kchtg.common.exception.GlobalExceptionHandler;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController controller;

    @Test
    void createUser_shouldReturn201() {
        var request = new com.hanghai.kchtg.user.dto.CreateUserRequest();
        request.setUsername("john");
        request.setEmail("john@example.com");
        request.setPassword("Secure123!");

        when(userService.createUser(any())).thenReturn(new User());

        ResponseEntity<ApiResponse> response = controller.createUser(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(userService).createUser(any());
    }

    @Test
    void getUserById_shouldReturn200() {
        when(userService.getUserById(1L)).thenReturn(new User());

        ResponseEntity<ApiResponse> response = controller.getUserById(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void listUsers_shouldReturn200() {
        when(userService.listUsers(any())).thenReturn(new PageImpl<>(List.of(new User())));

        ResponseEntity<ApiResponse> response = controller.listUsers(0, 20, null, null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void updateUser_shouldReturn200() {
        var request = new com.hanghai.kchtg.user.dto.UpdateUserRequest();
        request.setEmail("john.new@example.com");

        when(userService.getUserById(1L)).thenReturn(new User());
        when(userService.updateUser(eq(1L), any())).thenReturn(new User());

        ResponseEntity<ApiResponse> response = controller.updateUser(1L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void deleteUser_shouldReturn200() {
        when(userService.deleteUser(1L)).thenReturn(new User());

        ResponseEntity<ApiResponse> response = controller.deleteUser(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void lockUser_shouldReturn200() {
        when(userService.lockUser(1L)).thenReturn(new User());

        ResponseEntity<ApiResponse> response = controller.lockUser(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void unlockUser_shouldReturn200() {
        when(userService.unlockUser(1L)).thenReturn(new User());

        ResponseEntity<ApiResponse> response = controller.unlockUser(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
