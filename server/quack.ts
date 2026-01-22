const QUACK_BASE_URL = 'https://quack.us.com/api';

interface QuackMessage {
  id: string;
  to: string;
  from: string;
  task: string;
  timestamp: string;
  status: 'pending' | 'received';
  files?: { name: string; content: string; type: string }[];
}

interface QuackSendOptions {
  to: string;
  task: string;
  files?: { name: string; content: string; type: string }[];
}

class QuackClient {
  private inbox: string;

  constructor(inbox: string) {
    this.inbox = inbox;
    console.log(`[Quack] Initialized with inbox: ${inbox}`);
  }

  async getMessages(): Promise<QuackMessage[]> {
    try {
      const response = await fetch(`${QUACK_BASE_URL}/inbox/${this.inbox}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('[Quack] Error fetching messages:', error);
      return [];
    }
  }

  async send(options: QuackSendOptions): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await fetch(`${QUACK_BASE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: options.to,
          from: this.inbox,
          task: options.task,
          files: options.files || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[Quack] Message sent to ${options.to}: ${data.messageId}`);
      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error('[Quack] Error sending message:', error);
      return { success: false };
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${QUACK_BASE_URL}/receive/${messageId}`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('[Quack] Error marking message as read:', error);
      return false;
    }
  }

  async markComplete(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${QUACK_BASE_URL}/complete/${messageId}`, {
        method: 'POST'
      });
      if (response.ok) {
        console.log(`[Quack] Task ${messageId} marked as complete`);
      }
      return response.ok;
    } catch (error) {
      console.error('[Quack] Error marking task complete:', error);
      return false;
    }
  }

  async checkInboxWithAutoApprove(): Promise<QuackMessage[]> {
    try {
      const response = await fetch(`${QUACK_BASE_URL}/inbox/${this.inbox}?autoApprove=true`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('[Quack] Error fetching messages with autoApprove:', error);
      return [];
    }
  }

  getInbox(): string {
    return this.inbox;
  }
}

let quackInstance: QuackClient | null = null;

export function initQuack(inbox: string): QuackClient {
  quackInstance = new QuackClient(inbox);
  return quackInstance;
}

export function getQuack(): QuackClient | null {
  return quackInstance;
}

export { QuackClient, QuackMessage, QuackSendOptions };
