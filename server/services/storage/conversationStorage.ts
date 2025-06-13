import { db } from '../../db';
import { conversations, type Conversation, type InsertConversation } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export class ConversationStorage {
  async getConversation(id: number): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async getConversationByProjectId(projectId: number): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.projectId, projectId));
    return result[0];
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }

  async updateConversation(conversation: Conversation): Promise<Conversation> {
    const [updated] = await db.update(conversations).set(conversation).where(eq(conversations.id, conversation.id)).returning();
    return updated;
  }
}

export const conversationStorage = new ConversationStorage();
