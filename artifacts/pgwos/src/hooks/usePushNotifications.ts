import { useState, useEffect } from "react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function getVapidKey(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/vapid-public-key`);
  const data = await res.json();
  return data.publicKey;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window);
    setPermission(Notification.permission);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          setIsSubscribed(!!sub);
        }
      });
    }
  }, []);

  const subscribe = async (morningEnabled: boolean, morningTime: string, eveningEnabled: boolean, eveningTime: string) => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const vapidKey = await getVapidKey();
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch(`${API_BASE}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, morningEnabled, morningTime, eveningEnabled, eveningTime }),
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
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
      console.error("Push unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTest = async () => {
    await fetch(`${API_BASE}/api/push/test`, { method: "POST" });
  };

  const updateSchedule = async (morningEnabled: boolean, morningTime: string, eveningEnabled: boolean, eveningTime: string) => {
    await fetch(`${API_BASE}/api/push/update-schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ morningEnabled, morningTime, eveningEnabled, eveningTime }),
    });
  };

  return { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe, sendTest, updateSchedule };
}
