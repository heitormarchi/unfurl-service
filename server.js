const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
};

/* ===============================
   Resolver links intermediários
================================*/

function resolveTracking(url) {
  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes("mercadolivre") &&
      parsed.pathname.includes("account-verification")
    ) {
      const go = parsed.searchParams.get("go");
      if (go) return decodeURIComponent(go);
    }

    return url;
  } catch {
    return url;
  }
}

/* ===============================
   Extrair JSON-LD
================================*/

function extractJsonLd($) {
  const result = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      result.push(json);
    } catch {}
  });

  return result;
}

/* ===============================
   Encontrar produto
================================*/

function findProduct(jsonld) {
  for (const obj of jsonld) {
    if (obj["@type"] === "Product") return obj;

    if (obj["@graph"]) {
      for (const item of obj["@graph"]) {
        if (item["@type"] === "Product") return item;
      }
    }
  }

  return null;
}

/* ===============================
   ROTA
================================*/

app.get("/product", async (req, res) => {
  let { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "url obrigatória",
    });
  }

  try {
    url = resolveTracking(url);

    const response = await axios.get(url, {
      headers,
      timeout: 15000,
    });

    const finalUrl = response.request?.res?.responseUrl || url;

    const $ = cheerio.load(response.data);

    const jsonld = extractJsonLd($);

    const product = findProduct(jsonld);

    let image = null;
    let description = null;
    let price = null;
    let promotion = false;
    let video = null;

    if (product) {
      image = Array.isArray(product.image)
        ? product.image[0]
        : product.image;

      description = product.description || null;

      if (product.offers) {
        price = product.offers.price || null;

        if (product.offers.priceSpecification) {
          const original =
            product.offers.priceSpecification.price;

          if (original && original > price) {
            promotion = true;
          }
        }
      }

      if (product.video) {
        video = product.video.contentUrl || product.video;
      }
    }

    /* fallback para vídeo */

    if (!video) {
      $("video source").each((_, el) => {
        video = $(el).attr("src");
      });
    }

    res.json({
      url: finalUrl,
      image,
      video,
      price,
      promotion,
      description,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===============================
   HEALTH
================================*/

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log("🚀 Product scraper rodando");
});
