package com.taskscheduler.taskservice.dto.project;

import com.taskscheduler.taskservice.entity.enums.ProjectRole;

public class ProjectMemberResponse {
    private Long userId;
    private String name;
    private String email;
    private ProjectRole role;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectRole role) {
        this.role = role;
    }
}
