package com.taskscheduler.taskservice.service;

import com.taskscheduler.taskservice.dto.UserDTO;
import com.taskscheduler.taskservice.dto.project.*;
import com.taskscheduler.taskservice.entity.Project;
import com.taskscheduler.taskservice.entity.ProjectMember;
import com.taskscheduler.taskservice.entity.enums.ProjectRole;
import com.taskscheduler.taskservice.entity.enums.ProjectTaskStatus;
import com.taskscheduler.taskservice.repository.ProjectMemberRepository;
import com.taskscheduler.taskservice.repository.ProjectRepository;
import com.taskscheduler.taskservice.repository.ProjectTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProjectManagementService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private ProjectTaskRepository projectTaskRepository;

    @Autowired
    private ProjectAccessService projectAccessService;

    @Autowired
    private UserService userService;

    public ProjectResponse createProject(CreateProjectRequest request, UserDTO currentUser) {
        Project project = new Project();
        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project.setOwnerId(currentUser.getId());
        project = projectRepository.save(project);

        ProjectMember ownerMember = new ProjectMember();
        ownerMember.setProject(project);
        ownerMember.setUserId(currentUser.getId());
        ownerMember.setRole(ProjectRole.ADMIN);
        projectMemberRepository.save(ownerMember);

        return toProjectResponse(project, currentUser.getId(), null, false);
    }

    public List<ProjectResponse> getMyProjects(UserDTO currentUser) {
        List<ProjectMember> memberships = projectMemberRepository.findByUserId(currentUser.getId());

        Map<Long, Project> dedup = new LinkedHashMap<>();
        for (ProjectMember membership : memberships) {
            dedup.put(membership.getProject().getId(), membership.getProject());
        }

        return dedup.values().stream()
                .sorted(Comparator.comparing(Project::getUpdatedAt).reversed())
                .map(project -> toProjectResponse(project, currentUser.getId(), null, false))
                .collect(Collectors.toList());
    }

    public ProjectResponse getProject(Long projectId, UserDTO currentUser, String authHeader) {
        projectAccessService.getProjectOrThrow(projectId);
        projectAccessService.ensureMemberAndGetRole(projectId, currentUser.getId());
        return toProjectResponse(projectRepository.getReferenceById(projectId), currentUser.getId(), authHeader, true);
    }

    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request, UserDTO currentUser, String authHeader) {
        projectAccessService.ensureAdmin(projectId, currentUser.getId());
        Project project = projectAccessService.getProjectOrThrow(projectId);
        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project = projectRepository.save(project);
        return toProjectResponse(project, currentUser.getId(), authHeader, true);
    }

    public void deleteProject(Long projectId, UserDTO currentUser) {
        projectAccessService.ensureAdmin(projectId, currentUser.getId());
        projectAccessService.getProjectOrThrow(projectId);
        projectTaskRepository.deleteByProjectId(projectId);
        projectMemberRepository.deleteByProjectId(projectId);
        projectRepository.deleteById(projectId);
    }

    public ProjectMemberResponse addMember(Long projectId, AddMemberRequest request, UserDTO currentUser, String authHeader) {
        projectAccessService.ensureAdmin(projectId, currentUser.getId());
        Project project = projectAccessService.getProjectOrThrow(projectId);

        UserDTO targetUser = userService.getUserByEmail(request.getEmail().trim().toLowerCase(), authHeader);
        if (targetUser.getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner is already a member");
        }

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, targetUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is already a member");
        }

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUserId(targetUser.getId());
        member.setRole(ProjectRole.MEMBER);
        projectMemberRepository.save(member);

        ProjectMemberResponse response = new ProjectMemberResponse();
        response.setUserId(targetUser.getId());
        response.setName(targetUser.getName());
        response.setEmail(targetUser.getEmail());
        response.setRole(ProjectRole.MEMBER);
        return response;
    }

    public ProjectMemberResponse updateMemberRole(Long projectId, Long memberUserId, UpdateMemberRoleRequest request, UserDTO currentUser, String authHeader) {
        projectAccessService.ensureAdmin(projectId, currentUser.getId());

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, memberUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        if (member.getUserId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot change your own role");
        }

        member.setRole(request.getRole());
        projectMemberRepository.save(member);

        UserDTO user = userService.getUserById(memberUserId, authHeader);
        ProjectMemberResponse response = new ProjectMemberResponse();
        response.setUserId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(member.getRole());
        return response;
    }

    public void removeMember(Long projectId, Long memberUserId, UserDTO currentUser) {
        projectAccessService.ensureAdmin(projectId, currentUser.getId());

        if (memberUserId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot remove yourself");
        }

        boolean exists = projectMemberRepository.existsByProjectIdAndUserId(projectId, memberUserId);
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found");
        }

        projectMemberRepository.deleteByProjectIdAndUserId(projectId, memberUserId);
    }

    private ProjectResponse toProjectResponse(Project project, Long viewerId, String authHeader, boolean includeMembers) {
        ProjectRole role = projectMemberRepository.findByProjectIdAndUserId(project.getId(), viewerId)
                .map(ProjectMember::getRole)
                .orElse(null);

        List<ProjectMember> members = projectMemberRepository.findByProjectId(project.getId());
        long totalTasks = projectTaskRepository.countByProjectId(project.getId());
        long completedTasks = projectTaskRepository.countByProjectIdAndStatus(project.getId(), ProjectTaskStatus.DONE);
        int progress = totalTasks == 0 ? 0 : (int) Math.round((completedTasks * 100.0) / totalTasks);

        ProjectResponse response = new ProjectResponse();
        response.setId(project.getId());
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        response.setOwnerId(project.getOwnerId());
        response.setMemberCount(members.size());
        response.setProgress(progress);
        response.setCurrentUserRole(role);
        response.setCreatedAt(project.getCreatedAt());
        response.setUpdatedAt(project.getUpdatedAt());

        if (includeMembers) {
            List<ProjectMemberResponse> memberResponses = members.stream().map(member -> {
                ProjectMemberResponse mr = new ProjectMemberResponse();
                mr.setUserId(member.getUserId());
                mr.setRole(member.getRole());
                if (authHeader != null && !authHeader.isBlank()) {
                    try {
                        UserDTO user = userService.getUserById(member.getUserId(), authHeader);
                        mr.setName(user.getName());
                        mr.setEmail(user.getEmail());
                    } catch (Exception ignored) {
                        mr.setName("Unknown");
                        mr.setEmail("");
                    }
                } else {
                    mr.setName("User #" + member.getUserId());
                    mr.setEmail("");
                }
                return mr;
            }).collect(Collectors.toList());
            response.setMembers(memberResponses);
        }

        return response;
    }
}
