package com.hanghai.kchtg.common.repository;

import com.hanghai.kchtg.common.entity.OperatingUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperatingUnitRepository extends JpaRepository<OperatingUnit, UUID> {

    Optional<OperatingUnit> findByCode(String code);

    @Query("SELECT o FROM OperatingUnit o ORDER BY o.name ASC")
    List<OperatingUnit> findAllActive();

    @Query("SELECT o FROM OperatingUnit o WHERE "
            + "(LOWER(o.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(o.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
            + "ORDER BY o.name ASC")
    List<OperatingUnit> searchActive(String keyword);
}
