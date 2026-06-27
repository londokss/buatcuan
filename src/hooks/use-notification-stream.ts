import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createNotificationEventSource, type NotificationDto } from "@/lib/api";

export function useNotificationStream(enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const source = createNotificationEventSource();
    if (!source) return;

    const onNotification = (event: MessageEvent) => {
      const notification = JSON.parse(event.data) as NotificationDto;
      qc.setQueryData<{ unreadCount: number }>(["notifications-unread"], (current) => ({
        unreadCount: (current?.unreadCount ?? 0) + 1,
      }));
      void qc.invalidateQueries({ queryKey: ["notifications"] });

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          tag: notification.id,
          icon: "/buatcuan-mark.svg",
        });
        browserNotification.onclick = () => {
          window.focus();
          if (notification.href) window.location.href = notification.href;
          browserNotification.close();
        };
      } else {
        toast.info(notification.title, { description: notification.body });
      }
    };

    const onMeta = (event: MessageEvent) => {
      const payload = JSON.parse(event.data) as { unreadCount: number };
      qc.setQueryData(["notifications-unread"], payload);
    };

    const onReady = (event: MessageEvent) => {
      const payload = JSON.parse(event.data) as { unreadCount: number };
      qc.setQueryData(["notifications-unread"], payload);
    };

    source.addEventListener("notification", onNotification);
    source.addEventListener("meta", onMeta);
    source.addEventListener("ready", onReady);
    source.onerror = () => {
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    };

    return () => {
      source.removeEventListener("notification", onNotification);
      source.removeEventListener("meta", onMeta);
      source.removeEventListener("ready", onReady);
      source.close();
    };
  }, [enabled, qc]);
}
