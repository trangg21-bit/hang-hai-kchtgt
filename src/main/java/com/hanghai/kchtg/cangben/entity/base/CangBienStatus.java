package com.hanghai.kchtg.cangben.entity.base;

/**
 * State enum for all port-asset entities (CangBien, BenCang, CauCang, CangCan, VungNuoc).
 *
 * State machine:
 *   CREATE / UPDATE â†’ PENDING
 *   APPROVE (PENDING) â†’ Hien_Hanh
 *   REJECT (PENDING) â†’ Chinh_Sua
 *   UPDATE (Hien_Hanh or Chinh_Sua) â†’ PENDING
 *   SOFT_DELETE â†’ DA_XOA (terminal)
 */
public enum CangBienStatus {
    PENDING,
    HIEN_HANH,
    CHINH_SUA,
    DA_XOA
}
