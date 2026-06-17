package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link User}.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * TĂ¬m ngÆ°á»i dĂ¹ng theo tĂªn Ä‘Äƒng nháº­p.
     */
    Optional<User> findByUsername(String username);

    /**
     * TĂ¬m ngÆ°á»i dĂ¹ng theo email.
     */
    Optional<User> findByEmail(String email);

    /**
     * Kiá»ƒm tra tá»“n táº¡i tĂªn Ä‘Äƒng nháº­p.
     */
    boolean existsByUsername(String username);

    /**
     * Kiá»ƒm tra tá»“n táº¡i email.
     */
    boolean existsByEmail(String email);

    /**
     * TĂ¬m táº¥t cáº£ ngÆ°á»i dĂ¹ng vá»›i JOIN FETCH Ä‘á»ƒ trĂ¡nh LazyInitializationException.
     * VĂ¬ {@code spring.jpa.open-in-view=false}, lazy associations pháº£i
     * Ä‘Æ°á»£c fetch trong transaction.
     */
    @Query("SELECT DISTINCT u FROM User u "
         + "LEFT JOIN FETCH u.orgUnit "
         + "LEFT JOIN FETCH u.groups")
    List<User> findAllWithRelations();

    /**
     * TĂ¬m ngÆ°á»i dĂ¹ng theo ID vá»›i JOIN FETCH Ä‘á»ƒ trĂ¡nh LazyInitializationException.
     */
    @Query("SELECT u FROM User u "
         + "LEFT JOIN FETCH u.orgUnit "
         + "LEFT JOIN FETCH u.groups "
         + "WHERE u.id = :id")
    Optional<User> findByIdWithRelations(UUID id);

    /**
     * TĂ¬m ngÆ°á»i dĂ¹ng theo username vá»›i JOIN FETCH Ä‘á»ƒ trĂ¡nh LazyInitializationException.
     */
    @Query("SELECT u FROM User u "
         + "LEFT JOIN FETCH u.orgUnit "
         + "LEFT JOIN FETCH u.groups "
         + "WHERE u.username = :username")
    Optional<User> findByUsernameWithRelations(String username);
}
