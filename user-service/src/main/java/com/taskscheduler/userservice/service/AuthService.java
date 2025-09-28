package com.taskscheduler.userservice.service;

import com.taskscheduler.userservice.dto.AuthResponse;
import com.taskscheduler.userservice.dto.LoginRequest;
import com.taskscheduler.userservice.dto.RegisterRequest;
import com.taskscheduler.userservice.dto.UserDTO;
import com.taskscheduler.userservice.entity.User;
import com.taskscheduler.userservice.repository.UserRepository;
import com.taskscheduler.userservice.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${oauth.google.client-id:}")
    private String googleClientId;

    @Value("${oauth.google.client-secret:}")
    private String googleClientSecret;

    @Value("${oauth.github.client-id:}")
    private String githubClientId;

    @Value("${oauth.github.client-secret:}")
    private String githubClientSecret;

    private RestTemplate restTemplate = new RestTemplate();

    public AuthResponse login(LoginRequest loginRequest) throws Exception {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isEmpty()) {
            throw new Exception("User not found with email: " + loginRequest.getEmail());
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new Exception("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId());

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    public AuthResponse register(RegisterRequest registerRequest) throws Exception {
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            throw new Exception("Passwords do not match");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new Exception("User already exists with email: " + registerRequest.getEmail());
        }

        if (registerRequest.getName() == null || registerRequest.getName().trim().isEmpty()) {
            throw new Exception("Name is required");
        }

        if (registerRequest.getEmail() == null || registerRequest.getEmail().trim().isEmpty()) {
            throw new Exception("Email is required");
        }

        if (registerRequest.getPassword() == null || registerRequest.getPassword().length() < 6) {
            throw new Exception("Password must be at least 6 characters long");
        }

        User user = new User();
        user.setName(registerRequest.getName().trim());
        user.setEmail(registerRequest.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getId());

        return new AuthResponse(token, savedUser.getId(), savedUser.getName(), savedUser.getEmail());
    }

    public UserDTO getCurrentUser(String email) throws Exception {
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            throw new Exception("User not found");
        }

        User user = userOptional.get();
        return new UserDTO(user.getId(), user.getName(), user.getEmail());
    }

    public boolean validateToken(String token) {
        return jwtUtil.validateToken(token);
    }

    public UserDTO getUserFromToken(String token) throws Exception {
        String email = jwtUtil.extractUsername(token);
        return getCurrentUser(email);
    }

    // Google OAuth - Fixed redirect URI to match API Gateway
    public AuthResponse processGoogleOAuth(String code) throws Exception {
        // Exchange code for access token
        String tokenUrl = "https://oauth2.googleapis.com/token";
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/x-www-form-urlencoded");

        String body = "code=" + code +
                "&client_id=" + googleClientId +
                "&client_secret=" + googleClientSecret +
                "&redirect_uri=http://localhost:8080/api/auth/oauth2/callback/google" +
                "&grant_type=authorization_code";

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, request, Map.class);

        String accessToken = (String) tokenResponse.getBody().get("access_token");

        // Get user info
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken;
        ResponseEntity<Map> userResponse = restTemplate.getForEntity(userInfoUrl, Map.class);
        Map<String, Object> userInfo = userResponse.getBody();

        return processOAuthUser(userInfo, "GOOGLE");
    }

    // GitHub OAuth - FIXED VERSION
    public AuthResponse processGitHubOAuth(String code) throws Exception {
        try {
            // Exchange code for access token
            String tokenUrl = "https://github.com/login/oauth/access_token";
            HttpHeaders headers = new HttpHeaders();
            headers.add("Accept", "application/json");
            headers.add("Content-Type", "application/x-www-form-urlencoded");

            String body = "client_id=" + githubClientId +
                    "&client_secret=" + githubClientSecret +
                    "&code=" + code;

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, request, Map.class);

            if (tokenResponse.getBody() == null || !tokenResponse.getBody().containsKey("access_token")) {
                throw new Exception("Failed to get access token from GitHub");
            }

            String accessToken = (String) tokenResponse.getBody().get("access_token");

            // Get user info with proper headers
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.add("Authorization", "Bearer " + accessToken); // Changed from "token" to "Bearer"
            userHeaders.add("Accept", "application/vnd.github.v3+json");
            userHeaders.add("User-Agent", "TaskScheduler-App");
            HttpEntity<String> userRequest = new HttpEntity<>(userHeaders);

            ResponseEntity<Map> userResponse = restTemplate.exchange(
                    "https://api.github.com/user", HttpMethod.GET, userRequest, Map.class);

            Map<String, Object> userInfo = userResponse.getBody();
            if (userInfo == null) {
                throw new Exception("Failed to get user info from GitHub");
            }

            // GitHub often doesn't include email in the basic user response
            // So we need to fetch emails separately
            String email = (String) userInfo.get("email");
            if (email == null || email.isEmpty()) {
                try {
                    ResponseEntity<List> emailResponse = restTemplate.exchange(
                            "https://api.github.com/user/emails", HttpMethod.GET, userRequest, List.class);

                    List<Map<String, Object>> emails = emailResponse.getBody();
                    if (emails != null && !emails.isEmpty()) {
                        // Find primary email
                        for (Map<String, Object> emailObj : emails) {
                            Boolean primary = (Boolean) emailObj.get("primary");
                            Boolean verified = (Boolean) emailObj.get("verified");
                            if (primary != null && primary && verified != null && verified) {
                                email = (String) emailObj.get("email");
                                break;
                            }
                        }
                        // If no primary found, use first verified email
                        if (email == null) {
                            for (Map<String, Object> emailObj : emails) {
                                Boolean verified = (Boolean) emailObj.get("verified");
                                if (verified != null && verified) {
                                    email = (String) emailObj.get("email");
                                    break;
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Warning: Could not fetch GitHub emails: " + e.getMessage());
                }
            }

            // Add email to userInfo for processing
            if (email != null) {
                userInfo.put("email", email);
            }

            return processOAuthUser(userInfo, "GITHUB");

        } catch (Exception e) {
            System.err.println("GitHub OAuth error: " + e.getMessage());
            e.printStackTrace();
            throw new Exception("GitHub OAuth failed: " + e.getMessage());
        }
    }

    private AuthResponse processOAuthUser(Map<String, Object> userInfo, String provider) throws Exception {
        String email = (String) userInfo.get("email");
        String name = (String) userInfo.get("name");
        String providerId = String.valueOf(userInfo.get("id"));
        String profilePicture = (String) userInfo.get("picture"); // Google
        if (profilePicture == null) {
            profilePicture = (String) userInfo.get("avatar_url"); // GitHub
        }

        if (email == null || email.trim().isEmpty()) {
            throw new Exception("Email not provided by OAuth provider. Please make sure your " + provider.toLowerCase() + " email is public or try using email/password registration.");
        }

        if (name == null || name.trim().isEmpty()) {
            name = (String) userInfo.get("login"); // GitHub fallback
            if (name == null || name.trim().isEmpty()) {
                name = email.split("@")[0]; // Use email prefix as fallback
            }
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Update OAuth info
            user.setAuthProvider(provider);
            user.setOauthProviderId(providerId);
            user.setProfilePictureUrl(profilePicture);
        } else {
            // Create new user
            user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setAuthProvider(provider);
            user.setOauthProviderId(providerId);
            user.setProfilePictureUrl(profilePicture);
            user.setPassword("OAUTH_USER_NO_PASSWORD");
        }

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getId());

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }
}