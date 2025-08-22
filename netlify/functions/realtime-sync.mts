// netlify/functions/realtime-sync.mts
// Real-time data synchronization for Garment ERP

import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    let action: string;
    let data: any = {};

    if (req.method === 'GET') {
      const url = new URL(req.url);
      action = url.searchParams.get('action') || 'status';
    } else {
      const body = await req.json();
      action = body.action;
      data = body.data || {};
    }
    
    switch (action) {
      case 'sync-bundles':
        return handleBundleSync(data, headers);
        
      case 'sync-production':
        return handleProductionSync(data, headers);
        
      case 'sync-notifications':
        return handleNotificationSync(data, headers);
        
      case 'sync-line-status':
        return handleLineStatusSync(data, headers);
        
      case 'sync-operators':
        return handleOperatorSync(data, headers);
        
      case 'status':
        return handleStatusCheck(headers);
        
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Unknown sync action',
          availableActions: [
            'sync-bundles',
            'sync-production', 
            'sync-notifications',
            'sync-line-status',
            'sync-operators',
            'status'
          ]
        }), { 
          status: 400, 
          headers 
        });
    }

  } catch (error) {
    console.error('Realtime sync error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Synchronization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers 
    });
  }
};

// Handle bundle synchronization
function handleBundleSync(data: any, headers: any) {
  const { bundles = [], operatorId } = data;
  
  // In production, this would sync with Firebase
  // For now, return mock sync response
  const syncedBundles = bundles.map((bundle: any) => ({
    ...bundle,
    syncedAt: new Date().toISOString(),
    status: bundle.status || 'pending'
  }));

  return new Response(JSON.stringify({
    success: true,
    action: 'sync-bundles',
    synced: syncedBundles.length,
    bundles: syncedBundles,
    operatorId,
    timestamp: new Date().toISOString()
  }), { 
    status: 200, 
    headers 
  });
}

// Handle production data sync
function handleProductionSync(data: any, headers: any) {
  const { lineId, stationId, metrics = {} } = data;
  
  // Mock production data
  const productionData = {
    lineId: lineId || 'line-1',
    stationId: stationId || 'station-1',
    metrics: {
      totalPieces: metrics.totalPieces || 1250,
      efficiency: metrics.efficiency || 87,
      quality: metrics.quality || 96,
      activeOperators: metrics.activeOperators || 12,
      completedBundles: metrics.completedBundles || 45,
      pendingBundles: metrics.pendingBundles || 8
    },
    realTimeData: {
      currentHourProduction: 125,
      averageTimePerPiece: 2.3,
      bottleneckStation: 'overlock-2',
      topPerformer: 'राम सिंह'
    },
    alerts: [
      {
        type: 'efficiency',
        message: 'ओभरलक स्टेसन २ खाली छ',
        priority: 'medium',
        timestamp: new Date().toISOString()
      }
    ]
  };

  return new Response(JSON.stringify({
    success: true,
    action: 'sync-production',
    data: productionData,
    timestamp: new Date().toISOString()
  }), { 
    status: 200, 
    headers 
  });
}

