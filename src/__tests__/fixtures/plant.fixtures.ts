import { Plant } from '../../types/database.types';

export function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'test-plant-id',
    user_id: 'test-user-id',
    name: 'Test Tomato',
    plant_type: 'vegetable',
    photo_url: null,
    space_type: 'bed',
    location: 'Front Garden',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
