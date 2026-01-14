// Re-export shared types for use in main process
// This allows us to import from shared while keeping rootDir as ./src/main
export type {
  FailureContext,
  FailureContextInput,
  JiraDraft,
  SessionChoice,
} from '../shared/types';

