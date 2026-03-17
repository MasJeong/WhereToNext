import { rankDestinations } from "../src/lib/recommendation/engine";
import { goldenFixtures } from "../tests/unit/recommendation/golden-fixtures";

for (const fixture of goldenFixtures) {
  const topIds = rankDestinations(fixture.query)
    .slice(0, 3)
    .map((item) => item.destinationId)
    .join(",");

  console.log(`${fixture.name}:${topIds}`);
}
