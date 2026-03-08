import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const procedure = await prisma.testProcedure.findUniqueOrThrow({
      where: { id },
      include: {
        subRequirement: true,
        versions: {
          orderBy: { versionNumber: "desc" },
        },
        attachments: true,
      },
    });
    return NextResponse.json(procedure);
  } catch (error) {
    return handleApiError(error);
  }
}
