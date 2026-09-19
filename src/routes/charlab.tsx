import { createFileRoute } from "@tanstack/react-router";
import { CharLab } from "@/game/screens/CharLab";

/** Dev-only character line-up under the meadow's golden-hour light. /charlab?who=hero&cam=front */
export const Route = createFileRoute("/charlab")({
  ssr: false,
  component: CharLab,
});
