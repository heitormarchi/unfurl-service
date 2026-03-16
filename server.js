const express = require('express');
const { unfurl } = require('unfurl.js');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   API KEY (opcional)
================================*/
app.use((req, res, next) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return next();

  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (provided !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

/* ===============================
   FUNÇÃO PARA EXTRAIR IMAGENS
================================*/
async function extractImages(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);

    const images = [];

    $('img').each((_, el) => {
      let src = $(el).attr('src');
      if (!src) return;

      if (!src.startsWith('http')) {
        try {
          src = new URL(src, url).href;
        } catch {}
      }

      images.push(src);
    });

    return [...new Set(images)];
  } catch {
    return [];
  }
}

/* ===============================
   ROTA PRINCIPAL
================================*/
app.get('/unfurl', async (req, res) => {

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({
      error: 'Parâmetro "url" é obrigatório'
    });
  }

  try {

    /* --------- HTTP request ---------- */

    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 10,
      validateStatus: () => true
    });

    const finalUrl = response.request.res.responseUrl;

    /* --------- metadata --------- */

    const data = await unfurl(finalUrl, {
      timeout: 10000,
      follow: 10
    });

    /* --------- imagens --------- */

    const images = await extractImages(finalUrl);

    /* --------- redirects --------- */

    const redirects = response.request._redirectable?._redirects || [];

    res.json({

      url: finalUrl,

      status: response.status,

      redirects,

      title:
        data.open_graph?.title ||
        data.twitter_card?.title ||
        data.title ||
        null,

      description:
        data.open_graph?.description ||
        data.twitter_card?.description ||
        data.description ||
        null,

      siteName:
        data.open_graph?.site_name ||
        null,

      author:
        data.author ||
        data.article?.author ||
        null,

      lang:
        data.lang ||
        null,

      canonical:
        data.canonical ||
        null,

      favicon:
        data.favicon ||
        null,

      image:
        data.open_graph?.images?.[0]?.url ||
        data.twitter_card?.images?.[0]?.url ||
        images[0] ||
        null,

      images,

      feeds: data.feeds || [],

      headers: response.headers,

      meta: data,

    });

  } catch (err) {

    res.status(500).json({
      error: err.message,
      url
    });

  }

});

/* ===============================
   HEALTH
================================*/

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

/* ===============================
   ROOT
================================*/

app.get('/', (_, res) => {
  res.json({
    service: 'unfurl-service',
    usage: 'GET /unfurl?url=https://exemplo.com',
    health: 'GET /health'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Unfurl service rodando na porta ${PORT}`);
});
