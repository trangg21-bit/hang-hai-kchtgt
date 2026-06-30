package com.hanghai.kchtg.cosuachua.repository;

import com.hanghai.kchtg.cosuachua.entity.CoSuaChuaDongTauAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoSuaChuaDongTauAttachmentRepository extends JpaRepository<CoSuaChuaDongTauAttachment, Long> {

    List<CoSuaChuaDongTauAttachment> findByCoSuaChuaDongTauId(Long coSuaChuaDongTauId);

    void deleteByCoSuaChuaDongTauId(Long coSuaChuaDongTauId);
}
