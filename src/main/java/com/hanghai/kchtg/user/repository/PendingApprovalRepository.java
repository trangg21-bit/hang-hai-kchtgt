package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.PendingApproval;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho entity {@link PendingApproval}.
 */
public interface PendingApprovalRepository extends JpaRepository<PendingApproval, java.util.UUID> {

    /**
     * Tìm yêu cầu pending theo username.
     */
    Optional<PendingApproval> findByUsernameAndStatus(String username, String status);

    /**
     * Tìm danh sách phân trang theo trạng thái, sắp xếp theo created_at giảm.
     */
    @Query("SELECT pa FROM PendingApproval pa WHERE pa.status = :status ORDER BY pa.createdAt DESC")
    Page<PendingApproval> findByStatusOrderedByCreated(@Param("status") String status, Pageable pageable);

    /**
     * Tìm tất cả yêu cầu pending theo email (dùng cho guard, trả về danh sách đầy đủ).
     */
    List<PendingApproval> findByEmailAndStatus(String email, String status);
}
