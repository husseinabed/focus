import { defineStore } from 'pinia'
import { useNuxtApp, useSupabaseClient, useSupabaseUser } from '#imports'
import { useLocalStorage } from '@vueuse/core'

interface WorkspaceMembership {
  workspace_id: string
  role: 'owner' | 'admin' | 'agent' | 'viewer'
  workspace?: {
    id: string
    name: string
    slug?: string
    default_locale?: 'he' | 'ar' | 'en'
  }
}

const local = {
  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  get<T>(key: string): T | null {
    const value = localStorage.getItem(key)
    if (!value) return null
    return JSON.parse(value) as T
  },
  remove(key: string) {
    localStorage.removeItem(key)
  },
}
const activeWorkspaceId = useLocalStorage<string | null>('legalcms:admin:workspace_id', null);
const memberships = useLocalStorage<WorkspaceMembership[]>('legalcms:admin:workspace_memberships', []);
 


export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    activeWorkspaceId: activeWorkspaceId,
    memberships: memberships,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    hasWorkspace(state): boolean {
      return !!state.activeWorkspaceId
    },
    activeMembership(state): WorkspaceMembership | null {
      return state.memberships.find(
        (m) => m.workspace_id === state.activeWorkspaceId
      ) || null
    },
    activeRole(state): WorkspaceMembership['role'] | null {
      return this.activeMembership?.role ?? null
    },
    isOwnerOrAdmin(state): boolean {
      const role = this.activeRole
      return role === 'owner' || role === 'admin'
    },
  },

  actions: {
    async bootstrap(user?: any) {
      this.loading = true
      this.error = null
      const currentUser = user || useSupabaseUser().value
      console.log('WorkspaceStore: bootstrap - currentUser:', currentUser)

      if (!currentUser) {
        console.log('WorkspaceStore: bootstrap - No current user, clearing workspace.')
        this.clear()
        this.loading = false
        return
      }

      await this.fetchMemberships(currentUser)

      console.log('WorkspaceStore: bootstrap - activeWorkspaceId before check:', this.activeWorkspaceId)
      console.log('WorkspaceStore: bootstrap - memberships before check:', this.memberships)

      if (
        !this.activeWorkspaceId ||
        !this.memberships.some((m) => m.workspace_id === this.activeWorkspaceId)
      ) {
        this.activeWorkspaceId = this.memberships[0]?.workspace_id || null
        console.log('WorkspaceStore: bootstrap - activeWorkspaceId after (re)setting:', this.activeWorkspaceId)
      }

      this.loading = false
    },

    async fetchMemberships(user?: any) {
      const incomingUserId = user?.id ?? user?.sub
      console.log('WorkspaceStore: fetchMemberships - starting for user:', incomingUserId)
      this.loading = true
      this.error = null
      const client = useSupabaseClient()
      let effectiveUser = user; // Prioritize the user passed as argument

      if (!effectiveUser) {
        console.log("WorkspaceStore: fetchMemberships - User argument is undefined. Attempting to get from useSupabaseUser().value.");
        effectiveUser = useSupabaseUser().value;
      }

      if (!effectiveUser) {
        console.log("WorkspaceStore: fetchMemberships - No effective user found. Clearing memberships and returning.");
        this.memberships = [];
        this.loading = false;
        this.error = "User not available for fetching memberships.";
        return;
      }

      const effectiveUserId = effectiveUser?.id ?? effectiveUser?.sub
      console.log("WorkspaceStore: fetchMemberships - Using effective user ID:", effectiveUserId);
      if (!effectiveUserId) {
        this.memberships = [];
        this.loading = false;
        this.error = "User id not available for fetching memberships.";
        return;
      }

      const { data, error } = await client
        .from('workspace_members')
        .select('workspace_id, role, workspaces:workspace_id ( id, name, slug, default_locale )')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: true })

      if (error) {
        this.error = error.message
        this.memberships = []
      } else {
        this.memberships = data as WorkspaceMembership[]
      }
      this.loading = false

    },

    async setActiveWorkspace(workspaceId: string) {
      this.activeWorkspaceId = workspaceId
      const { $i18n } = useNuxtApp()
      const activeWs = this.activeMembership?.workspace
      if (activeWs?.default_locale) {
        $i18n.locale.value = activeWs.default_locale
      }
    },

    clear() {
      this.activeWorkspaceId = null
      this.memberships = []
      this.error = null
      this.loading = false
      localStorage.removeItem('legalcms:admin:workspace_id')
      localStorage.removeItem('legalcms:admin:workspace_memberships')
    },
  },
})
