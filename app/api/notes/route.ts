import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../lib/authOptions";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();
const NOTE_LIMIT = 3;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notes);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { sub: userId, tenantId } = token;

    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: "Invalid session token" },
        { status: 401 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId as string },
    });
    if (tenant?.subscriptionPlan === "FREE") {
      const noteCount = await prisma.note.count({
        where: { tenantId: tenantId as string },
      });
      if (noteCount >= NOTE_LIMIT) {
        return NextResponse.json(
          { error: "Upgrade to Pro to create more notes." },
          { status: 403 }
        );
      }
    }

    const { title, content } = await request.json();

    const note = await prisma.note.create({
      data: {
        title,
        content,
        tenantId: tenantId as string,
        authorId: userId,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
