import { redirect } from "next/navigation";

// No API exists for this section yet (docs/checklist/legal-prd-gaps.md), so the route is not offered.
export default function Page() {
  redirect("/legal");
}
