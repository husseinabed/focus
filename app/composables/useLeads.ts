import { computed, reactive, ref, watch } from "vue";
import { useSupabaseClient } from "#imports";
import { useWorkspaceStore } from "~/stores/workspace";
import type { AggregatedCounts, Lead } from "~/types/leads";

interface UseLeadsOptions {
  // Reserved for future options.
}

const EMPTY_COUNTS: AggregatedCounts = {
  total: 0,
  new: 0,
  pending_approval: 0,
  replied_today: 0,
};

export function useLeads(options: UseLeadsOptions = {}) {
  const supabase = useSupabaseClient();
  const workspaceStore = useWorkspaceStore();
  const workspaceId = computed(() => workspaceStore.activeWorkspaceId);

  const filters = reactive({
    q: "",
    status: undefined as string | undefined,
    source: undefined as string | undefined,
    language: undefined as string | undefined,
    city: "",
    has_website: false,
    has_phone: false,
  });

  const sort = ref("created_at desc");
  const page = ref(1);
  const pageCount = ref(10);
  const pending = ref(false);
  const error = ref<string | null>(null);
  const leads = ref<Lead[]>([]);
  const total = ref(0);
  const aggregatedCounts = ref<AggregatedCounts>({ ...EMPTY_COUNTS });

  const resolveSort = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (
      value &&
      typeof value === "object" &&
      typeof (value as { value?: string }).value === "string"
    ) {
      return (value as { value: string }).value;
    }
    return "created_at desc";
  };

  const applyFilters = (query: any) => {
    if (!workspaceId.value) {
      return query;
    }

    let filtered = query.eq("workspace_id", workspaceId.value);

    if (filters.q) {
      const searchTerm = filters.q.trim();
      if (searchTerm) {
        filtered = filtered.or(
          `full_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`
        );
      }
    }
    if (filters.status) {
      filtered = filtered.eq("status", filters.status);
    }
    if (filters.source) {
      filtered = filtered.eq("source", filters.source);
    }
    if (filters.language) {
      filtered = filtered.eq("language", filters.language);
    }
    if (filters.city) {
      filtered = filtered.ilike("city", `%${filters.city}%`);
    }
    if (filters.has_website) {
      filtered = filtered.not("website", "is", null).neq("website", "");
    }
    if (filters.has_phone) {
      filtered = filtered.not("phone", "is", null).neq("phone", "");
    }

    return filtered;
  };

  const applySort = (query: any) => {
    const sortString = resolveSort(sort.value);
    const [sortKey, sortDir] = sortString.split(" ");
    const ascending = sortDir === "asc";
    const column =
      sortKey === "name" ? "full_name" : sortKey === "last_activity" ? "updated_at" : sortKey;

    return query.order(column, { ascending, nullsFirst: false });
  };

  const fetchLeads = async () => {
     
    if (!workspaceId.value) {
      leads.value = [];
      total.value = 0;
      return;
    }

    pending.value = true;
    error.value = null;
  console.log(error.value);
    try {
      const from = (page.value - 1) * pageCount.value;
      const to = from + pageCount.value - 1;

      let query = supabase
        .from("leads")
        .select(
          "id, full_name, company_name, tags, status, source, phone, city, updated_at, priority, language, created_at, website",
          { count: "exact" }
        );

      query = applyFilters(query);
      query = applySort(query);

      const { data, error: queryError, count } = await query.range(from, to);
     
        
      if (queryError) {
        throw queryError;
      }

      leads.value =
        (data as Lead[] | null)?.map((lead) => ({
          ...lead,
          last_activity: lead.last_activity || lead.updated_at,
          whatsapp_capable:
            typeof lead.whatsapp_capable === "boolean"
              ? lead.whatsapp_capable
              : !!lead.phone,
        })) || [];
      total.value = count ?? 0;
    } catch (err: any) {
      error.value = err?.message || "Failed to load leads.";
    } finally {
      pending.value = false;
    }
  };

  const fetchAggregates = async () => {
    if (!workspaceId.value) {
      aggregatedCounts.value = { ...EMPTY_COUNTS };
      return;
    }

    try {
      const [totalResult, newResult] = await Promise.all([
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId.value),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId.value)
          .eq("status", "new"),
      ]);

      if (totalResult.error) {
        throw totalResult.error;
      }
      if (newResult.error) {
        throw newResult.error;
      }

      aggregatedCounts.value = {
        total: totalResult.count ?? 0,
        new: newResult.count ?? 0,
        pending_approval: 0,
        replied_today: 0,
      };
    } catch (err: any) {
      error.value = err?.message || "Failed to load lead counts.";
    }
  };

  const refresh = async () => {
    await Promise.all([fetchLeads(), fetchAggregates()]);
  };

  watch(
    () => [
      workspaceId.value,
      filters.q,
      filters.status,
      filters.source,
      filters.language,
      filters.city,
      filters.has_website,
      filters.has_phone,
    ],
    () => {
      if (page.value !== 1) {
        page.value = 1;
        return;
      }
      refresh();
    },
    { immediate: true }
  );

  watch([page, pageCount, sort], () => {
    refresh();
  });

  if (typeof window !== "undefined") {
    (window as any).leadsComposableState = {
      filters,
      sort,
      page,
      pageCount,
      pending,
      error,
      leads,
      total,
      aggregatedCounts,
    };
    console.log(
      "useLeads state exposed for debugging. 'leadsComposableState' object available in console."
    );
  }

  return {
    leads,
    total,
    aggregatedCounts,
    pending,
    error,
    refresh,
    filters,
    sort,
    page,
    pageCount,
  };
}
