import { useState, useEffect } from "react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function getVapidKey(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/vapid-public-key`);
  if (!res.ok) throw new Error("Failed to fetch VAPID key");
  const data = await res.json();
  return data.publicKey as string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  const swUrl = `${API_BASE}/sw.js`;
  const scope = `${API_BASE}/`;
  try {
    const existing = await navigator.serviceWorker.getRegistration(scope);
    if (existing) return existing;
    return navigator.serviceWorker.register(swUrl, { scope });
  } catch {
    return navigator.serviceWorker.register(swUrl);
  }
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          setIsSubscribed(!!sub);
        }
      });
    }
  }, []);

  const subscribe = async (
    morningEnabled: boolean, morningTime: string, morningMessage: string,
    eveningEnabled: boolean, eveningTime: string, eveningMessage: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = await getOrRegisterSW();
      await navigator.serviceWorker.ready;

      const vapidKey = await getVapidKey();
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch(`${API_BASE}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subscription, 
          morningEnabled, morningTime, morningMessage, 
          eveningEnabled, eveningTime, eveningMessage 
        }),
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("[PGWOS] Push subscribe error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await fetch(`${API_BASE}/api/push/unsubscribe`, { method: "POST" });
      setIsSubscribed(false);
    } catch (err) {
      console.error("[PGWOS] Push unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTest = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/push/test`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.warn("[PGWOS] Test push failed:", body);
      }
    } catch (err) {
      console.error("[PGWOS] Test push error:", err);
    }
  };

  const updateSchedule = async (
    morningEnabled: boolean, morningTime: string, morningMessage: string,
    eveningEnabled: boolean, eveningTime: string, eveningMessage: string
  ): Promise<void> => {
    await fetch(`${API_BASE}/api/push/update-schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        morningEnabled, morningTime, morningMessage, 
        eveningEnabled, eveningTime, eveningMessage 
      }),
    });
  };

  return { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe, sendTest, updateSchedule };
}
