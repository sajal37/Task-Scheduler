package com.taskscheduler.taskservice.client;

import com.taskscheduler.taskservice.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "user-service", url = "${services.user-service.url:http://127.0.0.1:8081}")
public interface UserServiceClient {

    @PostMapping("/api/auth/validate")
    ResponseEntity<Boolean> validateToken(@RequestHeader("Authorization") String token);

    @PostMapping("/api/auth/user-info")
    ResponseEntity<UserDTO> getUserInfo(@RequestHeader("Authorization") String token);

    @GetMapping("/api/auth/lookup/email")
    ResponseEntity<UserDTO> getUserByEmail(@RequestParam("email") String email, @RequestHeader("Authorization") String token);

    @GetMapping("/api/auth/lookup/{id}")
    ResponseEntity<UserDTO> getUserById(@PathVariable("id") Long id, @RequestHeader("Authorization") String token);
}
