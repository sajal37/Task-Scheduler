package com.taskscheduler.taskservice.dto.dashboard;

import java.util.List;

public class DashboardResponse {
    private long totalAssignedTasks;
    private long todoTasks;
    private long inProgressTasks;
    private long doneTasks;
    private long overdueTasks;
    private List<ProjectProgress> projectProgress;

    public long getTotalAssignedTasks() {
        return totalAssignedTasks;
    }

    public void setTotalAssignedTasks(long totalAssignedTasks) {
        this.totalAssignedTasks = totalAssignedTasks;
    }

    public long getTodoTasks() {
        return todoTasks;
    }

    public void setTodoTasks(long todoTasks) {
        this.todoTasks = todoTasks;
    }

    public long getInProgressTasks() {
        return inProgressTasks;
    }

    public void setInProgressTasks(long inProgressTasks) {
        this.inProgressTasks = inProgressTasks;
    }

    public long getDoneTasks() {
        return doneTasks;
    }

    public void setDoneTasks(long doneTasks) {
        this.doneTasks = doneTasks;
    }

    public long getOverdueTasks() {
        return overdueTasks;
    }

    public void setOverdueTasks(long overdueTasks) {
        this.overdueTasks = overdueTasks;
    }

    public List<ProjectProgress> getProjectProgress() {
        return projectProgress;
    }

    public void setProjectProgress(List<ProjectProgress> projectProgress) {
        this.projectProgress = projectProgress;
    }

    public static class ProjectProgress {
        private Long projectId;
        private String projectName;
        private long totalTasks;
        private long completedTasks;

        public Long getProjectId() {
            return projectId;
        }

        public void setProjectId(Long projectId) {
            this.projectId = projectId;
        }

        public String getProjectName() {
            return projectName;
        }

        public void setProjectName(String projectName) {
            this.projectName = projectName;
        }

        public long getTotalTasks() {
            return totalTasks;
        }

        public void setTotalTasks(long totalTasks) {
            this.totalTasks = totalTasks;
        }

        public long getCompletedTasks() {
            return completedTasks;
        }

        public void setCompletedTasks(long completedTasks) {
            this.completedTasks = completedTasks;
        }
    }
}
