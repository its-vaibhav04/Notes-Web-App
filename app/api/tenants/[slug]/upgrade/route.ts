import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: NextRequest, { params }: any) {
  try {
    const token = await getToken({ req: request });
    const { slug: tenantSlugFromUrl } = params;

    // Check if user is an Admin
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if Admin is upgrading their own tenant
    if (token.tenantSlug !== tenantSlugFromUrl) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.tenant.update({
      where: {
        slug: tenantSlugFromUrl,
      },
      data: {
        subscriptionPlan: "PRO",
      },
    });

    return NextResponse.json({ message: "Upgrade successful" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
