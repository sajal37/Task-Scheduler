package com.taskscheduler.taskservice.service;

import com.taskscheduler.taskservice.client.UserServiceClient;
import com.taskscheduler.taskservice.dto.UserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    @Autowired
    private UserServiceClient userServiceClient;

    public boolean validateToken(String authHeader) {
        try {
            ResponseEntity<Boolean> response = userServiceClient.validateToken(authHeader);
            return response.getBody() != null && response.getBody();
        } catch (Exception e) {
            return false;
        }
    }

    public UserDTO getUserFromToken(String authHeader) throws Exception {
        ResponseEntity<Boolean> validationResponse = userServiceClient.validateToken(authHeader);
        if (validationResponse.getBody() == null || !validationResponse.getBody()) {
            throw new RuntimeException("Invalid token");
        }

        ResponseEntity<UserDTO> userResponse = userServiceClient.getUserInfo(authHeader);
        if (userResponse.getBody() == null) {
            throw new RuntimeException("Could not retrieve user information");
        }

        return userResponse.getBody();
    }

    public UserDTO getUserByEmail(String email, String authHeader) {
        try {
            ResponseEntity<UserDTO> response = userServiceClient.getUserByEmail(email, authHeader);
            if (response.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email);
            }
            return response.getBody();
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email);
        }
    }

    public UserDTO getUserById(Long id, String authHeader) {
        try {
            ResponseEntity<UserDTO> response = userServiceClient.getUserById(id, authHeader);
            if (response.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id);
            }
            return response.getBody();
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id);
        }
    }
}
