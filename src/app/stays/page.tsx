import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { StayShowcaseExperience } from "@/components/trip-compass/stay-showcase-experience";

/** Renders the Airbnb-inspired stay showcase route. */
export default function StaysPage() {
  return (
    <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
      <StayShowcaseExperience />
    </ExperienceShell>
  );
}
