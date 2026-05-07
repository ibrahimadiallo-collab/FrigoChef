export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { ingredienti, pasto, tempo } = req.body;
  const prompt = `Sei uno chef italiano esperto. L'utente ha questi ingredienti: ${ingredienti}. Crea UNA ricetta per ${pasto}, tempo: ${tempo}. Rispondi SOLO con JSON valido, zero testo extra, zero backtick: {"nome":"Nome del piatto","tempo":"X minuti","porzioni":"X persone","difficolta":"Facile","ingredienti":["quantita ingrediente"],"passaggi":["Passo 1"]}`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ error: 'Gemini error: ' + JSON.stringify(data) });
    }
    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const recipe = JSON.parse(clean);
    res.status(200).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
