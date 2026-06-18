import { useState, useEffect } from "react";
import { subscribeToPush } from "../lib/push";

export function usePushPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") await subscribeToPush();
  };

  return { permission, requestPermission };
}
