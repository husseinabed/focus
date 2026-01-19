import { ref, computed } from "vue";
import type { Lead } from "~/types/leads";

interface UseLeadsOptions {
  q?: string;
  status?: string;
  source?: string;
  language?: string;
  city?: string;
  has_website?: boolean;
  has_phone?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export function useLeads(options: UseLeadsOptions) {
  const { q, status, source, language, city, has_website, has_phone, page, pageSize, sort } = options;

  // Dummy data for now
  const allLeads: Lead[] = [
    {
      id: "1",
      full_name: "John Doe",
      company_name: "Acme Corp",
      tags: ["tech"],
      status: "new",
      source: "google_maps",
      phone: "123-456-7890",
      city: "New York",
      updated_at: new Date().toISOString(),
      priority: "high",
      language: "en",
    },
    {
      id: "2",
      full_name: "Jane Smith",
      company_name: "Globex Inc",
      tags: ["marketing"],
      status: "contacted",
      source: "manual",
      phone: "098-765-4321",
      city: "London",
      updated_at: new Date().toISOString(),
      priority: "medium",
      language: "en",
    },
    {
      id: "3",
      full_name: "Peter Jones",
      company_name: "Stark Industries",
      tags: ["development"],
      status: "qualified",
      source: "import",
      phone: "111-222-3333",
      city: "New York",
      updated_at: new Date().toISOString(),
      priority: "low",
      language: "en",
    },
    {
      id: "4",
      full_name: "Alice Brown",
      company_name: "Wayne Enterprises",
      tags: ["sales"],
      status: "proposal",
      source: "google_maps",
      phone: "444-555-6666",
      city: "London",
      updated_at: new Date().toISOString(),
      priority: "high",
      language: "en",
    },
    {
      id: "5",
      full_name: "Robert White",
      company_name: "Cyberdyne Systems",
      tags: ["tech"],
      status: "won",
      source: "manual",
      phone: "777-888-9999",
      city: "Paris",
      updated_at: new Date().toISOString(),
      priority: "medium",
      language: "en",
    },
  ];

  const filteredLeads = computed(() => {
    let tempLeads = allLeads;

    if (q) {
      tempLeads = tempLeads.filter(
        (lead) =>
          (lead.full_name && lead.full_name.toLowerCase().includes(q.toLowerCase())) ||
          lead.company_name.toLowerCase().includes(q.toLowerCase()) ||
          (lead.city && lead.city.toLowerCase().includes(q.toLowerCase()))
      );
    }
    if (status && status !== "all") {
      tempLeads = tempLeads.filter((lead) => lead.status === status);
    }
    if (source && source !== "any") {
      tempLeads = tempLeads.filter((lead) => lead.source === source);
    }
    if (language && language !== "any") {
      tempLeads = tempLeads.filter((lead) => lead.language === language);
    }
    if (city) {
      tempLeads = tempLeads.filter(
        (lead) => lead.city && lead.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    // has_website and has_phone logic omitted as fields are optional/missing in dummy data used here simply

    // Sorting
    if (sort) {
      tempLeads = [...tempLeads].sort((a, b) => {
        if (sort === "created_at desc") {
            // using updated_at as proxy
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime(); 
        } else if (sort === "updated_at desc") {
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        } else if (sort === "priority desc") {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        }
        return 0;
      });
    }

    return tempLeads;
  });

  const totalLeads = computed(() => filteredLeads.value.length);

  const paginatedLeads = computed(() => {
    const start = ((page || 1) - 1) * (pageSize || 10);
    const end = start + (pageSize || 10);
    return filteredLeads.value.slice(start, end);
  });

  const aggregatedCounts = computed(() => ({
    total: allLeads.length,
    new: allLeads.filter((lead) => lead.status === "new").length,
    pending_approval: 0, // Placeholder
    replied_today: 0, // Placeholder
  }));

  return {
    leads: paginatedLeads,
    total: totalLeads,
    aggregatedCounts,
  };
}
