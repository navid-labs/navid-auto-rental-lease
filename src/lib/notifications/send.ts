import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type SendNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
};

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength);
}

export async function sendNotification(input: SendNotificationInput): Promise<void> {
  const title = truncate(input.title, 100);
  const message = truncate(input.message, 500);

  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title,
        message,
        ...(input.linkUrl === undefined ? {} : { linkUrl: input.linkUrl }),
      },
    });
  } catch (error) {
    console.error("sendNotification error:", error);
    throw error;
  }
}

export async function sendBulkNotifications(inputs: SendNotificationInput[]): Promise<void> {
  await Promise.all(inputs.map((input) => sendNotification(input)));
}
