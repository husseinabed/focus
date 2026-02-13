import { defineStore } from 'pinia';
import type { Conversation, Message, ConversationFilters, ConversationSort, GetConversationsResponse } from '~/types/inbox';

interface InboxState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messagesByConversationId: Record<string, Message[]>;
  filters: ConversationFilters;
  sort: ConversationSort;
  nextCursor: string | null;
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
      status: 'all',
      channel: 'all',
      intent: 'all',
      unreadOnly: false,
    },
    sort: {
      sortBy: 'recent',
      sortDirection: 'desc',
    },
    nextCursor: null,
    inspectorOpen: false,
    loadingConversations: false,
    loadingMessages: false,
  }),
  getters: {
    filteredConversations: (state) => {
      return state.conversations;
    },
    conversationMessages: (state) => (conversationId: string) => {
      return state.messagesByConversationId[conversationId] || [];
    },
  },
  actions: {
    async fetchConversations(loadMore = false): Promise<{ error: any | null }> {
      this.loadingConversations = true;
      try {
        const queryParams: Record<string, any> = {
          q: this.filters.q,
          status: this.filters.status,
          channel: this.filters.channel,
          unreadOnly: this.filters.unreadOnly,
          sortBy: this.sort.sortBy,
          sortDirection: this.sort.sortDirection,
          pageSize: 10,
        };

        if (loadMore && this.nextCursor) {
          queryParams.cursor = this.nextCursor;
        }

        const { data, error } = await useFetch<GetConversationsResponse>('/api/conversations', {
          query: queryParams,
        });

        if (error.value) {
          return { error: error.value };
        }

        if (data.value) {
          if (loadMore) {
            this.conversations.push(...data.value.items);
          } else {
            this.conversations = data.value.items;
          }
          this.nextCursor = data.value.nextCursor;
        }
        return { error: null };
      } catch (e) {
        return { error: e };
      } finally {
        this.loadingConversations = false;
      }
    },

    async fetchMessages(conversationId: string): Promise<{ error: any | null }> {
      this.loadingMessages = true;
      try {
        const { data, error } = await useFetch<Message[]>(`/api/conversations/${conversationId}/messages`);

        if (error.value) {
          return { error: error.value };
        }

        if (data.value) {
          this.messagesByConversationId[conversationId] = data.value;
        }
        return { error: null };
      } catch (e) {
        return { error: e };
      } finally {
        this.loadingMessages = false;
      }
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

    setFilter<T extends keyof ConversationFilters>(key: T, value: ConversationFilters[T]) {
      this.filters[key] = value;
      this.fetchConversations();
    },

    setSort<T extends keyof ConversationSort>(key: T, value: ConversationSort[T]) {
      this.sort[key] = value;
      this.fetchConversations();
    },

    async loadMoreConversations() {
      if (this.nextCursor) {
        await this.fetchConversations(true);
      }
    },

    clearFilters() {
      this.filters.q = '';
      this.filters.status = 'all';
      this.filters.channel = 'all';
      this.filters.intent = 'all';
      this.filters.unreadOnly = false;
      this.fetchConversations();
    },
  },
});
