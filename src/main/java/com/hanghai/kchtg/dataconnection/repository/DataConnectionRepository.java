package com.hanghai.kchtg.dataconnection.repository;

import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link DataConnection}.
 */
public interface DataConnectionRepository extends JpaRepository<DataConnection, UUID> {

    /**
     * Finds a connection by its unique business code.
     */
    Optional<DataConnection> findByCode(String code);

    /**
     * Checks if a code already exists (for uniqueness validation).
     */
    boolean existsByCode(String code);
}