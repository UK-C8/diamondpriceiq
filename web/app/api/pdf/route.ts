import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";

// TODO: Replace stub with live CRM/email integration.
// Shape for the webhook call when a lead is captured:
// POST ${CRM_WEBHOOK_URL} with JSON:
//   { email, consent: true, stone, band, timestamp: ISO string }
async function pushLead(payload: { email: string; stone: unknown; band: unknown }) {
  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[CRM] CRM_WEBHOOK_URL not set — lead not pushed:", payload.email);
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, consent: true, timestamp: new Date().toISOString() }),
    });
  } catch (err) {
    console.error("[CRM] Lead push failed:", err);
  }
}

export async function POST(req: NextRequest) {
  let body: { email?: string; stone?: unknown; band?: unknown; modelVersion?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, stone, band, modelVersion } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!stone || !band) {
    return NextResponse.json({ error: "stone and band are required" }, { status: 400 });
  }

  // Push lead to CRM (fire-and-forget)
  pushLead({ email, stone, band }).catch(() => {});

  let renderToBuffer: (element: unknown) => Promise<Buffer>;
  let EstimatePDF: React.ComponentType<{ stone: unknown; band: unknown; modelVersion: string }>;
  try {
    const [pdfMod, pdfComp] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/EstimatePDF"),
    ]);
    renderToBuffer = pdfMod.renderToBuffer as typeof renderToBuffer;
    EstimatePDF = pdfComp.EstimatePDF;
  } catch (err) {
    console.error("[PDF] Import error:", err);
    return NextResponse.json({ error: "PDF module failed to load" }, { status: 500 });
  }

  const element = createElement(EstimatePDF, {
    stone,
    band,
    modelVersion: modelVersion ?? "0.1.0",
  });

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(element);
  } catch (err) {
    console.error("[PDF] Render error:", err);
    return NextResponse.json({ error: "PDF render failed", detail: String(err) }, { status: 500 });
  }

  return new NextResponse(pdfBuffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="diamondpriceiq-estimate.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
