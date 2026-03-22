import { Router, Request, Response } from "express";
import webpush from "web-push";

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn("VAPID keys not configured — push notifications disabled.");
} else {
  webpush.setVapidDetails("mailto:pgwos@app.local", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

let pushSubscription: webpush.PushSubscription | null = null;

const scheduledJobs: NodeJS.Timeout[] = [];

function sendPush(payload: object): void {
  if (!pushSubscription) return;
  webpush.sendNotification(pushSubscription, JSON.stringify(payload)).catch(() => {});
}

function scheduleNotification(hour: number, minute: number, title: string, body: string): void {
  const checkAndSend = () => {
    const now = new Date();
    if (now.getHours() === hour && now.getMinutes() === minute) {
      sendPush({ title, body, tag: "pgwos-reminder" });
    }
  };
  const interval = setInterval(checkAndSend, 60000);
  scheduledJobs.push(interval);
}

function clearAllScheduled(): void {
  scheduledJobs.forEach(clearInterval);
  scheduledJobs.length = 0;
}

function setupSchedule(morningEnabled: boolean, morningTime: string, eveningEnabled: boolean, eveningTime: string): void {
  clearAllScheduled();
  if (morningEnabled && morningTime) {
    const [h, m] = morningTime.split(":").map(Number);
    scheduleNotification(h, m, "Good Morning! 🌅", "Time for your daily check-in and habit review.");
  }
  if (eveningEnabled && eveningTime) {
    const [h, m] = eveningTime.split(":").map(Number);
    scheduleNotification(h, m, "Evening Reflection 🌙", "Review your progress and plan tomorrow.");
  }
}

router.get("/vapid-public-key", (_req: Request, res: Response): void => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || "" });
});

router.post("/push/subscribe", (req: Request, res: Response): void => {
  const { subscription, morningEnabled, morningTime, eveningEnabled, eveningTime } = req.body;
  if (!subscription) {
    res.status(400).json({ error: "No subscription" });
    return;
  }
  pushSubscription = subscription as webpush.PushSubscription;
  setupSchedule(
    morningEnabled ?? false,
    morningTime ?? "07:00",
    eveningEnabled ?? false,
    eveningTime ?? "21:00"
  );
  sendPush({
    title: "PGWOS Activated 🚀",
    body: "Push notifications are now enabled. You'll be reminded to check in daily!",
    tag: "pgwos-welcome"
  });
  res.json({ ok: true });
});

router.post("/push/unsubscribe", (_req: Request, res: Response): void => {
  pushSubscription = null;
  clearAllScheduled();
  res.json({ ok: true });
});

router.post("/push/test", (_req: Request, res: Response): void => {
  if (!pushSubscription) {
    res.status(400).json({ error: "No subscription" });
    return;
  }
  sendPush({
    title: "Test Notification ✅",
    body: "PGWOS notifications are working perfectly!",
    tag: "pgwos-test"
  });
  res.json({ ok: true });
});

router.post("/push/update-schedule", (req: Request, res: Response): void => {
  const { morningEnabled, morningTime, eveningEnabled, eveningTime } = req.body;
  setupSchedule(morningEnabled ?? false, morningTime ?? "07:00", eveningEnabled ?? false, eveningTime ?? "21:00");
  res.json({ ok: true });
});

export default router;
