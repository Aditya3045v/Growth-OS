import { Router } from "express";
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

router.get("/vapid-public-key", (_req: any, res: any): void => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || "" });
});

router.post("/push/subscribe", async (req: any, res: any): Promise<void> => {
  const { 
    subscription, 
    morningEnabled, morningTime, morningMessage,
    eveningEnabled, eveningTime, eveningMessage,
    timezoneOffset
  } = req.body as {
    subscription: any;
    morningEnabled?: boolean;
    morningTime?: string;
    morningMessage?: string;
    eveningEnabled?: boolean;
    eveningTime?: string;
    eveningMessage?: string;
    timezoneOffset?: number;
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
      timezoneOffset: timezoneOffset ?? 0,
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

router.post("/push/unsubscribe", async (req: any, res: any): Promise<void> => {
  const { endpoint } = req.body as { endpoint: string };
  if (endpoint) {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  }
  res.json({ ok: true });
});

router.post("/push/test", async (req: any, res: any): Promise<void> => {
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

router.post("/push/update-schedule", async (req: any, res: any): Promise<void> => {
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

// Motivational quotes pool
const QUOTES = [
  "Your only limit is your mind. 🧠", "Small steps daily lead to giant leaps yearly. 🚀",
  "Discipline is choosing between what you want now and what you want most. 💪",
  "Success is the sum of small efforts, repeated day in and day out. ⚡",
  "The secret of getting ahead is getting started. 🌟",
  "Don't count the days, make the days count. 🔥",
  "One workout away from a good mood. 💯",
  "You don't have to be great to start, but you have to start to be great. 🎯",
  "Push yourself, because no one else is going to do it for you. 💥",
  "Your future is created by what you do today, not tomorrow. ⏰",
  "Wake up with determination. Go to bed with satisfaction. 🌙",
  "Dream big. Start small. Act now. 🌈",
  "Excellence is not a skill, it's an attitude. 🦅",
  "The harder you work for something, the greater you'll feel when you achieve it. 🏆",
  "Work hard in silence. Let success make the noise. 🤫",
  "You are one decision away from a totally different life. ✨",
  "Be so good they can't ignore you. 🎭",
  "It always seems impossible until it's done. Nelson Mandela 🌍",
  "Champions keep playing until they get it right. 🥇",
  "Your comfort zone is a beautiful place, but nothing ever grows there. 🌱",
  "The only way to do great work is to love what you do. 🫶",
  "Strive for progress, not perfection. 📈",
  "Every expert was once a beginner. 🌄",
  "Success is not final, failure is not fatal. Winston Churchill 🎖️",
  "You miss 100% of the shots you don't take. Wayne Gretzky 🏒",
  "Stay hungry. Stay foolish. Steve Jobs 🍎",
  "You are stronger than you think. 💫",
  "Do it now. Sometimes 'later' becomes 'never'. ⚡",
  "Believe you can and you're halfway there. 🏁",
  "Take care of your body. It's the only place you have to live. 🏃",
  "Rise and grind. Every day is a new opportunity. ☀️",
  "Focus on being productive instead of busy. 🧩",
  "Great things never came from comfort zones. 🦁",
  "Today's pain is tomorrow's power. 💪",
  "You can do anything you set your mind to. 🎯",
  "The best time to plant a tree was 20 years ago. The second best time is now. 🌳",
  "Hustle until your haters ask if you're hiring. 😎",
  "Make each day your masterpiece. John Wooden 🖼️",
  "Success is walking from failure to failure with no loss of enthusiasm. Churchill 🚶",
  "Winners never quit and quitters never win. Vince Lombardi 🏅",
];

// CRON Endpoint for Vercel / External Scheduler
router.get("/push/cron", async (req: any, res: any): Promise<void> => {
  const now = new Date(); // Server Time (UTC in Vercel)
  
  console.log(`[PGWOS-CRON] Processing notifications at ${now.toISOString()}`);

  // Fetch ALL subscriptions
  const allSubs = await db.select().from(pushSubscriptionsTable).where(
    or(
      eq(pushSubscriptionsTable.morningEnabled, true),
      eq(pushSubscriptionsTable.eveningEnabled, true)
    )
  );

  // Also fetch all subscriptions (to get ones with hourly/task prefs stored in subscription metadata)
  const allSubsRaw = await db.select().from(pushSubscriptionsTable);

  let processedCount = 0;

  // Get incomplete tasks count (shared for all task-reminder subs)
  let incompleteTasks = 0;
  try {
    const { tasksTable } = await import("@workspace/db");
    const { ne } = await import("drizzle-orm");
    const tasks = await db.select().from(tasksTable).where(ne(tasksTable.status, "completed"));
    incompleteTasks = tasks.length;
  } catch (_) {}

  for (const sub of allSubsRaw) {
    // Calculate User Local Time
    const userLocalTime = new Date(now.getTime() + (sub.timezoneOffset || 0) * 60000);
    const hours = String(userLocalTime.getUTCHours()).padStart(2, '0');
    const mins = String(userLocalTime.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${mins}`;
    const localHour = userLocalTime.getUTCHours();
    const isDaytime = localHour >= 7 && localHour <= 22;

    const isMorning = sub.morningEnabled && sub.morningTime === currentTime;
    const isEvening = sub.eveningEnabled && sub.eveningTime === currentTime;

    if (isMorning) {
      processedCount++;
      await sendPushToSubscription(sub.subscription, {
        title: "Good Morning! 🌅",
        body: sub.morningMessage || "Time for your daily check-in.",
        tag: "pgwos-reminder",
        icon: "/favicon.svg"
      });
    }

    if (isEvening) {
      processedCount++;
      await sendPushToSubscription(sub.subscription, {
        title: "Evening Reflection 🌙",
        body: sub.eveningMessage || "Review your day.",
        url: "/?action=checkin",
        tag: "pgwos-reminder",
        icon: "/favicon.svg"
      });
    }

    // Hourly quotes (7am–10pm only, at :00)
    const subExtra = (sub.subscription as any)?._extra || {};
    const hourlyEnabled = subExtra.hourlyQuotesEnabled === true;
    const taskRemindEnabled = subExtra.taskReminderEnabled === true;

    if (isDaytime && hourlyEnabled && mins === "00") {
      processedCount++;
      const quote = QUOTES[Math.floor(localHour * 1.7 + now.getDate()) % QUOTES.length];
      await sendPushToSubscription(sub.subscription, {
        title: "Hourly Boost 💡",
        body: quote,
        tag: "pgwos-quote",
        icon: "/favicon.svg"
      });
    }

    // Task reminders (hourly, 7am–10pm, only if incomplete tasks exist)
    if (isDaytime && taskRemindEnabled && mins === "00" && incompleteTasks > 0) {
      processedCount++;
      await sendPushToSubscription(sub.subscription, {
        title: `${incompleteTasks} Task${incompleteTasks > 1 ? 's' : ''} Pending ⚡`,
        body: "You have unfinished tasks. Let's get them done!",
        tag: "pgwos-tasks",
        icon: "/favicon.svg",
        url: "/tasks"
      });
    }
  }

  res.json({ processed: processedCount, scanned: allSubsRaw.length });
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
