package com.hanghai.kchtg.group.converter;

import com.hanghai.kchtg.group.entity.GroupMemberRole;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GroupMemberRoleConverter implements AttributeConverter<GroupMemberRole, Short> {

    @Override
    public Short convertToDatabaseColumn(GroupMemberRole role) {
        if (role == null) {
            return null;
        }
        return (short) role.ordinal();
    }

    @Override
    public GroupMemberRole convertToEntityAttribute(Short dbData) {
        if (dbData == null) {
            return null;
        }
        for (GroupMemberRole role : GroupMemberRole.values()) {
            if (role.ordinal() == dbData) {
                return role;
            }
        }
        return GroupMemberRole.MEMBER; // fallback
    }
}
