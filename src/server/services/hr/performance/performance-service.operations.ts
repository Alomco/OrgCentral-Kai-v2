export type { PerformanceServiceRuntime } from './performance-service.operations.types';
export { handleGetGoalsByReviewId, handleGetReviewById, handleGetReviewsByEmployee } from './performance-service.operations.read';
export {
    handleAddGoal,
    handleCreateReview,
    handleDeleteGoal,
    handleDeleteReview,
    handleUpdateGoal,
    handleUpdateReview,
} from './performance-service.operations.mutations';
