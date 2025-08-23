import type { Context, Config } from "@netlify/functions";

interface Bundle {
  id: string;
  article: string;
  articleName: string;
  articleNameNp: string;
  color: string;
  size: string;
  pieces: number;
  operation: string;
  operationNp: string;
  machine: string;
  rate: number;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "assigned" | "in-progress" | "completed" | "paused";
  assignedOperator?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number;
  actualTime?: number;
  qualityStatus?: "pass" | "fail" | "rework";
  completedPieces?: number;
  defectivePieces?: number;
}

// Demo bundles data
let DEMO_BUNDLES: Bundle[] = [
  {
    id: "bundle-001",
    article: "8085",
    articleName: "Polo T-Shirt",
    articleNameNp: "पोलो टी-शर्ट",
    color: "Blue-1",
    size: "XL",
    pieces: 30,
    operation: "Shoulder Join",
    operationNp: "काँध जोड्ने",
    machine: "overlock",
    rate: 2.5,
    priority: "normal",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedTime: 45,
  },
  {
    id: "bundle-002",
    article: "2233",
    articleName: "Basic T-Shirt",
    articleNameNp: "साधारण टी-शर्ट",
    color: "Red-2",
    size: "2XL",
    pieces: 35,
    operation: "Side Seam",
    operationNp: "साइड सिम",
    machine: "overlock",
    rate: 2.2,
    priority: "high",
    status: "assigned",
    assignedOperator: "op001",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedTime: 40,
  },
  {
    id: "bundle-003",
    article: "6635",
    articleName: "Dress Shirt",
    articleNameNp: "ड्रेस शर्ट",
    color: "White",
    size: "L",
    pieces: 25,
    operation: "Placket",
    operationNp: "प्लाकेट",
    machine: "overlock",
    rate: 3.0,
    priority: "urgent",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedTime: 60,
  },
];

export default async (req: Request, context: Context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const bundleId = pathSegments[pathSegments.length - 1];

    switch (req.method) {
      case "GET":
        if (bundleId && bundleId !== "bundles") {
          return await getBundleById(bundleId, corsHeaders);
        } else {
          return await getAllBundles(url, corsHeaders);
        }
      case "POST":
        return await createBundle(req, corsHeaders);
      case "PUT":
        return await updateBundle(bundleId, req, corsHeaders);
      case "DELETE":
        return await deleteBundle(bundleId, corsHeaders);
      default:
        return new Response(
          JSON.stringify({ success: false, error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Bundles function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function getAllBundles(url: URL, corsHeaders: Record<string, string>) {
  const params = url.searchParams;
  const operatorId = params.get("operatorId");
  const status = params.get("status");
  const machine = params.get("machine");
  const priority = params.get("priority");

  let filteredBundles = [...DEMO_BUNDLES];

  if (operatorId) {
    filteredBundles = filteredBundles.filter(
      (b) => b.assignedOperator === operatorId
    );
  }

  if (status) {
    filteredBundles = filteredBundles.filter((b) => b.status === status);
  }

  if (machine) {
    filteredBundles = filteredBundles.filter(
      (b) => b.machine === machine.toLowerCase()
    );
  }

  if (priority) {
    filteredBundles = filteredBundles.filter((b) => b.priority === priority);
  }

  // Sort by priority (urgent > high > normal > low) then by creation date
  filteredBundles.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 1;
    const bPriority = priorityOrder[b.priority] || 1;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return new Response(
    JSON.stringify({ success: true, bundles: filteredBundles }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getBundleById(bundleId: string, corsHeaders: Record<string, string>) {
  const bundle = DEMO_BUNDLES.find((b) => b.id === bundleId);

  if (!bundle) {
    return new Response(
      JSON.stringify({ success: false, error: "Bundle not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, bundle }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function createBundle(req: Request, corsHeaders: Record<string, string>) {
  const bundleData = await req.json();

  // Validate required fields
  const requiredFields = ['article', 'articleName', 'color', 'size', 'pieces', 'operation', 'machine', 'rate'];
  const missingFields = requiredFields.filter(field => !bundleData[field]);
  
  if (missingFields.length > 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const newBundle: Bundle = {
    id: `bundle-${Date.now()}`,
    ...bundleData,
    status: bundleData.status || "pending",
    priority: bundleData.priority || "normal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  DEMO_BUNDLES.push(newBundle);

  return new Response(
    JSON.stringify({ success: true, bundle: newBundle }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function updateBundle(
  bundleId: string,
  req: Request,
  corsHeaders: Record<string, string>
) {
  const bundleIndex = DEMO_BUNDLES.findIndex((b) => b.id === bundleId);

  if (bundleIndex === -1) {
    return new Response(
      JSON.stringify({ success: false, error: "Bundle not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const updateData = await req.json();
  
  // Track status changes for notifications
  const oldStatus = DEMO_BUNDLES[bundleIndex].status;
  const newStatus = updateData.status;
  
  DEMO_BUNDLES[bundleIndex] = {
    ...DEMO_BUNDLES[bundleIndex],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  // If bundle was completed, record completion time
  if (newStatus === "completed" && oldStatus !== "completed") {
    DEMO_BUNDLES[bundleIndex].actualTime = updateData.actualTime || Date.now();
  }

  // Log status change for potential notifications
  if (oldStatus !== newStatus) {
    console.log(`Bundle ${bundleId} status changed from ${oldStatus} to ${newStatus}`);
  }

  return new Response(
    JSON.stringify({ success: true, bundle: DEMO_BUNDLES[bundleIndex] }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function deleteBundle(bundleId: string, corsHeaders: Record<string, string>) {
  const bundleIndex = DEMO_BUNDLES.findIndex((b) => b.id === bundleId);

  if (bundleIndex === -1) {
    return new Response(
      JSON.stringify({ success: false, error: "Bundle not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if bundle can be deleted (only pending bundles)
  if (DEMO_BUNDLES[bundleIndex].status !== "pending") {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Cannot delete bundle with status: " + DEMO_BUNDLES[bundleIndex].status 
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  DEMO_BUNDLES.splice(bundleIndex, 1);

  return new Response(
    JSON.stringify({ success: true, message: "Bundle deleted successfully" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

export const config: Config = {
  path: ["/api/bundles", "/api/bundles/*"],
};