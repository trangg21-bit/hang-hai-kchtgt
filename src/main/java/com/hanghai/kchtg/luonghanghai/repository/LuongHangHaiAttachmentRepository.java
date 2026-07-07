package com.hanghai.kchtg.luonghanghai.repository;

import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LuongHangHaiAttachmentRepository extends JpaRepository<LuongHangHaiAttachment, Long> {

    List<LuongHangHaiAttachment> findByLuongHangHaiId(Long luongHangHaiId);
}
