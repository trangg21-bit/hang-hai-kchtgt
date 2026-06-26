package com.hanghai.kchtg.admin.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admin_accounts")
@Getter
@Setter
@NoArgsConstructor
public class AdminAccount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AdminRole role;

    @ElementCollection
    @CollectionTable(name = "admin_account_modules",
            joinColumns = @JoinColumn(name = "admin_account_id"))
    @Column(name = "module")
    private List<String> modules = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AdminStatus status = AdminStatus.ACTIVE;
}
