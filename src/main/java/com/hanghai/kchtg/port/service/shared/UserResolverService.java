package com.hanghai.kchtg.port.service.shared;

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

    public String resolveName(UUID userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .map(u -> (u.getFullName() != null && !u.getFullName().trim().isEmpty())
                        ? u.getFullName()
                        : u.getUsername())
                .orElse(userId.toString());
    }
}
