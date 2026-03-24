import { Router, Request, Response } from "express";
import webpush from "web-push";
import fs from "fs";
import path from "path";

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBSCRIPTION_FILE = path.join(process.cwd(), ".push-subscription.json");

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn("[PGWOS] VAPID keys not configured — push notifications disabled.");
} else {
  webpush.setVapidDetails("mailto:pgwos@app.local", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface StoredSubscription {
  subscription: webpush.PushSubscription;
  schedule: { 
    morningEnabled: boolean; 
    morningTime: string; 
    morningMessage: string;
    eveningEnabled: boolean; 
    eveningTime: string; 
    eveningMessage: string;
  };
}

let stored: StoredSubscription | null = null;

function loadSubscription(): void {
  try {
    if (fs.existsSync(SUBSCRIPTION_FILE)) {
      const raw = fs.readFileSync(SUBSCRIPTION_FILE, "utf-8");
      stored = JSON.parse(raw) as StoredSubscription;
      console.log("[PGWOS] Loaded push subscription from disk.");
      setupSchedule(stored.schedule);
    }
  } catch (err) {
    console.warn("[PGWOS] Failed to load push subscription:", err);
    stored = null;
  }
}

function saveSubscription(): void {
  try {
    if (stored) {
      fs.writeFileSync(SUBSCRIPTION_FILE, JSON.stringify(stored), "utf-8");
    } else if (fs.existsSync(SUBSCRIPTION_FILE)) {
      fs.unlinkSync(SUBSCRIPTION_FILE);
    }
  } catch (err) {
    console.warn("[PGWOS] Failed to save push subscription:", err);
  }
}

const scheduledJobs: NodeJS.Timeout[] = [];

function sendPush(payload: object): void {
  if (!stored || !VAPID_PUBLIC_KEY) return;
  webpush.sendNotification(stored.subscription, JSON.stringify(payload))
    .catch((err: { statusCode?: number }) => {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        console.log("[PGWOS] Subscription expired, clearing.");
        stored = null;
        saveSubscription();
        clearAllScheduled();
      }
    });
}

function scheduleNotification(hour: number, minute: number, title: string, body: string, url?: string): void {
  const checkAndSend = () => {
    const now = new Date();
    if (now.getHours() === hour && now.getMinutes() === minute) {
      sendPush({ title, body, url, tag: "pgwos-reminder", icon: "/favicon.svg" });
    }
  };
  const interval = setInterval(checkAndSend, 60000);
  scheduledJobs.push(interval);
}

function clearAllScheduled(): void {
  scheduledJobs.forEach(clearInterval);
  scheduledJobs.length = 0;
}

function setupSchedule(schedule: StoredSubscription["schedule"]): void {
  clearAllScheduled();
  if (schedule.morningEnabled && schedule.morningTime) {
    const [h, m] = schedule.morningTime.split(":").map(Number);
    scheduleNotification(h, m, "Good Morning! 🌅", schedule.morningMessage || "Time for your daily check-in and habit review.");
  }
  if (schedule.eveningEnabled && schedule.eveningTime) {
    const [h, m] = schedule.eveningTime.split(":").map(Number);
    scheduleNotification(
      h, m, 
      "Evening Reflection 🌙", 
      schedule.eveningMessage || "Review your progress and plan tomorrow.",
      "/?action=checkin"
    );
  }
}

loadSubscription();

router.get("/vapid-public-key", (_req: Request, res: Response): void => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || "" });
});

router.post("/push/subscribe", (req: Request, res: Response): void => {
  const { 
    subscription, 
    morningEnabled, morningTime, morningMessage,
    eveningEnabled, eveningTime, eveningMessage 
  } = req.body as {
    subscription: webpush.PushSubscription;
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

  const schedule = {
    morningEnabled: morningEnabled ?? true,
    morningTime: morningTime ?? "07:00",
    morningMessage: morningMessage ?? "Time for your daily check-in and habit review.",
    eveningEnabled: eveningEnabled ?? true,
    eveningTime: eveningTime ?? "22:00",
    eveningMessage: eveningMessage ?? "Review your progress and plan tomorrow.",
  };

  stored = { subscription, schedule };
  saveSubscription();
  setupSchedule(schedule);

  sendPush({
    title: "PGWOS Activated 🚀",
    body: "Push notifications are enabled. You'll be reminded to check in daily!",
    tag: "pgwos-welcome",
  });

  res.json({ ok: true });
});

router.post("/push/unsubscribe", (_req: Request, res: Response): void => {
  stored = null;
  saveSubscription();
  clearAllScheduled();
  res.json({ ok: true });
});

router.post("/push/test", (_req: Request, res: Response): void => {
  if (!stored) {
    res.status(400).json({ error: "No active subscription. Enable notifications first." });
    return;
  }
  sendPush({
    title: "Test Notification ✅",
    body: "PGWOS push notifications are working perfectly!",
    tag: "pgwos-test",
  });
  res.json({ ok: true });
});

router.post("/push/update-schedule", (req: Request, res: Response): void => {
  const { morningEnabled, morningTime, morningMessage, eveningEnabled, eveningTime, eveningMessage } = req.body as {
    morningEnabled: boolean; morningTime: string; morningMessage: string;
    eveningEnabled: boolean; eveningTime: string; eveningMessage: string;
  };

  if (stored) {
    stored.schedule = { morningEnabled, morningTime, morningMessage, eveningEnabled, eveningTime, eveningMessage };
    saveSubscription();
    setupSchedule(stored.schedule);
  } else {
    // If not subscribed but still updating schedule (unlikely via UI but safe to handle)
    setupSchedule({ 
      morningEnabled, morningTime, morningMessage, 
      eveningEnabled, eveningTime, eveningMessage 
    });
  }

  res.json({ ok: true });
});

export default router;

export default router;
