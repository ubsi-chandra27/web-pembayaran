import { NextResponse } from "next/server";

import { getCurrentUser, type DemoRole } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { readLocalPaymentProof } from "@/lib/storage";

function isStaff(role: string) {
  return can(role as DemoRole, "payment.verify") || can(role as DemoRole, "report.read");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const user = await getCurrentUser();
  const { fileName } = await params;

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(fileName)) {
    return new NextResponse("Invalid file", { status: 400 });
  }

  const proof = await prisma.paymentProof.findFirst({
    where: { fileUrl: `/api/proofs/${fileName}` },
    include: {
      payment: {
        include: {
          invoice: {
            include: {
              student: {
                include: {
                  guardians: { include: { guardian: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!proof) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ownsProof = proof.payment.invoice.student.guardians.some(
    (item) => item.guardian.userId === user.id
  );

  if (!ownsProof && !isStaff(user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const file = await readLocalPaymentProof(fileName);

  return new NextResponse(file, {
    headers: {
      "Content-Type": proof.fileMime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(proof.fileName)}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
