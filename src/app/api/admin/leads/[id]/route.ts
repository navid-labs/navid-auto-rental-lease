import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const lead = await prisma.consultationLead.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      ...(body.note !== undefined && { note: body.note }),
    },
  });

  return NextResponse.json(lead);
}
