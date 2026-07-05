"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addTask as addTaskToStorage,
  deleteTask as deleteTaskFromStorage,
  getCurrentWeekTasks,
  getOverdueTasks,
  getTasks,
  getTasksGroupedByDate,
  getTodayDoneTasks,
  getTodayTodoTasks,
  getTodayTasks,
  saveTasks,
  updateTask as updateTaskInStorage,
} from "@/services/storage/taskStorage";
import type { Task, UserRole } from "@/types";

export function useTasks(role: UserRole, isReady: boolean) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [todayTodoTasks, setTodayTodoTasks] = useState<Task[]>([]);
  const [todayDoneTasks, setTodayDoneTasks] = useState<Task[]>([]);
  const [currentWeekTasks, setCurrentWeekTasks] = useState<Task[]>([]);
  const [tasksGroupedByDate, setTasksGroupedByDate] = useState<
    Record<string, Task[]>
  >({});

  const refreshTasks = useCallback(() => {
    setTasks(getTasks(role));
    setTodayTasks(getTodayTasks(role));
    setOverdueTasks(getOverdueTasks(role));
    setTodayTodoTasks(getTodayTodoTasks(role));
    setTodayDoneTasks(getTodayDoneTasks(role));
    setCurrentWeekTasks(getCurrentWeekTasks(role));
    setTasksGroupedByDate(getTasksGroupedByDate(role));
  }, [role]);

  useEffect(() => {
    if (isReady) {
      queueMicrotask(refreshTasks);
    }
  }, [isReady, refreshTasks]);

  const replaceTasks = useCallback((nextTasks: Task[]) => {
    saveTasks(role, nextTasks);
    refreshTasks();
  }, [refreshTasks, role]);

  const addTask = useCallback((task: Task) => {
    addTaskToStorage(role, task);
    refreshTasks();
  }, [refreshTasks, role]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    updateTaskInStorage(role, taskId, updates);
    refreshTasks();
  }, [refreshTasks, role]);

  const deleteTask = useCallback((taskId: string) => {
    deleteTaskFromStorage(role, taskId);
    refreshTasks();
  }, [refreshTasks, role]);

  return useMemo(
    () => ({
      addTask,
      currentWeekTasks,
      deleteTask,
      overdueTasks,
      refreshTasks,
      replaceTasks,
      tasks,
      tasksGroupedByDate,
      todayDoneTasks,
      todayTasks,
      todayTodoTasks,
      updateTask,
    }),
    [
      addTask,
      currentWeekTasks,
      deleteTask,
      overdueTasks,
      refreshTasks,
      replaceTasks,
      tasks,
      tasksGroupedByDate,
      todayDoneTasks,
      todayTasks,
      todayTodoTasks,
      updateTask,
    ],
  );
}
