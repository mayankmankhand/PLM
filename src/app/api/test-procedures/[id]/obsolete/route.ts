import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { handleApiError } from "@/lib/api-utils";
import { ObsoleteTestProcedureInput } from "@/schemas/test-procedure.schema";
import { obsoleteTestProcedure } from "@/services/test-procedure.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = getRequestContext(request);
    const { id } = await params;
    const body = await request.json();
    ObsoleteTestProcedureInput.parse(body);
    const result = await obsoleteTestProcedure(id, ctx);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
