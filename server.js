const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

const ML_TOKEN = process.env.ML_TOKEN;

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
};

/* ================================
UTILS
================================ */

function resolveMercadoLivreRedirect(url) {
  try {
    const parsed = new URL(url);

    if (parsed.searchParams.get("go")) {
      return decodeURIComponent(parsed.searchParams.get("go"));
    }

    return url;
  } catch {
    return url;
  }
}

function extractMLId(url) {
  const match = url.match(/MLB\d+/);
  return match ? match[0] : null;
}

/* ================================
MERCADO LIVRE
================================ */

async function fetchMercadoLivre(id) {
  const { data } = await axios.get(
    `https://api.mercadolibre.com/items/${id}`,
    {
      headers: {
        Authorization: `Bearer ${ML_TOKEN}`,
      },
    }
  );

  return {
    url: data.permalink,
    image: data.pictures?.[0]?.url || null,
    video: data.video_id
      ? `https://www.youtube.com/watch?v=${data.video_id}`
      : null,
    price: data.price,
    promotion:
      data.original_price &&
      data.original_price > data.price,
    description: data.title,
  };
}

/* ================================
GENERIC SCRAPER
================================ */

async function genericScraper(url) {
  const { data } = await axios.get(url, { headers });

  const $ = cheerio.load(data);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text();

  const image =
    $('meta[property="og:image"]').attr("content") ||
    null;

  const description =
    $('meta[name="description"]').attr("content") ||
    null;

  const video =
    $('meta[property="og:video"]').attr("content") ||
    $("video source").attr("src") ||
    null;

  return {
    url,
    image,
    video,
    price: null,
    promotion: false,
    description: title || description,
  };
}

/* ================================
ROTA PRINCIPAL
================================ */

app.get("/product", async (req, res) => {
  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "url obrigatória",
      });
    }

    /* resolve redirect do mercado livre */

    url = resolveMercadoLivreRedirect(url);

    /* detecta produto ML */

    const mlId = extractMLId(url);

    if (mlId) {
      const product = await fetchMercadoLivre(mlId);
      return res.json(product);
    }

    /* fallback */

    const product = await genericScraper(url);

    return res.json(product);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ================================
HEALTH
================================ */

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

/* ================================
ROOT
================================ */

app.get("/", (_, res) => {
  res.json({
    service: "product-unfurl",
    usage: "/product?url=https://link-do-produto",
  });
});

/* ================================
START
================================ */

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
