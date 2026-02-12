import { NextResponse } from "next/server";

import { AppError } from "@/lib/errors";

export const jsonOk = <T>(data: T, init?: ResponseInit): NextResponse => {
  return NextResponse.json(data, init);
};

export const jsonCreated = <T>(data: T): NextResponse => {
  return NextResponse.json(data, { status: 201 });
};

export const jsonError = (error: AppError): NextResponse => {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.statusCode },
  );
};
