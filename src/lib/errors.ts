export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class BookingConflictError extends AppError {
  constructor(message: string) {
    super(message, "BOOKING_CONFLICT", 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, "UNAUTHORIZED", 401);
  }
}

export const toSafeError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError("Unexpected error occurred", "INTERNAL_ERROR", 500);
};
