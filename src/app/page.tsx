import { Suspense } from "react";

import { HomeExperience } from "@/components/trip-compass/home-experience";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeExperience />
    </Suspense>
  );
}
