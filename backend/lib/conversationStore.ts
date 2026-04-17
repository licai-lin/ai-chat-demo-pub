import prisma from "./prisma";
import type { Message, Role } from "./types";

export async function getConversation(sessionId: string): Promise<Message[]> {
  const rows = await prisma.conversation.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      content: true,
    },
  });

  return rows.map((row: { role: string; content: string }) => ({
    role: row.role as Role,
    content: row.content,
  }));
}

export async function saveMessage(sessionId: string, role: Role, content: string) {
  await prisma.conversation.create({
    data: {
      sessionId,
      role,
      content,
    },
  });
}
