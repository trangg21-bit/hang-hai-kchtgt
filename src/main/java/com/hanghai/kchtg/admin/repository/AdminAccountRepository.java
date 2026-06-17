package com.hanghai.kchtg.admin.repository;

import com.hanghai.kchtg.admin.entity.AdminAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminAccountRepository extends JpaRepository<AdminAccount, UUID> {

    Optional<AdminAccount> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}
