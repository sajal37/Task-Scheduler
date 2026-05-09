package com.taskscheduler.taskservice.repository;

import com.taskscheduler.taskservice.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
