import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requirement = await prisma.productRequirement.findUniqueOrThrow({
      where: { id },
      include: {
        subRequirements: true,
        attachments: true,
      },
    });
    return NextResponse.json(requirement);
  } catch (error) {
    return handleApiError(error);
  }
}
