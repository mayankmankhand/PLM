import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { handleApiError } from "@/lib/api-utils";
import { ObsoleteProductRequirementInput } from "@/schemas/product-requirement.schema";
import { obsoleteProductRequirement } from "@/services/product-requirement.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = getRequestContext(request);
    const { id } = await params;
    const body = await request.json();
    ObsoleteProductRequirementInput.parse(body);
    const result = await obsoleteProductRequirement(id, ctx);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
