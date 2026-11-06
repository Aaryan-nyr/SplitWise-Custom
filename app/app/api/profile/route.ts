import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/auth";
import { prisma } from "@/app/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Profile details are required." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const hasName = Object.hasOwn(input, "name");
  const hasImage = Object.hasOwn(input, "image");

  if (hasName === hasImage) {
    return NextResponse.json(
      { error: "Update one profile field at a time." },
      { status: 400 }
    );
  }

  if (hasName) {
    if (typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 80) {
      return NextResponse.json(
        { error: "Your name must be between 1 and 80 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: input.name.trim() },
      select: { name: true },
    });

    return NextResponse.json({ name: user.name });
  }

  if (input.image !== null && typeof input.image !== "string") {
    return NextResponse.json(
      { error: "Enter a valid HTTPS photo URL or clear the field." },
      { status: 400 }
    );
  }

  const image = typeof input.image === "string" ? input.image.trim() : null;
  if (image && image.length > 2048) {
    return NextResponse.json(
      { error: "The photo URL must be 2048 characters or fewer." },
      { status: 400 }
    );
  }

  if (image) {
    try {
      if (new URL(image).protocol !== "https:") {
        throw new Error("The photo URL must use HTTPS.");
      }
    } catch {
      return NextResponse.json(
        { error: "Enter a valid HTTPS photo URL or clear the field." },
        { status: 400 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { image },
    select: { image: true },
  });

  return NextResponse.json({ image: user.image });
}
