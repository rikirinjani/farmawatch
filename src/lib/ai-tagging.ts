// Kata kunci untuk pendeteksian otomatis sebagai fallback jika Claude API gagal

interface AiResult {
  summary: string;
  tags: string[];
}

const OTC_KEYWORDS = [
  "komix",
  "dextro",
  "dextromethorphan",
  "obh",
  "pil koplo",
  "mabuk",
  "disalahgunakan",
];

const PRESCRIPTION_KEYWORDS = [
  "amoksisilin",
  "amoxicillin",
  "asam mefenamat",
  "mefenamic",
  "diklofenak",
  "diclofenac",
  "antibiotik",
  "obat keras",
];

const DEMOGRAPHIC_KEYWORDS = [
  { keyword: "remaja", tag: "#Remaja" },
  { keyword: "anak", tag: "#Anak" },
  { keyword: "pelajar", tag: "#Pelajar" },
  { keyword: "mahasiswa", tag: "#Mahasiswa" },
  { keyword: "dewasa", tag: "#Dewasa" },
];

const CHANNEL_KEYWORDS = [
  { keyword: "warung", tag: "#Warung" },
  { keyword: "toko", tag: "#Toko" },
  { keyword: "minimarket", tag: "#Minimarket" },
  { keyword: "indomaret", tag: "#Minimarket" },
  { keyword: "alfamart", tag: "#Minimarket" },
  { keyword: "online", tag: "#Online" },
  { keyword: "shopee", tag: "#Online" },
  { keyword: "tokopedia", tag: "#Online" },
  { keyword: "pasar", tag: "#Pasar" },
  { keyword: "apotek", tag: "#Apotek" },
];

/**
 * Memanggil Claude API untuk menghasilkan ringkasan dan tag dari laporan.
 */
export async function aiTagTicket(
  description: string,
  categoryName: string
): Promise<{ result: AiResult; method: "ai" | "fallback" }> {
  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new Error("CLAUDE_API_KEY not set");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system:
          "Kamu adalah asisten analisis farmasi. Diberikan laporan pelanggaran atau penyalahgunaan obat di Indonesia, buatlah ringkasan singkat dan daftar tag relevan dalam format JSON. Kembalikan HANYA JSON tanpa teks lain.",
        messages: [
          {
            role: "user",
            content: `Kategori: ${categoryName}\n\nLaporan: ${description}\n\nBuat ringkasan 2-3 kalimat dalam Bahasa Indonesia dan daftar tag (hashtag) yang relevan. Format JSON: {"summary": "...", "tags": ["#tag1", "#tag2", ...]}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Claude response");

    const parsed: AiResult = JSON.parse(jsonMatch[0]);
    return { result: parsed, method: "ai" };
  } catch (error) {
    console.warn(
      "Claude API failed, falling back to keyword matching:",
      error
    );
    return { result: keywordMatch(description, categoryName), method: "fallback" };
  }
}

/**
 * Fallback: pencocokan kata kunci untuk menghasilkan tag.
 */
function keywordMatch(description: string, categoryName: string): AiResult {
  const lowerDesc = description.toLowerCase();
  const tags: string[] = [];

  // Category-based tag
  if (
    categoryName.toLowerCase().includes("otc") ||
    categoryName.toLowerCase().includes("penyalahgunaan")
  ) {
    tags.push("#Penyalahgunaan_OTC");
    for (const kw of OTC_KEYWORDS) {
      if (lowerDesc.includes(kw)) {
        tags.push(`#${kw.charAt(0).toUpperCase() + kw.slice(1)}`);
      }
    }
  } else {
    tags.push("#Obat_Keras_Ilegal");
    for (const kw of PRESCRIPTION_KEYWORDS) {
      if (lowerDesc.includes(kw)) {
        tags.push(`#${kw.charAt(0).toUpperCase() + kw.slice(1)}`);
      }
    }
  }

  // Demographic
  for (const { keyword, tag } of DEMOGRAPHIC_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      tags.push(tag);
    }
  }

  // Channel
  for (const { keyword, tag } of CHANNEL_KEYWORDS) {
    if (lowerDesc.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // Deduplicate
  const uniqueTags = [...new Set(tags)];

  const summary = `Laporan ${categoryName} telah diterima. ${uniqueTags.length > 0 ? `Tag terdeteksi: ${uniqueTags.join(", ")}.` : ""} Silakan tinjau detail untuk informasi lebih lanjut.`;

  return { summary, tags: uniqueTags };
}
