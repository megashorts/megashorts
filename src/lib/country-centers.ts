export interface CountryCenter {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const countryCenters: Record<string, CountryCenter> = {
  AR: { code: "AR", name: "Argentina", latitude: -38.4, longitude: -63.6 },
  AU: { code: "AU", name: "Australia", latitude: -25.3, longitude: 133.8 },
  BR: { code: "BR", name: "Brazil", latitude: -14.2, longitude: -51.9 },
  CA: { code: "CA", name: "Canada", latitude: 56.1, longitude: -106.3 },
  CH: { code: "CH", name: "Switzerland", latitude: 46.8, longitude: 8.2 },
  CL: { code: "CL", name: "Chile", latitude: -35.7, longitude: -71.5 },
  CN: { code: "CN", name: "China", latitude: 35.9, longitude: 104.2 },
  CO: { code: "CO", name: "Colombia", latitude: 4.6, longitude: -74.1 },
  DE: { code: "DE", name: "Germany", latitude: 51.2, longitude: 10.5 },
  ES: { code: "ES", name: "Spain", latitude: 40.4, longitude: -3.7 },
  FR: { code: "FR", name: "France", latitude: 46.2, longitude: 2.2 },
  GB: { code: "GB", name: "United Kingdom", latitude: 55.4, longitude: -3.4 },
  HK: { code: "HK", name: "Hong Kong", latitude: 22.3, longitude: 114.2 },
  ID: { code: "ID", name: "Indonesia", latitude: -2.5, longitude: 118.0 },
  IN: { code: "IN", name: "India", latitude: 20.6, longitude: 78.9 },
  IT: { code: "IT", name: "Italy", latitude: 41.9, longitude: 12.6 },
  JP: { code: "JP", name: "Japan", latitude: 36.2, longitude: 138.3 },
  KR: { code: "KR", name: "South Korea", latitude: 36.5, longitude: 127.8 },
  MX: { code: "MX", name: "Mexico", latitude: 23.6, longitude: -102.6 },
  MY: { code: "MY", name: "Malaysia", latitude: 4.2, longitude: 101.9 },
  NL: { code: "NL", name: "Netherlands", latitude: 52.1, longitude: 5.3 },
  NZ: { code: "NZ", name: "New Zealand", latitude: -40.9, longitude: 174.9 },
  PH: { code: "PH", name: "Philippines", latitude: 12.9, longitude: 122.8 },
  RU: { code: "RU", name: "Russia", latitude: 61.5, longitude: 105.3 },
  SA: { code: "SA", name: "Saudi Arabia", latitude: 23.9, longitude: 45.1 },
  SE: { code: "SE", name: "Sweden", latitude: 60.1, longitude: 18.6 },
  SG: { code: "SG", name: "Singapore", latitude: 1.35, longitude: 103.8 },
  TH: { code: "TH", name: "Thailand", latitude: 15.8, longitude: 101.0 },
  TR: { code: "TR", name: "Turkey", latitude: 39.0, longitude: 35.2 },
  TW: { code: "TW", name: "Taiwan", latitude: 23.7, longitude: 121.0 },
  US: { code: "US", name: "United States", latitude: 39.8, longitude: -98.6 },
  VN: { code: "VN", name: "Vietnam", latitude: 14.1, longitude: 108.3 },
  ZA: { code: "ZA", name: "South Africa", latitude: -30.6, longitude: 22.9 },
};

export function normalizeCountryCode(value: unknown) {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();
  const byName: Record<string, string> = {
    "ARGENTINA": "AR",
    "AUSTRALIA": "AU",
    "BRAZIL": "BR",
    "CANADA": "CA",
    "CHINA": "CN",
    "FRANCE": "FR",
    "GERMANY": "DE",
    "HONG KONG": "HK",
    "INDIA": "IN",
    "INDONESIA": "ID",
    "ITALY": "IT",
    "JAPAN": "JP",
    "MALAYSIA": "MY",
    "MEXICO": "MX",
    "NETHERLANDS": "NL",
    "NEW ZEALAND": "NZ",
    "PHILIPPINES": "PH",
    "RUSSIA": "RU",
    "SAUDI ARABIA": "SA",
    "SINGAPORE": "SG",
    "SOUTH AFRICA": "ZA",
    "SOUTH KOREA": "KR",
    "KOREA, REPUBLIC OF": "KR",
    "SPAIN": "ES",
    "SWEDEN": "SE",
    "SWITZERLAND": "CH",
    "TAIWAN": "TW",
    "THAILAND": "TH",
    "TURKEY": "TR",
    "UNITED KINGDOM": "GB",
    "UNITED STATES": "US",
    "UNITED STATES OF AMERICA": "US",
    "VIETNAM": "VN",
  };

  return byName[upper] || upper;
}
