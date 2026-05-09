package com.taskscheduler.taskservice.dto.project;

import com.taskscheduler.taskservice.entity.enums.ProjectRole;
import jakarta.validation.constraints.NotNull;

public class UpdateMemberRoleRequest {
    @NotNull
    private ProjectRole role;

    public ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectRole role) {
        this.role = role;
    }
}
