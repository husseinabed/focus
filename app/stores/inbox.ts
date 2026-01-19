import { defineStore } from 'pinia';
import type { Conversation, Message } from '~/types/inbox';

interface InboxState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messagesByConversationId: Record<string, Message[]>;
  filters: {
    q: string;
    state: 'open' | 'needs_approval' | 'replied' | 'closed';
  };
  inspectorOpen: boolean;
  loadingConversations: boolean;
  loadingMessages: boolean;
}

export const useInboxStore = defineStore('inbox', {
  state: (): InboxState => ({
    conversations: [],
    currentConversation: null,
    messagesByConversationId: {},
    filters: {
      q: '',
      state: 'open',
    },
    inspectorOpen: false,
    loadingConversations: false,
    loadingMessages: false,
  }),
  getters: {
    filteredConversations: (state) => {
      let filtered = state.conversations;
      if (state.filters.q) {
        const query = state.filters.q.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.lead.company_name.toLowerCase().includes(query) ||
            c.lead.full_name?.toLowerCase().includes(query) ||
            c.last_message_preview.toLowerCase().includes(query)
        );
      }
      if (state.filters.state !== 'open') {
        filtered = filtered.filter(
          (c) => c.status === state.filters.state
        );
      }
      return filtered;
    },
    conversationMessages: (state) => (conversationId: string) => {
      return state.messagesByConversationId[conversationId] || [];
    },
  },
  actions: {
    async fetchConversations() {
      this.loadingConversations = true;
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.conversations = [
        {
          id: '1',
          lead_id: 'lead-1',
          lead: {
            id: 'lead-1',
            company_name: 'Acme Corp',
            full_name: 'John Doe',
            phone: '+1234567890',
            language: 'en',
            status: 'new',
            priority: 'medium',
            source: 'manual',
          },
          last_message_preview: 'Hey, I am interested in your services.',
          last_message_at: new Date().toISOString(),
          unread: true,
          needs_approval: false,
          stopped: false,
          status: 'open',
        },
        {
          id: '2',
          lead_id: 'lead-2',
          lead: {
            id: 'lead-2',
            company_name: 'Globex Inc',
            full_name: 'Jane Smith',
            phone: '+1987654321',
            language: 'he',
            status: 'contacted',
            priority: 'high',
            source: 'manual',
          },
          last_message_preview: 'I need approval for the last message.',
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          unread: false,
          needs_approval: true,
          stopped: false,
          status: 'needs_approval',
        },
      ];
      this.loadingConversations = false;
    },

    async fetchMessages(conversationId: string) {
      this.loadingMessages = true;
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.messagesByConversationId[conversationId] = [
        {
          id: 'm1',
          conversation_id: conversationId,
          sender_type: 'lead',
          content: 'Hello, I want to learn more!',
          created_at: new Date(Date.now() - 600000).toISOString(),
          status: 'delivered',
        },
        {
          id: 'm2',
          conversation_id: conversationId,
          sender_type: 'agent',
          content: 'Sure, what would you like to know?',
          created_at: new Date(Date.now() - 300000).toISOString(),
          status: 'read',
        },
      ];
      this.loadingMessages = false;
    },

    setCurrentConversation(conversation: Conversation | null) {
      this.currentConversation = conversation;
      if (conversation && !this.messagesByConversationId[conversation.id]) {
        this.fetchMessages(conversation.id);
      }
    },

    toggleInspector() {
      this.inspectorOpen = !this.inspectorOpen;
    },

    clearFilters() {
      this.filters.q = '';
      this.filters.state = 'open';
    },
  },
});
