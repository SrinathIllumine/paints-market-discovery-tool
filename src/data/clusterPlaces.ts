// Maps cluster IDs to Places API (New) search hints.
// `includedTypes` for searchNearby; `textQuery` for searchText fallback.

export type ClusterPlacesConfig = {
  textQuery: string;
  includedTypes?: string[];
};

const DEFAULT: ClusterPlacesConfig = {
  textQuery: "construction projects in Panvel",
};

const MAP: Record<string, ClusterPlacesConfig> = {
  "large-townships": { textQuery: "residential township projects in Panvel" },
  "mid-apartments": { textQuery: "apartment buildings in Panvel" },
  "redevelopment": { textQuery: "redevelopment housing projects in Panvel" },
  "affordable": { textQuery: "affordable housing in Panvel" },
  "independent": { textQuery: "independent houses Panvel" },
  "luxury": { textQuery: "luxury villas in Panvel" },
  "rowhouse": { textQuery: "row house gated community Panvel" },
  "farmhouse": { textQuery: "farmhouses near Panvel Karnala" },

  "taloja-midc": { textQuery: "Taloja MIDC industrial plot" },
  "warehouses": { textQuery: "warehouse logistics park Panvel JNPT" },
  "cold-storage": { textQuery: "cold storage Panvel" },

  "offices": { textQuery: "office complex Panvel Kharghar" },
  "retail": { textQuery: "shopping mall Panvel" },
  "mixed-use": { textQuery: "mixed use development Panvel" },

  "highway": { textQuery: "highway hotel Mumbai Pune expressway Panvel" },
  "hotels": { textQuery: "hotels resorts Panvel Karnala" },
  "airport": { textQuery: "Navi Mumbai airport Ulwe development" },

  "hardware-market": { textQuery: "hardware building material market Panvel" },
  "contractor-hub": { textQuery: "civil contractor Panvel" },
  "labour-naka": { textQuery: "labour naka Panvel" },

  "schools": { textQuery: "schools colleges Panvel" },
  "hospitals": { textQuery: "hospitals Panvel" },
  "govt": { textQuery: "government office Panvel municipal" },

  "old-society-renov": { textQuery: "old society Panvel" },
  "interior-upgrade": { textQuery: "interior design apartments Panvel" },
  "facade-repair": { textQuery: "waterproofing facade Panvel" },

  "village-pucca": { textQuery: "village house Adai Wavanje Panvel" },
  "semi-urban-plots": { textQuery: "residential plots Karjat Panvel" },
};

export function clusterPlacesConfig(clusterId: string): ClusterPlacesConfig {
  return MAP[clusterId] ?? DEFAULT;
}
