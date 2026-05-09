package com.taskscheduler.taskservice.service;

import com.taskscheduler.taskservice.dto.UserDTO;
import com.taskscheduler.taskservice.dto.task.CreateProjectTaskRequest;
import com.taskscheduler.taskservice.dto.task.ProjectTaskResponse;
import com.taskscheduler.taskservice.dto.task.UpdateProjectTaskRequest;
import com.taskscheduler.taskservice.entity.Project;
import com.taskscheduler.taskservice.entity.ProjectTask;
import com.taskscheduler.taskservice.entity.enums.ProjectRole;
import com.taskscheduler.taskservice.repository.ProjectMemberRepository;
import com.taskscheduler.taskservice.repository.ProjectTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectTaskManagementService {

    @Autowired
    private ProjectAccessService projectAccessService;

    @Autowired
    private ProjectTaskRepository projectTaskRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserService userService;

    public List<ProjectTaskResponse> getProjectTasks(Long projectId, UserDTO currentUser, String authHeader) {
        projectAccessService.ensureMemberAndGetRole(projectId, currentUser.getId());
        return projectTaskRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(task -> toResponse(task, authHeader))
                .collect(Collectors.toList());
    }

    public ProjectTaskResponse createTask(Long projectId, CreateProjectTaskRequest request, UserDTO currentUser, String authHeader) {
        projectAccessService.ensureMemberAndGetRole(projectId, currentUser.getId());
        Project project = projectAccessService.getProjectOrThrow(projectId);

        validateAssigneeIfPresent(projectId, request.getAssignedUserId(), authHeader);

        ProjectTask task = new ProjectTask();
        task.setProject(project);
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setStatus(request.getStatus() == null ? task.getStatus() : request.getStatus());
        task.setDueDate(request.getDueDate());
        task.setAssignedUserId(request.getAssignedUserId());
        task.setCreatedByUserId(currentUser.getId());

        return toResponse(projectTaskRepository.save(task), authHeader);
    }

    public ProjectTaskResponse updateTask(Long projectId, Long taskId, UpdateProjectTaskRequest request, UserDTO currentUser, String authHeader) {
        ProjectRole role = projectAccessService.ensureMemberAndGetRole(projectId, currentUser.getId());
        ProjectTask task = getProjectTaskOrThrow(projectId, taskId);

        boolean isAdmin = role == ProjectRole.ADMIN;
        boolean isCreator = currentUser.getId().equals(task.getCreatedByUserId());
        boolean isAssignee = task.getAssignedUserId() != null && currentUser.getId().equals(task.getAssignedUserId());

        if (!isAdmin && !isCreator && !isAssignee) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to update this task");
        }

        if (!isAdmin && request.getAssignedUserId() != null && !request.getAssignedUserId().equals(task.getAssignedUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can reassign task");
        }

        validateAssigneeIfPresent(projectId, request.getAssignedUserId(), authHeader);

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setStatus(request.getStatus());
        task.setDueDate(request.getDueDate());
        if (isAdmin) {
            task.setAssignedUserId(request.getAssignedUserId());
        }

        return toResponse(projectTaskRepository.save(task), authHeader);
    }

    public void deleteTask(Long projectId, Long taskId, UserDTO currentUser) {
        ProjectRole role = projectAccessService.ensureMemberAndGetRole(projectId, currentUser.getId());
        ProjectTask task = getProjectTaskOrThrow(projectId, taskId);

        boolean isAdmin = role == ProjectRole.ADMIN;
        boolean isCreator = currentUser.getId().equals(task.getCreatedByUserId());
        if (!isAdmin && !isCreator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins or task creator can delete task");
        }

        projectTaskRepository.delete(task);
    }

    private ProjectTask getProjectTaskOrThrow(Long projectId, Long taskId) {
        ProjectTask task = projectTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        if (!task.getProject().getId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found in project");
        }
        return task;
    }

    private void validateAssigneeIfPresent(Long projectId, Long assignedUserId, String authHeader) {
        if (assignedUserId == null) {
            return;
        }
        userService.getUserById(assignedUserId, authHeader);
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, assignedUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignee must be a member of this project");
        }
    }

    private ProjectTaskResponse toResponse(ProjectTask task, String authHeader) {
        ProjectTaskResponse response = new ProjectTaskResponse();
        response.setId(task.getId());
        response.setProjectId(task.getProject().getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setStatus(task.getStatus());
        response.setPriority(task.getPriority());
        response.setDueDate(task.getDueDate());
        response.setAssignedUserId(task.getAssignedUserId());
        response.setCreatedByUserId(task.getCreatedByUserId());
        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());

        if (task.getAssignedUserId() != null) {
            try {
                UserDTO user = userService.getUserById(task.getAssignedUserId(), authHeader);
                response.setAssignedUserName(user.getName());
            } catch (Exception ignored) {
                response.setAssignedUserName("Unknown");
            }
        }
        return response;
    }
}
