// AI farming response generator (offline-capable)
import type { Language } from "./i18n";

interface FarmingResponse {
  text: string;
}

const responses: Record<string, Record<Language, string>> = {
  irrigation: {
    en: "For optimal irrigation, water your crops early morning (5-7 AM) or evening (5-7 PM) to minimize evaporation. Check soil moisture before watering — it should be moist 2 inches deep.",
    hi: "बेहतर सिंचाई के लिए सुबह 5-7 बजे या शाम 5-7 बजे पानी दें। पानी देने से पहले मिट्टी की नमी जांचें — 2 इंच गहरी मिट्टी नम होनी चाहिए।",
    te: "మంచి నీటిపారుదల కోసం ఉదయం 5-7 గంటలు లేదా సాయంత్రం 5-7 గంటలకు నీళ్లు ఇవ్వండి. నీళ్లు ఇవ్వడానికి ముందు మట్టిలో తేమ చెక్ చేయండి.",
  },
  pesticide: {
    en: "Apply pesticides early morning or evening when winds are calm. Always wear protective gear and avoid spraying before rain. Use neem-based solutions for organic farming.",
    hi: "कीटनाशक सुबह जल्दी या शाम को लगाएं जब हवा शांत हो। सुरक्षात्मक गियर पहनें और बारिश से पहले छिड़काव न करें।",
    te: "పురుగుమందు పొద్దుటే లేదా సాయంత్రం వాడండి. రక్షణ పరికరాలు ధరించండి. వర్షానికి ముందు పిచికారీ చేయవద్దు.",
  },
  weather: {
    en: "Based on current conditions, the weather looks favorable for farming. Keep monitoring for sudden changes and protect your crops from extreme conditions.",
    hi: "वर्तमान स्थिति के अनुसार, मौसम खेती के लिए अनुकूल लग रहा है। अचानक बदलावों पर नजर रखें।",
    te: "ప్రస్తుత పరిస్థితుల ఆధారంగా, వాతావరణం వ్యవసాయానికి అనుకూలంగా ఉంది. అకస్మాత్తు మార్పులను గమనించండి.",
  },
  fertilizer: {
    en: "Apply fertilizers based on soil testing results. Generally, use NPK fertilizer at the rate of 100:50:50 kg/hectare for most crops. Apply in the evening to avoid burning.",
    hi: "मिट्टी परीक्षण के आधार पर उर्वरक डालें। अधिकांश फसलों के लिए 100:50:50 किग्रा/हेक्टेयर NPK उर्वरक का उपयोग करें।",
    te: "మట్టి పరీక్ష ఫలితాల ఆధారంగా ఎరువులు వేయండి. చాలా పంటలకు 100:50:50 కిలో/హెక్టారు NPK ఎరువు వాడండి.",
  },
  soil: {
    en: "Good soil health is key to good yields. Test your soil every 2 years. Add organic matter like compost to improve soil structure and water retention.",
    hi: "अच्छी मिट्टी की सेहत अच्छी उपज की चाबी है। हर 2 साल में मिट्टी परीक्षण करें। मिट्टी की संरचना सुधारने के लिए खाद मिलाएं।",
    te: "మంచి మట్టి ఆరోగ్యం మంచి దిగుబడికి ముఖ్యం. ప్రతి 2 సంవత్సరాలకు మట్టి పరీక్ష చేయించండి.",
  },
  default: {
    en: "I understand you're asking about farming. Here are some tips: maintain crop rotation, monitor for pests regularly, and ensure adequate irrigation. For specific advice, please ask about a particular crop or issue.",
    hi: "मैं समझता हूँ आप खेती के बारे में पूछ रहे हैं। कुछ सुझाव: फसल चक्र बनाए रखें, कीटों की नियमित निगरानी करें, और पर्याप्त सिंचाई सुनिश्चित करें।",
    te: "మీరు వ్యవసాయం గురించి అడుగుతున్నారని అర్థమైంది. కొన్ని చిట్కాలు: పంట మార్పిడి చేయండి, చీడపీడలను క్రమం తప్పకుండా పర్యవేక్షించండి.",
  },
};

function detectIntent(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("irri") || lower.includes("water") || lower.includes("पानी") || lower.includes("సిన")) return "irrigation";
  if (lower.includes("pest") || lower.includes("spray") || lower.includes("छिड़") || lower.includes("పుర")) return "pesticide";
  if (lower.includes("weather") || lower.includes("rain") || lower.includes("मौसम") || lower.includes("వాత")) return "weather";
  if (lower.includes("fertil") || lower.includes("उर्व") || lower.includes("ఎరువ")) return "fertilizer";
  if (lower.includes("soil") || lower.includes("मिट्टी") || lower.includes("మట్టి")) return "soil";
  return "default";
}

export async function generateFarmingResponse(
  userText: string,
  language: Language
): Promise<FarmingResponse> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
  const intent = detectIntent(userText);
  return { text: responses[intent][language] };
}
