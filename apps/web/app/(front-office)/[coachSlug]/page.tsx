import { redirect } from "next/navigation";

export default async function CoachLandingPage(p: { params: Promise<{ coachSlug: string }> }) {
  const { coachSlug } = await p.params;
  redirect(`/${coachSlug}/services`);
}
