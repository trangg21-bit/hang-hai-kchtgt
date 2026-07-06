package com.hanghai.kchtg.admin.repository;

import com.hanghai.kchtg.admin.entity.AdminAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface AdminAccountRepository extends JpaRepository<AdminAccount, UUID> {

    @Query("SELECT a FROM AdminAccount a JOIN FETCH a.user")
    List<AdminAccount> findAllWithUser();

    Optional<AdminAccount> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}