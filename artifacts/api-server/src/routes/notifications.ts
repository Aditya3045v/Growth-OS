import { Router } from "express";
import webpush from "web-push";

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BCDIgrotSkuwwqS7rYnpCPMXpJlWJ0TzkyDBUNvd0pz5I05eCjtgLFUoTn3GBtSHgHm6FLExHEM-84gJfyuJknw";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "S_M7rpG0NzLdJmPOr8YsCicuPUVQLX7b2033ivj5AZU";

webpush.setVapidDetails("mailto:pgwos@app.local", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

let pushSubscription: webpush.PushSubscription | null = null;

const scheduledJobs: NodeJS.Timeout[] = [];

function scheduleNotification(hour: number, minute: number, title: string, body: string) {
  const checkAndSend = () => {
    const now = new Date();
    if (now.getHours() === hour && now.getMinutes() === minute && pushSubscription) {
      webpush.sendNotification(pushSubscription, JSON.stringify({ title, body, tag: "pgwos-reminder" })).catch(() => {});
    }
  };
  const interval = setInterval(checkAndSend, 60000);
  scheduledJobs.push(interval);
  return interval;
}

function clearAllScheduled() {
  scheduledJobs.forEach(clearInterval);
  scheduledJobs.length = 0;
}

function setupSchedule(morningEnabled: boolean, morningTime: string, eveningEnabled: boolean, eveningTime: string) {
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

router.get("/api/vapid-public-key", (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post("/api/push/subscribe", (req, res) => {
  const { subscription, morningEnabled, morningTime, eveningEnabled, eveningTime } = req.body;
  if (!subscription) return res.status(400).json({ error: "No subscription" });
  pushSubscription = subscription;
  setupSchedule(
    morningEnabled ?? false,
    morningTime ?? "07:00",
    eveningEnabled ?? false,
    eveningTime ?? "21:00"
  );
  webpush.sendNotification(pushSubscription, JSON.stringify({
    title: "PGWOS Activated 🚀",
    body: "Push notifications are now enabled. You'll be reminded to check in daily!",
    tag: "pgwos-welcome"
  })).catch(() => {});
  res.json({ ok: true });
});

router.post("/api/push/unsubscribe", (_req, res) => {
  pushSubscription = null;
  clearAllScheduled();
  res.json({ ok: true });
});

router.post("/api/push/test", (_req, res) => {
  if (!pushSubscription) return res.status(400).json({ error: "No subscription" });
  webpush.sendNotification(pushSubscription, JSON.stringify({
    title: "Test Notification ✅",
    body: "PGWOS notifications are working perfectly!",
    tag: "pgwos-test"
  })).catch(console.error);
  res.json({ ok: true });
});

router.post("/api/push/update-schedule", (req, res) => {
  const { morningEnabled, morningTime, eveningEnabled, eveningTime } = req.body;
  setupSchedule(morningEnabled ?? false, morningTime ?? "07:00", eveningEnabled ?? false, eveningTime ?? "21:00");
  res.json({ ok: true });
});

export default router;
