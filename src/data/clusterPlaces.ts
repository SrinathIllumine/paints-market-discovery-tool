import { CLUSTERS } from "./clusters";

export type ClusterPlacesConfig = { textQuery: string };

const DEFAULT: ClusterPlacesConfig = { textQuery: "construction projects in Panvel" };

export function clusterPlacesConfig(clusterId: string): ClusterPlacesConfig {
  const c = CLUSTERS.find((x) => x.id === clusterId);
  return c ? { textQuery: c.placesQuery } : DEFAULT;
}
