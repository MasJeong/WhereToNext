import { ZodError } from "zod";

import { getDestinationById } from "@/lib/catalog/service";

function buildUnknownDestinationError() {
  return new ZodError([
    {
      code: "custom",
      message: "UNKNOWN_DESTINATION",
      path: ["destinationId"],
    },
  ]);
}

/**
 * 현재 active 목적지 카탈로그에 존재하는 ID인지 확인한다.
 * @param destinationId 검증할 목적지 ID
 * @returns Promise<void>
 */
export async function assertKnownDestinationId(destinationId: string): Promise<void> {
  const destination = await getDestinationById(destinationId, { activeOnly: true });

  if (!destination) {
    throw buildUnknownDestinationError();
  }
}
