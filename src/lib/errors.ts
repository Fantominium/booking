export interface AppError {
  message: string;
  code: string;
  statusCode: number;
  stack?: string;
}

const createAppError = (message: string, code: string, statusCode: number): AppError => {
  const error = new Error(message);
  return {
    message: error.message,
    stack: error.stack,
    code,
    statusCode,
  };
};

export const createValidationError = (message: string): AppError =>
  createAppError(message, "VALIDATION_ERROR", 400);

export const createBookingConflictError = (message: string): AppError =>
  createAppError(message, "BOOKING_CONFLICT", 409);

export const createUnauthorizedError = (message: string): AppError =>
  createAppError(message, "UNAUTHORIZED", 401);

export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "statusCode" in error &&
    "message" in error
  );
};

export const toSafeError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }

  return createAppError("Unexpected error occurred", "INTERNAL_ERROR", 500);
};
