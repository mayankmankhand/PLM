import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { handleApiError } from "@/lib/api-utils";
import { PublishSubRequirementInput } from "@/schemas/sub-requirement.schema";
import { publishSubRequirement } from "@/services/sub-requirement.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = getRequestContext(request);
    const { id } = await params;
    const body = await request.json();
    PublishSubRequirementInput.parse(body);
    const result = await publishSubRequirement(id, ctx);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
