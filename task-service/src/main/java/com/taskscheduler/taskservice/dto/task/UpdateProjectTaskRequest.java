package com.taskscheduler.taskservice.dto.task;

import com.taskscheduler.taskservice.entity.enums.ProjectTaskPriority;
import com.taskscheduler.taskservice.entity.enums.ProjectTaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class UpdateProjectTaskRequest {
    @NotBlank
    @Size(min = 2, max = 140)
    private String title;

    @Size(max = 1000)
    private String description;

    @NotNull
    private ProjectTaskPriority priority;

    @NotNull
    private ProjectTaskStatus status;

    private LocalDate dueDate;

    private Long assignedUserId;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ProjectTaskPriority getPriority() {
        return priority;
    }

    public void setPriority(ProjectTaskPriority priority) {
        this.priority = priority;
    }

    public ProjectTaskStatus getStatus() {
        return status;
    }

    public void setStatus(ProjectTaskStatus status) {
        this.status = status;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Long getAssignedUserId() {
        return assignedUserId;
    }

    public void setAssignedUserId(Long assignedUserId) {
        this.assignedUserId = assignedUserId;
    }
}
