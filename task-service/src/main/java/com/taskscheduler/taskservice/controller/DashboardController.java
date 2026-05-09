package com.taskscheduler.taskservice.controller;

import com.taskscheduler.taskservice.dto.UserDTO;
import com.taskscheduler.taskservice.dto.dashboard.DashboardResponse;
import com.taskscheduler.taskservice.service.DashboardService;
import com.taskscheduler.taskservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@RequestHeader("Authorization") String authHeader) throws Exception {
        UserDTO currentUser = userService.getUserFromToken(authHeader);
        return ResponseEntity.ok(dashboardService.getDashboard(currentUser));
    }
}
