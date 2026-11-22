const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_URL = (configuredApiUrl || "https://api.urbanhelphub.com/api").replace(/\/$/, "");
