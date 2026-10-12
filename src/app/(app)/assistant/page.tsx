import { ASSISTANT_NAME } from "@/lib/assistant";
import { AssistantClient } from "./AssistantClient";

export default function AssistantPage() {
  return <AssistantClient name={ASSISTANT_NAME} />;
}
