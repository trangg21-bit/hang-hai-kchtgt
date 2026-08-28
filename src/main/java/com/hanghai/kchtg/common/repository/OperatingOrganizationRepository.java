package com.hanghai.kchtg.common.repository;

import com.hanghai.kchtg.common.entity.OperatingOrganization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperatingOrganizationRepository extends JpaRepository<OperatingOrganization, UUID> {

    Optional<OperatingOrganization> findByCode(String code);

    @Query("SELECT o FROM OperatingOrganization o ORDER BY o.name ASC")
    List<OperatingOrganization> findAllActive();

    @Query("SELECT o FROM OperatingOrganization o WHERE "
            + "(LOWER(o.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(o.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
            + "ORDER BY o.name ASC")
    List<OperatingOrganization> searchActive(String keyword);
}