// Handle notification sync
function handleNotificationSync(data: any, headers: any) {
  const { userId, lastSyncTime } = data;
  
  // Mock notifications
  const notifications = [
    {
      id: 'notif_1',
      type: 'workAssigned',
      title: 'नयाँ काम तोकिएको',
      message: 'बन्डल #15 तपाईंको स्टेसनमा तयार छ',
      userId,
      read: false,
      timestamp: new Date().toISOString()
    },
    {
      id: 'notif_2',
      type: 'earning',
      title: 'दैनिक कमाई',
      message: 'आजको कमाई: रु. 425',
      userId,
      read: false,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  return new Response(JSON.stringify({
    success: true,
    action: 'sync-notifications',
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    lastSyncTime: new Date().toISOString()
  }), { 
    status: 200, 
    headers 
  });
}

// Handle line status sync
function handleLineStatusSync(data: any, headers: any) {
  const { lineId = 'line-1' } = data;
  
  const lineStatus = {
    lineId,
    stations: [
      {
        stationId: 'overlock-1',
        stationName: 'ओभरलक स्टेसन १',
        operator: {
          id: 'op001',
          name: 'राम सिंह',
          status: 'active'
        },
        currentWork: {
          bundleId: 'bundle-15',
          article: '8085',
          operation: 'साइड सिम',
          progress: 85,
          estimatedCompletion: '5 मिनेट'
        },
        efficiency: 92,
        status: 'active'
      },
      {
        stationId: 'overlock-2',
        stationName: 'ओभरलक स्टेसन २',
        operator: {
          id: 'op002',
          name: 'श्याम पोखरेल',
          status: 'idle'
        },
        currentWork: null,
        efficiency: 0,
        status: 'idle',
        idleTime: '15 मिनेट'
      },
      {
        stationId: 'flatlock-1',
        stationName: 'फ्ल्यालक स्टेसन १',
        operator: {
          id: 'op003',
          name: 'सीता देवी',
          status: 'active'
        },
        currentWork: {
          bundleId: 'bundle-12',
          article: '2233',
          operation: 'हेम फोल्ड',
          progress: 60,
          estimatedCompletion: '12 मिनेट'
        },
        efficiency: 88,
        status: 'active'
      }
    ],
    overallEfficiency: 85,
    activeStations: 2,
    totalStations: 3,
    alerts: [
      {
        stationId: 'overlock-2',
        type: 'idle',
        message: 'स्टेसन १५ मिनेट देखि खाली छ',
        suggestion: 'बन्डल #16 असाइन गर्नुहोस्',
        priority: 'medium'
      }
    ]
  };

  return new Response(JSON.stringify({
    success: true,
    action: 'sync-line-status',
    data: lineStatus,
    timestamp: new Date().toISOString()
  }), { 
    status: 200, 
    headers 
  });
}

// Handle operator sync
function handleOperatorSync(data: any, headers: any) {
  const { operatorId } = data;
  
  const operatorData = {
    operatorId,
    currentWork: {
      bundleId: 'bundle-15',
      article: '8085',
      articleName: 'Polo T-Shirt',
      color: 'नीलो',
      size: 'XL',
      operation: 'साइड सिम',
      pieces: 30,
      completedPieces: 25,
      remainingPieces: 5,
      rate: 2.50,
      currentEarnings: 62.50
    },
    todayStats: {
      piecesCompleted: 95,
      totalEarnings: 237.50,
      efficiency: 88,
      qualityScore: 98,
      workHours: 7.5,
      targetPieces: 120
    },
    workQueue: [
      {
        bundleId: 'bundle-16',
        article: '2233',
        operation: 'हेम फोल्ड',
        pieces: 28,
        estimatedTime: '35 मिनेट',
        rate: 2.80
      },
      {
        bundleId: 'bundle-17',
        article: '6635',
        operation: 'प्लाकेट',
        pieces: 40,
        estimatedTime: '50 मिनेट',
        rate: 1.90
      }
    ]
  };

  return new Response(JSON.stringify({
    success: true,
    action: 'sync-operators',
    data: operatorData,
    timestamp: new Date().toISOString()
  }), { 
    status: 200, 
    headers 
  });
}

// Handle status check
function handleStatusCheck(headers: any) {
  const systemStatus = {
    status: 'operational',
    services: {
      database: 'connected',
      authentication: 'active',
      notifications: 'enabled',
      realTimeSync: 'active'
    },
    metrics: {
      activeUsers: 48,
      onlineOperators: 45,
      activeSupervisors: 3,
      systemUptime: '99.8%',
      averageResponseTime: '120ms'
    },
    lastUpdated: new Date().toISOString()
  };

  return new Response(JSON.stringify({
    success: true,
    action: 'status',
    data: systemStatus,
    timestamp: new Date().toISOString()
  }), { 
    status: 200, 
    headers 
  });
}

export const config: Config = {
  path: "/api/realtime-sync"
};