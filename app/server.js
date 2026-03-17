const express = require("express");
const axios = require("axios");
const { getToken } = require("./mlAuth");

const app = express();
const PORT = 3000;

function extractMLId(url) {
  const match = url.match(/MLB\d+/);
  return match ? match[0] : null;
}

async function fetchProduct(id) {

  const token = await getToken();

  const { data } = await axios.get(
    `https://api.mercadolibre.com/products/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return {
    id: data.id,
    name: data.name,
    image: data.pictures?.[0]?.url,
    description: data.short_description?.content,
    attributes: data.attributes,
    features: data.main_features
  };
}

app.get("/product", async (req, res) => {

  try {

    const { url } = req.query;

    const id = extractMLId(url);

    if (!id) {
      return res.status(400).json({
        error: "Produto não identificado"
      });
    }

    const product = await fetchProduct(id);

    res.json(product);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

app.listen(PORT, () => {
  console.log("🚀 ML Product API rodando");
});
