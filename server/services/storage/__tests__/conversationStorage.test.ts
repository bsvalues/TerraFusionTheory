import { conversationStorage } from '../conversationStorage';

describe('ConversationStorage', () => {
  it('should create, fetch, and update a conversation', async () => {
    // Create
    const newConversation = { projectId: 1, title: 'Test Conversation' };
    const created = await conversationStorage.createConversation(newConversation as any);
    expect(created.title).toBe('Test Conversation');

    // Fetch
    const fetched = await conversationStorage.getConversation(created.id);
    expect(fetched).toBeDefined();
    expect(fetched?.projectId).toBe(1);

    // Update
    const updated = await conversationStorage.updateConversation({ ...created, title: 'Updated Conversation' });
    expect(updated.title).toBe('Updated Conversation');
  });
});
