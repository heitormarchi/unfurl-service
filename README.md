# unfurl-service

Microserviço para extração de metadados de URLs (título, descrição, imagem, favicon, etc).  
Alternativa self-hosted ao Microlink.io, ideal para fluxos n8n.

## Deploy no EasyPanel

1. Crie um novo app no EasyPanel
2. Selecione **"From Git"**
3. Conecte este repositório
4. Build type: **Dockerfile**
5. Port: `3000`
6. (Opcional) Adicione a variável de ambiente `API_KEY` para proteger o serviço

---

## Uso

### Endpoint principal

```
GET /unfurl?url=https://exemplo.com
```

Com autenticação (se `API_KEY` definida):
```
GET /unfurl?url=https://exemplo.com&api_key=suachave
# ou via header:
X-Api-Key: suachave
```

### Resposta

```json
{
  "url": "https://exemplo.com",
  "title": "Título da página",
  "description": "Descrição da página",
  "image": "https://exemplo.com/imagem.jpg",
  "siteName": "Nome do site",
  "favicon": "https://exemplo.com/favicon.ico",
  "lang": "pt",
  "raw": { ... }
}
```

### Health check

```
GET /health
→ { "status": "ok" }
```

---

## Uso no n8n

Nó **HTTP Request**:
- Method: `GET`
- URL: `https://unfurl.seudominio.com/unfurl`
- Query Parameter: `url` → `{{ $json.url }}`
- (Opcional) Header: `X-Api-Key` → `suachave`

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |
| `API_KEY` | _(vazio)_ | Chave de autenticação (opcional) |

---

## Rodar localmente

```bash
npm install
npm start
```
