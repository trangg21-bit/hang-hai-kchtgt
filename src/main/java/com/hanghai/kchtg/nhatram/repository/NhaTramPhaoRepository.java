package com.hanghai.kchtg.nhatram.repository;

import com.hanghai.kchtg.nhatram.entity.BuoyType;
import com.hanghai.kchtg.nhatram.entity.NhaTramPhao;
import com.hanghai.kchtg.nhatram.entity.NhaTramStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface NhaTramPhaoRepository extends JpaRepository<NhaTramPhao, UUID> {
       boolean existsByCode(String code);

       @Query("SELECT p FROM NhaTramPhao p WHERE " +
                     "(cast(:name as string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND "
                     +
                     "(cast(:code as string) IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND "
                     +
                     "(:type IS NULL OR p.type = :type) AND " +
                     "(:status IS NULL OR p.status = :status)")
       List<NhaTramPhao> searchFiltered(
                     @Param("name") String name,
                     @Param("code") String code,
                     @Param("type") BuoyType type,
                     @Param("status") NhaTramStatus status);
}
