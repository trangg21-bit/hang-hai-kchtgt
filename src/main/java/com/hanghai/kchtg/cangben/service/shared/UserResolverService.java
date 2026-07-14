package com.hanghai.kchtg.cangben.service.shared;

import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserResolverService {

    private final UserRepository userRepository;

    public String resolveName(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return "SYSTEM";
        }
        try {
            UUID userUuid = UUID.fromString(userId);
            return userRepository.findById(userUuid)
                    .map(u -> u.getFullName() != null && !u.getFullName().trim().isEmpty() ? u.getFullName() : u.getUsername())
                    .orElse(userId);
        } catch (IllegalArgumentException e) {
            return userId;
        }
    }
}
