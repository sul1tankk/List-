export async function GET(request: Request) {
  const word = new URL(request.url).searchParams.get('word') || '';
  if (!/^[a-zA-Z]+(?:['’\-][a-zA-Z]+)*$/.test(word) || word.length > 80) return Response.json({error:'Выберите английское слово'}, {status:400});
  try {
    const res = await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(word)+'&langpair=en%7Cru', {signal:AbortSignal.timeout(12000)});
    const data = await res.json() as any;
    if (!res.ok || Number(data.responseStatus)!==200 || !data.responseData?.translatedText) throw new Error();
    return Response.json({translation:data.responseData.translatedText}, {headers:{'Cache-Control':'public, max-age=86400'}});
  } catch { return Response.json({error:'Не удалось перевести. Попробуйте ещё раз.'}, {status:502}); }
}
