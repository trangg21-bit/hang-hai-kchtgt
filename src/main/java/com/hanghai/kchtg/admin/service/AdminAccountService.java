package com.hanghai.kchtg.admin.service;

import com.hanghai.kchtg.admin.dto.AdminResponse;
import com.hanghai.kchtg.admin.dto.CreateAdminRequest;
import com.hanghai.kchtg.admin.dto.UpdateAdminRequest;
import com.hanghai.kchtg.admin.entity.AdminAccount;
import com.hanghai.kchtg.admin.entity.AdminStatus;
import com.hanghai.kchtg.admin.repository.AdminAccountRepository;
import com.hanghai.kchtg.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAccountService {

    private final AdminAccountRepository repository;
    private final EntityManager entityManager;

    public List<AdminResponse> findAll() {
        return repository.findAll().stream()
                .map(AdminResponse::from)
                .toList();
    }

    public AdminResponse findById(UUID id) {
        AdminAccount entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AdminAccount not found: " + id));
        return AdminResponse.from(entity);
    }

    public AdminResponse findByUserId(UUID userId) {
        AdminAccount entity = repository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("AdminAccount not found for userId: " + userId));
        return AdminResponse.from(entity);
    }

    @Transactional
    public AdminResponse create(CreateAdminRequest request) {
        if (repository.existsByUserId(request.getUserId())) {
            throw new IllegalArgumentException("AdminAccount already exists for userId: " + request.getUserId());
        }

        User user = entityManager.getReference(User.class, request.getUserId());

        AdminAccount entity = new AdminAccount();
        entity.setUser(user);
        entity.setRole(request.getRole());
        entity.setModules(request.getModules() != null ? request.getModules() : List.of());
        entity.setStatus(request.getStatus() != null ? request.getStatus() : AdminStatus.ACTIVE);

        AdminAccount saved = repository.save(entity);
        return AdminResponse.from(saved);
    }

    @Transactional
    public AdminResponse update(UUID id, UpdateAdminRequest request) {
        AdminAccount entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AdminAccount not found: " + id));

        if (request.getRole() != null) {
            entity.setRole(request.getRole());
        }
        if (request.getModules() != null) {
            entity.setModules(request.getModules());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }

        AdminAccount saved = repository.save(entity);
        return AdminResponse.from(saved);
    }

    @Transactional
    public void delete(UUID id) {
        AdminAccount entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AdminAccount not found: " + id));
        repository.delete(entity);
    }
}
