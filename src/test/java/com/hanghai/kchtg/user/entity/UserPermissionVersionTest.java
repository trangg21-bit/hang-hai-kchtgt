package com.hanghai.kchtg.user.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserPermissionVersionTest {

    @Test
    void permissionVersion_initialValue_shouldBeZero() {
        User user = new User();
        assertEquals(0, user.getPermissionVersion(), "Default value should be 0");
    }

    @Test
    void permissionVersion_increment_shouldIncreaseByOne() {
        User user = new User();
        user.incrementPermissionVersion();
        assertEquals(1, user.getPermissionVersion());
        
        user.incrementPermissionVersion();
        assertEquals(2, user.getPermissionVersion());
    }

    @Test
    void permissionVersion_incrementFromExistingValue() {
        User user = new User();
        user.setPermissionVersion(5);
        user.incrementPermissionVersion();
        assertEquals(6, user.getPermissionVersion());
    }
}
