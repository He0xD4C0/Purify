// OpenAI-compatible translation client (standalone utility)

interface TranslateOptions {
  text: string;
  sourceLang?: string;
  targetLang?: string;
}

export async function translateLyrics(options: TranslateOptions): Promise<string> {
  const apiKey = localStorage.getItem('purify_ai_key') || '';
  const endpoint = localStorage.getItem('purify_ai_endpoint') || 'https://api.openai.com/v1/chat/completions';
  const model = localStorage.getItem('purify_ai_model') || 'gpt-4o-mini';

  if (!apiKey) throw new Error('AI translation not configured');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `你是一个歌词翻译助手。将以下歌词翻译为${options.targetLang || '中文'}，保持诗意和韵律。只返回翻译文本，不要添加原文、时间戳或任何额外内容。`,
        },
        { role: 'user', content: options.text },
      ],
      temperature: 0.7,
    }),
  });

  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}
