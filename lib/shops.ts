import demoData from "@/data/demo-shops.json";
import type { Shop } from "./types";

export function getShops(): Shop[] {
  return demoData.shops as Shop[];
}
