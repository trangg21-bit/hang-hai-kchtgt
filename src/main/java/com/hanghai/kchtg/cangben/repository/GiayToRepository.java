package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.GiayTo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity GiayTo (giấy tờ / tài liệu đính kèm).
 * Cung cấp các truy vấn để liệt kê, tìm kiếm và xóa mềm tài liệu đính kèm.
 */
@Repository
public interface GiayToRepository extends JpaRepository<GiayTo, UUID> {

    /**
     * Tìm tất cả tài liệu đính kèm cho một entity cụ thể.
     *
     * @param entityType loại entity (cang-bien, ben-cang, ...)
     * @param entityId   ID của entity (UUID string)
     * @return danh sách GiayTo
     */
    List<GiayTo> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);

    /**
     * Đếm số tài liệu đính kèm cho một entity.
     *
     * @param entityType loại entity
     * @param entityId   ID của entity
     * @return số lượng
     */
    long countByEntityTypeAndEntityId(String entityType, String entityId);

    /**
     * Xóa mềm tất cả tài liệu cho một entity (khi entity bị xóa).
     *
     * @param entityType loại entity
     * @param entityId   ID của entity
     */
    @Modifying
    @Query("UPDATE GiayTo g SET g.deletedAt = CURRENT_TIMESTAMP WHERE g.entityType = :entityType AND g.entityId = :entityId AND g.deletedAt IS NULL")
    void softDeleteByEntityTypeAndEntityId(@Param("entityType") String entityType,
                                           @Param("entityId") String entityId);
}
