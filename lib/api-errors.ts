import { NextResponse } from "next/server";
import { AuthenticationError, AuthorizationError, ResourceNotFoundError } from "@/lib/auth";

export function accessErrorResponse(error: unknown) {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json({ message: "Acces refuse." }, { status: 403 });
  }

  if (error instanceof ResourceNotFoundError) {
    return NextResponse.json({ message: "Document introuvable." }, { status: 404 });
  }

  return null;
}
