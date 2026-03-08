/**
 * API liability service: fetches liabilities from an external API endpoint.
 */

/**
 * Extract a nested value from an object using a dot-separated path.
 * e.g. extractPath({ data: { total: 100 } }, "data.total") => 100
 */
function extractPath(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Fetch total liabilities from an external API.
 *
 * @param apiUrl - Full URL to fetch
 * @param jsonPath - Dot-separated path to extract the liability value from the JSON response
 *                   e.g. "data.totalLiabilities" or "total_supply"
 * @returns BigInt of total liabilities
 */
export async function fetchApiLiabilities(
  apiUrl: string,
  jsonPath: string
): Promise<bigint> {
  const res = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `API liability fetch failed: ${res.status} ${res.statusText} from ${apiUrl}`
    );
  }

  const data = await res.json();
  const value = extractPath(data, jsonPath);

  if (value === undefined || value === null) {
    throw new Error(
      `API liability: path "${jsonPath}" not found in response from ${apiUrl}`
    );
  }

  const numStr = String(value).replace(/[^0-9.]/g, "");
  if (!numStr || isNaN(Number(numStr))) {
    throw new Error(
      `API liability: value at "${jsonPath}" is not a valid number: ${value}`
    );
  }

  // Handle decimal values by converting to integer (assumes raw units if integer, or parse float)
  if (numStr.includes(".")) {
    // Float value — assume it's already in human-readable units, convert to wei-like (18 decimals)
    const float = parseFloat(numStr);
    return BigInt(Math.round(float * 1e18));
  }

  return BigInt(numStr);
}
