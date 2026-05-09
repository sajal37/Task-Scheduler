package com.taskscheduler.taskservice.service;

import com.taskscheduler.taskservice.dto.UserDTO;
import com.taskscheduler.taskservice.dto.dashboard.DashboardResponse;
import com.taskscheduler.taskservice.entity.Project;
import com.taskscheduler.taskservice.entity.ProjectMember;
import com.taskscheduler.taskservice.entity.enums.ProjectTaskStatus;
import com.taskscheduler.taskservice.repository.ProjectMemberRepository;
import com.taskscheduler.taskservice.repository.ProjectTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private ProjectTaskRepository projectTaskRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    public DashboardResponse getDashboard(UserDTO currentUser) {
        DashboardResponse response = new DashboardResponse();

        long totalAssigned = projectTaskRepository.countByAssignedUserId(currentUser.getId());
        long todo = projectTaskRepository.countByAssignedUserIdAndStatus(currentUser.getId(), ProjectTaskStatus.TODO);
        long inProgress = projectTaskRepository.countByAssignedUserIdAndStatus(currentUser.getId(), ProjectTaskStatus.IN_PROGRESS);
        long done = projectTaskRepository.countByAssignedUserIdAndStatus(currentUser.getId(), ProjectTaskStatus.DONE);
        long overdue = projectTaskRepository.countOverdueByAssignedUserId(currentUser.getId(), LocalDate.now());

        response.setTotalAssignedTasks(totalAssigned);
        response.setTodoTasks(todo);
        response.setInProgressTasks(inProgress);
        response.setDoneTasks(done);
        response.setOverdueTasks(overdue);
        response.setProjectProgress(getProjectProgress(currentUser));
        return response;
    }

    private List<DashboardResponse.ProjectProgress> getProjectProgress(UserDTO currentUser) {
        List<ProjectMember> memberships = projectMemberRepository.findByUserId(currentUser.getId());
        Map<Long, Project> dedup = new LinkedHashMap<>();
        for (ProjectMember membership : memberships) {
            dedup.put(membership.getProject().getId(), membership.getProject());
        }

        return dedup.values().stream().map(project -> {
            DashboardResponse.ProjectProgress progress = new DashboardResponse.ProjectProgress();
            long total = projectTaskRepository.countByProjectId(project.getId());
            long completed = projectTaskRepository.countByProjectIdAndStatus(project.getId(), ProjectTaskStatus.DONE);
            progress.setProjectId(project.getId());
            progress.setProjectName(project.getName());
            progress.setTotalTasks(total);
            progress.setCompletedTasks(completed);
            return progress;
        }).collect(Collectors.toList());
    }
}
