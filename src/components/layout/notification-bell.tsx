"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageCircle,
  CreditCard,
  Users,
  Heart,
  CheckCircle,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types";

type NotificationWithType = Notification;

function getIcon(type: NotificationType) {
  switch (type) {
    case "CHAT_MESSAGE":
      return <MessageCircle size={16} />;
    case "ESCROW_STATUS":
      return <CreditCard size={16} />;
    case "LEAD_ASSIGNED":
      return <Users size={16} />;
    case "LISTING_APPROVED":
      return <CheckCircle size={16} />;
    case "LISTING_LIKED":
      return <Heart size={16} />;
    default:
      return <Bell size={16} />;
  }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  async function handleNotificationClick(notification: NotificationWithType) {
    if (!notification.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [notification.id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    setOpen(false);
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--chayong-surface)]"
        style={{ color: "var(--chayong-text-sub)" }}
        aria-label="알림"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: "#ef4444" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border shadow-lg"
          style={{
            backgroundColor: "var(--chayong-bg)",
            borderColor: "var(--chayong-border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--chayong-divider)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
              알림
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium transition-colors hover:opacity-70"
                style={{ color: "var(--chayong-primary)" }}
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={28} style={{ color: "var(--chayong-text-caption)" }} />
                <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
                  알림이 없습니다
                </p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--chayong-surface)]"
                  style={{
                    borderBottom:
                      i < notifications.length - 1
                        ? "1px solid var(--chayong-divider)"
                        : "none",
                    backgroundColor: n.isRead ? undefined : "var(--chayong-primary-light)",
                  }}
                >
                  <span
                    className="mt-0.5 shrink-0"
                    style={{ color: n.isRead ? "var(--chayong-text-caption)" : "var(--chayong-primary)" }}
                  >
                    {getIcon(n.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--chayong-text)" }}
                    >
                      {n.title}
                    </p>
                    <p
                      className="mt-0.5 text-xs line-clamp-2"
                      style={{ color: "var(--chayong-text-sub)" }}
                    >
                      {n.message}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: "var(--chayong-text-caption)" }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: "var(--chayong-primary)" }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
