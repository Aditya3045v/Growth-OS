import { Router, Request, Response } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn("[PGWOS] VAPID keys not configured — push notifications disabled.");
} else {
  webpush.setVapidDetails("mailto:pgwos@app.local", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Function to send push to a specific subscription
async function sendPushToSubscription(subscription: any, payload: object) {
  if (!VAPID_PUBLIC_KEY) return;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: any) {
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      console.log("[PGWOS] Subscription expired, clearing from DB:", subscription.endpoint);
      await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, subscription.endpoint));
    } else {
      console.error("[PGWOS] Push error:", err);
    }
  }
}

router.get("/vapid-public-key", (_req: Request, res: Response): void => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || "" });
});

router.post("/push/subscribe", async (req: Request, res: Response): Promise<void> => {
  const { 
    subscription, 
    morningEnabled, morningTime, morningMessage,
    eveningEnabled, eveningTime, eveningMessage 
  } = req.body as {
    subscription: any;
    morningEnabled?: boolean;
    morningTime?: string;
    morningMessage?: string;
    eveningEnabled?: boolean;
    eveningTime?: string;
    eveningMessage?: string;
  };

  if (!subscription?.endpoint) {
    res.status(400).json({ error: "Invalid subscription object" });
    return;
  }

  try {
    const data = {
      endpoint: subscription.endpoint,
      subscription: subscription,
      morningEnabled: morningEnabled ?? true,
      morningTime: morningTime ?? "07:00",
      morningMessage: morningMessage ?? "Time for your daily check-in and habit review.",
      eveningEnabled: eveningEnabled ?? true,
      eveningTime: eveningTime ?? "10:00",
      eveningMessage: eveningMessage ?? "Review your progress and plan tomorrow.",
    };

    // Upsert subscription
    await db.insert(pushSubscriptionsTable)
      .values(data)
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: data
      });

    await sendPushToSubscription(subscription, {
      title: "PGWOS Activated 🚀",
      body: "Push notifications are enabled. You'll be reminded to check in daily!",
      tag: "pgwos-welcome",
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[PGWOS] Subscription error:", err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

router.post("/push/unsubscribe", async (req: Request, res: Response): Promise<void> => {
  const { endpoint } = req.body as { endpoint: string };
  if (endpoint) {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  }
  res.json({ ok: true });
});

router.post("/push/test", async (req: Request, res: Response): Promise<void> => {
  const { endpoint } = req.body as { endpoint: string };
  const sub = await db.query.pushSubscriptionsTable.findFirst({
    where: eq(pushSubscriptionsTable.endpoint, endpoint)
  });

  if (!sub) {
    res.status(400).json({ error: "No active subscription found for this device." });
    return;
  }

  await sendPushToSubscription(sub.subscription, {
    title: "Test Notification ✅",
    body: "PGWOS push notifications are working perfectly!",
    tag: "pgwos-test",
  });
  res.json({ ok: true });
});

router.post("/push/update-schedule", async (req: Request, res: Response): Promise<void> => {
  const { endpoint, morningEnabled, morningTime, morningMessage, eveningEnabled, eveningTime, eveningMessage } = req.body as {
    endpoint: string;
    morningEnabled: boolean; morningTime: string; morningMessage: string;
    eveningEnabled: boolean; eveningTime: string; eveningMessage: string;
  };

  if (!endpoint) {
    res.status(400).json({ error: "Endpoint required" });
    return;
  }

  await db.update(pushSubscriptionsTable)
    .set({ morningEnabled, morningTime, morningMessage, eveningEnabled, eveningTime, eveningMessage })
    .where(eq(pushSubscriptionsTable.endpoint, endpoint));

  res.json({ ok: true });
});

// CRON Endpoint for Vercel / External Scheduler
router.get("/push/cron", async (_req: Request, res: Response): Promise<void> => {
  // Use a simple secret to protect the cron endpoint if needed, but for now we'll just implement logic
  const now = new Date();
  
  // Format as HH:mm in local time (or UTC if server is UTC)
  // Vercel servers are usually UTC, so we might need to handle offsets or just assume UTC for now.
  // Ideally we store user timezone, but HH:mm is a good start.
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${mins}`;

  console.log(`[PGWOS-CRON] Checking for notifications at ${currentTime}`);

  const activeSubs = await db.select().from(pushSubscriptionsTable).where(
    or(
      and(eq(pushSubscriptionsTable.morningEnabled, true), eq(pushSubscriptionsTable.morningTime, currentTime)),
      and(eq(pushSubscriptionsTable.eveningEnabled, true), eq(pushSubscriptionsTable.eveningTime, currentTime))
    )
  );

  for (const sub of activeSubs) {
    const isMorning = sub.morningEnabled && sub.morningTime === currentTime;
    const isEvening = sub.eveningEnabled && sub.eveningTime === currentTime;

    if (isMorning) {
      await sendPushToSubscription(sub.subscription, {
        title: "Good Morning! 🌅",
        body: sub.morningMessage || "Time for your daily check-in.",
        tag: "pgwos-reminder",
        icon: "/favicon.svg"
      });
    }

    if (isEvening) {
      await sendPushToSubscription(sub.subscription, {
        title: "Evening Reflection 🌙",
        body: sub.eveningMessage || "Review your day.",
        url: "/?action=checkin",
        tag: "pgwos-reminder",
        icon: "/favicon.svg"
      });
    }
  }

  res.json({ processed: activeSubs.length });
});

// Local Development Only: Trigger the cron logic every minute automatically
if (process.env.NODE_ENV !== "production") {
  console.log("[PGWOS] Development mode: Starting local notification interval (1min).");
  setInterval(async () => {
    try {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${mins}`;
      
      const activeSubs = await db.select().from(pushSubscriptionsTable).where(
        or(
          and(eq(pushSubscriptionsTable.morningEnabled, true), eq(pushSubscriptionsTable.morningTime, currentTime)),
          and(eq(pushSubscriptionsTable.eveningEnabled, true), eq(pushSubscriptionsTable.eveningTime, currentTime))
        )
      );

      for (const sub of activeSubs) {
        // Repeat the send logic here or refactor into a function
        const isMorning = sub.morningEnabled && sub.morningTime === currentTime;
        const isEvening = sub.eveningEnabled && sub.eveningTime === currentTime;
        if (isMorning) await sendPushToSubscription(sub.subscription, { title: "Good Morning! 🌅", body: sub.morningMessage, tag: "pgwos-reminder" });
        if (isEvening) await sendPushToSubscription(sub.subscription, { title: "Evening Reflection 🌙", body: sub.eveningMessage, url: "/?action=checkin", tag: "pgwos-reminder" });
      }
    } catch (err) {
      // Silent error in background interval
    }
  }, 60000);
}

export default router;
