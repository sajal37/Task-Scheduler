package com.taskscheduler.taskservice.controller;

import com.taskscheduler.taskservice.dto.UserDTO;
import com.taskscheduler.taskservice.dto.project.*;
import com.taskscheduler.taskservice.service.ProjectManagementService;
import com.taskscheduler.taskservice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectManagementService projectManagementService;

    @Autowired
    private UserService userService;

    private UserDTO currentUser(String authHeader) throws Exception {
        return userService.getUserFromToken(authHeader);
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request,
                                                         @RequestHeader("Authorization") String authHeader) throws Exception {
        return new ResponseEntity<>(projectManagementService.createProject(request, currentUser(authHeader)), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getMyProjects(@RequestHeader("Authorization") String authHeader) throws Exception {
        return ResponseEntity.ok(projectManagementService.getMyProjects(currentUser(authHeader)));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long projectId,
                                                      @RequestHeader("Authorization") String authHeader) throws Exception {
        return ResponseEntity.ok(projectManagementService.getProject(projectId, currentUser(authHeader), authHeader));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long projectId,
                                                         @Valid @RequestBody UpdateProjectRequest request,
                                                         @RequestHeader("Authorization") String authHeader) throws Exception {
        return ResponseEntity.ok(projectManagementService.updateProject(projectId, request, currentUser(authHeader), authHeader));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable Long projectId,
                                           @RequestHeader("Authorization") String authHeader) throws Exception {
        projectManagementService.deleteProject(projectId, currentUser(authHeader));
        return ResponseEntity.ok().body("Project deleted successfully");
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<ProjectMemberResponse> addMember(@PathVariable Long projectId,
                                                           @Valid @RequestBody AddMemberRequest request,
                                                           @RequestHeader("Authorization") String authHeader) throws Exception {
        return new ResponseEntity<>(projectManagementService.addMember(projectId, request, currentUser(authHeader), authHeader), HttpStatus.CREATED);
    }

    @PutMapping("/{projectId}/members/{memberUserId}")
    public ResponseEntity<ProjectMemberResponse> updateMemberRole(@PathVariable Long projectId,
                                                                  @PathVariable Long memberUserId,
                                                                  @Valid @RequestBody UpdateMemberRoleRequest request,
                                                                  @RequestHeader("Authorization") String authHeader) throws Exception {
        return ResponseEntity.ok(projectManagementService.updateMemberRole(projectId, memberUserId, request, currentUser(authHeader), authHeader));
    }

    @DeleteMapping("/{projectId}/members/{memberUserId}")
    public ResponseEntity<?> removeMember(@PathVariable Long projectId,
                                          @PathVariable Long memberUserId,
                                          @RequestHeader("Authorization") String authHeader) throws Exception {
        projectManagementService.removeMember(projectId, memberUserId, currentUser(authHeader));
        return ResponseEntity.ok().body("Member removed successfully");
    }
}
