package com.hanghai.kchtg.cangben.entity.base;

/**
 * State enum for all port-asset entities (CangBien, BenCang, CauCang, CangCan, VungNuoc).
 *
 * State machine:
 *   CREATE / UPDATE → CHO_PHE_DUYET
 *   APPROVE (CHO_PHE_DUYET) → Hien_Hanh
 *   REJECT (CHO_PHE_DUYET) → Chinh_Sua
 *   UPDATE (Hien_Hanh or Chinh_Sua) → CHO_PHE_DUYET
 *   SOFT_DELETE → DA_XOA (terminal)
 */
public enum CangBienStatus {
    CHO_PHE_DUYET,
    HIEN_HANH,
    CHINH_SUA,
    DA_XOA
}
