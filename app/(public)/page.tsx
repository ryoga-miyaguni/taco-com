import { MapView } from "@/components/MapView";
import { getShops } from "@/lib/shops";

export default function HomePage() {
  const shops = getShops();
  return <MapView shops={shops} />;
}
