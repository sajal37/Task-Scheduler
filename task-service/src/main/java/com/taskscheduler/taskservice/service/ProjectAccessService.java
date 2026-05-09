package com.taskscheduler.taskservice.service;

import com.taskscheduler.taskservice.entity.Project;
import com.taskscheduler.taskservice.entity.ProjectMember;
import com.taskscheduler.taskservice.entity.enums.ProjectRole;
import com.taskscheduler.taskservice.repository.ProjectMemberRepository;
import com.taskscheduler.taskservice.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectAccessService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    public Project getProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    public ProjectMember getMembershipOrThrow(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project"));
    }

    public ProjectRole ensureMemberAndGetRole(Long projectId, Long userId) {
        return getMembershipOrThrow(projectId, userId).getRole();
    }

    public void ensureAdmin(Long projectId, Long userId) {
        ProjectRole role = ensureMemberAndGetRole(projectId, userId);
        if (role != ProjectRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
        }
    }
}
