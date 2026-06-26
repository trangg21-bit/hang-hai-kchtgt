package com.hanghai.kchtg.datasharing.repository;

import com.hanghai.kchtg.datasharing.entity.ShareDataType;
import com.hanghai.kchtg.datasharing.entity.ShareStatus;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SharedDataRepository extends JpaRepository<SharedData, Long> {

    Optional<SharedData> findByCode(String code);

    List<SharedData> findByDataType(ShareDataType dataType);

    Page<SharedData> findByShareStatus(ShareStatus status, Pageable pageable);

    List<SharedData> findBySharedWith(String sharedWith);

    @Query("SELECT s FROM SharedData s WHERE s.dataType = :type AND s.shareStatus = :status")
    List<SharedData> findByTypeAndStatus(@Param("type") ShareDataType type, @Param("status") ShareStatus status);

    @Query("SELECT COUNT(s) FROM SharedData s WHERE s.shareStatus = :status")
    Long countByStatus(@Param("status") ShareStatus status);
}
