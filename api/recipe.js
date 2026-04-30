export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ingredienti, pasto, tempo } = req.body;

  const prompt = `Sei uno chef italiano esperto. L'utente ha questi ingredienti: ${ingredienti}.
Crea UNA ricetta per ${pasto}, tempo: ${tempo}.
Rispondi SOLO con JSON valido, zero testo extra, zero backtick:
{
  "nome": "Nome del piatto",
  "tempo": "X minuti",
  "porzioni": "X persone",
  "difficolta": "Facile",
  "ingredienti": ["quantità ingrediente", ...],
  "passaggi": ["Passo dettagliato 1", ...]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const recipe = JSON.parse(clean);
    res.status(200).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
