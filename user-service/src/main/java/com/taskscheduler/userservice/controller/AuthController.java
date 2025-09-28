package com.taskscheduler.userservice.controller;

import com.taskscheduler.userservice.dto.AuthResponse;
import com.taskscheduler.userservice.dto.LoginRequest;
import com.taskscheduler.userservice.dto.RegisterRequest;
import com.taskscheduler.userservice.dto.UserDTO;
import com.taskscheduler.userservice.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Value("${oauth.google.client-id:}")
    private String googleClientId;

    @Value("${oauth.google.client-secret:}")
    private String googleClientSecret;

    @Value("${oauth.github.client-id:}")
    private String githubClientId;

    @Value("${oauth.github.client-secret:}")
    private String githubClientSecret;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse authResponse = authService.login(loginRequest);
            return new ResponseEntity<>(authResponse, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Login failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            AuthResponse authResponse = authService.register(registerRequest);
            return new ResponseEntity<>(authResponse, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Registration failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                boolean isValid = authService.validateToken(jwt);
                return new ResponseEntity<>(isValid, HttpStatus.OK);
            }
            return new ResponseEntity<>(false, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/user-info")
    public ResponseEntity<?> getUserInfo(@RequestHeader("Authorization") String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                UserDTO user = authService.getUserFromToken(jwt);
                return new ResponseEntity<>(user, HttpStatus.OK);
            }
            return new ResponseEntity<>("Invalid token", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error getting user info: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Google OAuth - Fixed redirect URI to use API Gateway port
    @GetMapping("/oauth2/authorize/google")
    public void authorizeGoogle(@RequestParam String redirect_uri, HttpServletResponse response) throws IOException {
        String googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=" + googleClientId +
                "&redirect_uri=http://localhost:8080/api/auth/oauth2/callback/google" + // Changed to 8080
                "&response_type=code" +
                "&scope=openid%20profile%20email" +
                "&state=" + redirect_uri;

        response.sendRedirect(googleAuthUrl);
    }

    @GetMapping("/oauth2/callback/google")
    public void googleCallback(@RequestParam String code, @RequestParam(required = false) String state,
                               HttpServletResponse response) throws IOException {
        try {
            AuthResponse authResponse = authService.processGoogleOAuth(code);
            String redirectUrl = (state != null ? state : "http://localhost:3000") + "?token=" + authResponse.getToken();
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            String redirectUrl = (state != null ? state : "http://localhost:3000") + "?error=" + e.getMessage();
            response.sendRedirect(redirectUrl);
        }
    }

    // GitHub OAuth - Fixed redirect URI to use API Gateway port
    @GetMapping("/oauth2/authorize/github")
    public void authorizeGitHub(@RequestParam String redirect_uri, HttpServletResponse response) throws IOException {
        String githubAuthUrl = "https://github.com/login/oauth/authorize?" +
                "client_id=" + githubClientId +
                "&redirect_uri=http://localhost:8080/api/auth/oauth2/callback/github" + // Changed to 8080
                "&scope=read:user%20user:email" +
                "&state=" + redirect_uri;

        response.sendRedirect(githubAuthUrl);
    }

    @GetMapping("/oauth2/callback/github")
    public void githubCallback(@RequestParam String code, @RequestParam(required = false) String state,
                               HttpServletResponse response) throws IOException {
        try {
            AuthResponse authResponse = authService.processGitHubOAuth(code);
            String redirectUrl = (state != null ? state : "http://localhost:3000") + "?token=" + authResponse.getToken();
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            String redirectUrl = (state != null ? state : "http://localhost:3000") + "?error=" + e.getMessage();
            response.sendRedirect(redirectUrl);
        }
    }
}