import { TaskTemplate, TaskLog } from '../../types/database.types';

export function makeTaskTemplate(overrides: Partial<TaskTemplate> = {}): TaskTemplate {
  return {
    id: 'test-template-id',
    user_id: 'test-user-id',
    plant_id: 'test-plant-id',
    task_type: 'water',
    frequency_days: 3,
    preferred_time: null,
    enabled: true,
    next_due_at: '2026-01-04T18:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeTaskLog(overrides: Partial<TaskLog> = {}): TaskLog {
  return {
    id: 'test-log-id',
    user_id: 'test-user-id',
    template_id: 'test-template-id',
    plant_id: 'test-plant-id',
    task_type: 'water',
    done_at: '2026-01-01T09:00:00.000Z',
    created_at: '2026-01-01T09:00:00.000Z',
    ...overrides,
  };
}
