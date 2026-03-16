const express = require('express');
const { unfurl } = require('unfurl.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de autenticação via API Key (opcional)
app.use((req, res, next) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return next(); // sem API_KEY definida, acesso livre

  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (provided !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Rota principal
app.get('/unfurl', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Parâmetro "url" é obrigatório' });

  try {
    const data = await unfurl(url, {
      timeout: 10000,
      follow: 5,
    });

    res.json({
      url,
      title:       data.open_graph?.title          || data.title          || null,
      description: data.open_graph?.description    || data.description    || null,
      image:       data.open_graph?.images?.[0]?.url || data.twitter_card?.images?.[0]?.url || null,
      siteName:    data.open_graph?.site_name      || null,
      favicon:     data.favicon                    || null,
      lang:        data.lang                       || null,
      raw:         data,
    });

  } catch (err) {
    res.status(500).json({ error: err.message, url });
  }
});

// Rota de health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Rota raiz
app.get('/', (_, res) => res.json({
  service: 'unfurl-service',
  usage: 'GET /unfurl?url=https://exemplo.com',
  health: 'GET /health',
}));

app.listen(PORT, () => console.log(`✅ Unfurl service rodando na porta ${PORT}`));
