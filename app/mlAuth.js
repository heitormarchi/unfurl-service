const axios = require("axios");
const fs = require("fs");

const TOKEN_FILE = "./token.json";

const CLIENT_ID = process.env.ML_CLIENT_ID;
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

async function refreshToken() {

  const tokenData = JSON.parse(
    fs.readFileSync(TOKEN_FILE)
  );

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("refresh_token", tokenData.refresh_token);

  const { data } = await axios.post(
    "https://api.mercadolibre.com/oauth/token",
    params
  );

  fs.writeFileSync(
    TOKEN_FILE,
    JSON.stringify(data, null, 2)
  );

  return data.access_token;
}

async function getToken() {

  const tokenData = JSON.parse(
    fs.readFileSync(TOKEN_FILE)
  );

  const expires = new Date(tokenData.expires_at);

  if (new Date() > expires) {
    return await refreshToken();
  }

  return tokenData.access_token;
}

module.exports = { getToken };
