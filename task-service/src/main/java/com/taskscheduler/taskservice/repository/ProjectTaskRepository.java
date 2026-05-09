package com.taskscheduler.taskservice.repository;

import com.taskscheduler.taskservice.entity.ProjectTask;
import com.taskscheduler.taskservice.entity.enums.ProjectTaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {
    List<ProjectTask> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, ProjectTaskStatus status);

    long countByAssignedUserId(Long assignedUserId);

    long countByAssignedUserIdAndStatus(Long assignedUserId, ProjectTaskStatus status);

    @Query("SELECT count(t) FROM ProjectTask t WHERE t.assignedUserId = :userId AND t.status <> com.taskscheduler.taskservice.entity.enums.ProjectTaskStatus.DONE AND t.dueDate < :today")
    long countOverdueByAssignedUserId(@Param("userId") Long userId, @Param("today") LocalDate today);

    @Query("SELECT t FROM ProjectTask t WHERE t.project.id = :projectId AND t.status <> com.taskscheduler.taskservice.entity.enums.ProjectTaskStatus.DONE AND t.dueDate < :today ORDER BY t.dueDate ASC")
    List<ProjectTask> findOverdueByProject(@Param("projectId") Long projectId, @Param("today") LocalDate today);

    @Transactional
    void deleteByProjectId(Long projectId);
}
