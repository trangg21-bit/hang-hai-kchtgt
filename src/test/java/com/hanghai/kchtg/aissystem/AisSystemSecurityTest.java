package com.hanghai.kchtg.aissystem;

import com.hanghai.kchtg.security.PermissionAuthorizationManager;
import com.hanghai.kchtg.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AisSystemSecurityTest {

    @Autowired
    private PermissionAuthorizationManager auth;


    @Test
    void testAuthCheck() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("admin");
        var authentication = new UsernamePasswordAuthenticationToken(user, null,
                List.of(new SimpleGrantedAuthority("aissystem:read"), new SimpleGrantedAuthority("aissystem:history")));

        boolean checkRead = auth.check(authentication, "aissystem:read");
        assertTrue(checkRead);

        boolean checkAny = auth.checkAny(authentication, "aissystem:read", "aissystem:history");
        assertTrue(checkAny);
    }
}
