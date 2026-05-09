package com.taskscheduler.taskservice.controller;

import com.taskscheduler.taskservice.dto.UserDTO;
import com.taskscheduler.taskservice.dto.task.CreateProjectTaskRequest;
import com.taskscheduler.taskservice.dto.task.ProjectTaskResponse;
import com.taskscheduler.taskservice.dto.task.UpdateProjectTaskRequest;
import com.taskscheduler.taskservice.service.ProjectTaskManagementService;
import com.taskscheduler.taskservice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
public class ProjectTaskController {

    @Autowired
    private ProjectTaskManagementService projectTaskManagementService;

    @Autowired
    private UserService userService;

    private UserDTO currentUser(String authHeader) throws Exception {
        return userService.getUserFromToken(authHeader);
    }

    @GetMapping
    public ResponseEntity<List<ProjectTaskResponse>> getTasks(@PathVariable Long projectId,
                                                              @RequestHeader("Authorization") String authHeader) throws Exception {
        return ResponseEntity.ok(projectTaskManagementService.getProjectTasks(projectId, currentUser(authHeader), authHeader));
    }

    @PostMapping
    public ResponseEntity<ProjectTaskResponse> createTask(@PathVariable Long projectId,
                                                          @Valid @RequestBody CreateProjectTaskRequest request,
                                                          @RequestHeader("Authorization") String authHeader) throws Exception {
        return new ResponseEntity<>(
                projectTaskManagementService.createTask(projectId, request, currentUser(authHeader), authHeader),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<ProjectTaskResponse> updateTask(@PathVariable Long projectId,
                                                          @PathVariable Long taskId,
                                                          @Valid @RequestBody UpdateProjectTaskRequest request,
                                                          @RequestHeader("Authorization") String authHeader) throws Exception {
        return ResponseEntity.ok(projectTaskManagementService.updateTask(projectId, taskId, request, currentUser(authHeader), authHeader));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable Long projectId,
                                        @PathVariable Long taskId,
                                        @RequestHeader("Authorization") String authHeader) throws Exception {
        projectTaskManagementService.deleteTask(projectId, taskId, currentUser(authHeader));
        return ResponseEntity.ok().body("Task deleted successfully");
    }
}
