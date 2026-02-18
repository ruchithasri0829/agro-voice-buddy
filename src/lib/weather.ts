// Weather data service
export interface WeatherData {
  condition: "sunny" | "cloudy" | "rainy";
  temperature: number;
  humidity: number;
  wind: number;
  location: string;
  alert: string | null;
}

const weatherScenarios: WeatherData[] = [
  {
    condition: "sunny",
    temperature: 28,
    humidity: 45,
    wind: 12,
    location: "Telangana",
    alert: null,
  },
  {
    condition: "cloudy",
    temperature: 24,
    humidity: 72,
    wind: 18,
    location: "Telangana",
    alert: null,
  },
  {
    condition: "rainy",
    temperature: 21,
    humidity: 89,
    wind: 25,
    location: "Telangana",
    alert: "Heavy rain expected tomorrow. Postpone spraying.",
  },
];

export async function getWeather(): Promise<WeatherData> {
  await new Promise((r) => setTimeout(r, 600));
  // Rotate through scenarios based on time
  const idx = Math.floor(Date.now() / 60000) % weatherScenarios.length;
  return weatherScenarios[idx];
}

export function getWeatherIcon(condition: WeatherData["condition"]): string {
  switch (condition) {
    case "sunny": return "☀️";
    case "cloudy": return "⛅";
    case "rainy": return "🌧️";
  }
}
