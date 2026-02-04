# API Reference

Referência completa de todas as ferramentas disponíveis nos servidores MCP.

## eduzz-config

Gerenciamento de credenciais e perfis.

### eduzz_profile_list

Lista todos os perfis configurados.

**Parâmetros:** Nenhum

**Retorno:**
```json
{
  "profiles": [
    {
      "name": "sandbox",
      "environment": "sandbox",
      "isActive": true
    }
  ]
}
```

---

### eduzz_profile_create

Cria um novo perfil de acesso.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `name` | string | Sim | Nome único do perfil |
| `api_key` | string | Sim | API Key da Eduzz |
| `api_secret` | string | Sim | API Secret da Eduzz |
| `environment` | string | Não | `sandbox` ou `production` (default: `sandbox`) |

**Exemplo:**
```
eduzz_profile_create(
  name: "production",
  api_key: "abc123",
  api_secret: "xyz789",
  environment: "production"
)
```

---

### eduzz_profile_switch

Troca o perfil ativo.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `name` | string | Sim | Nome do perfil |

---

### eduzz_profile_active

Retorna informações do perfil ativo.

**Parâmetros:** Nenhum

**Retorno:**
```json
{
  "name": "sandbox",
  "environment": "sandbox",
  "apiKey": "abc***"
}
```

---

### eduzz_profile_delete

Remove um perfil.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `name` | string | Sim | Nome do perfil |

---

## eduzz-knowledge

Base de conhecimento com busca semântica.

### eduzz_search

Busca semântica na documentação da Eduzz.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `query` | string | Sim | Termo de busca |
| `limit` | number | Não | Máximo de resultados (default: 5) |
| `type` | string | Não | Filtrar por tipo: `page`, `example`, `endpoint` |

**Exemplo:**
```
eduzz_search(query: "como criar um produto", limit: 3)
```

**Retorno:**
```json
{
  "results": [
    {
      "title": "Criando Produtos",
      "content": "...",
      "type": "page",
      "score": 0.95
    }
  ]
}
```

---

### eduzz_get_example

Obtém exemplos de código por tópico.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `topic` | string | Sim | Tópico do exemplo |
| `language` | string | Não | Linguagem: `javascript`, `python`, `curl` |

**Exemplo:**
```
eduzz_get_example(topic: "autenticação", language: "javascript")
```

---

### eduzz_get_endpoint

Documentação detalhada de um endpoint da API.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `path` | string | Sim | Path do endpoint (ex: `/products`) |
| `method` | string | Não | Método HTTP (default: `GET`) |

**Exemplo:**
```
eduzz_get_endpoint(path: "/products", method: "POST")
```

---

### eduzz_sync

Sincroniza a base de conhecimento (atualiza dados).

**Parâmetros:** Nenhum

> **Nota:** Normalmente não é necessário executar manualmente.

---

### eduzz_stats

Estatísticas da base de conhecimento.

**Parâmetros:** Nenhum

**Retorno:**
```json
{
  "pages": 150,
  "examples": 45,
  "endpoints": 87,
  "lastSync": "2024-01-01T00:00:00.000Z"
}
```

---

## eduzz-api

Cliente da API Eduzz.

### eduzz_api_call

Faz uma chamada à API da Eduzz.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `endpoint` | string | Sim | Path do endpoint |
| `method` | string | Não | Método HTTP (default: `GET`) |
| `body` | object | Não | Corpo da requisição |
| `params` | object | Não | Query parameters |

**Exemplo:**
```
eduzz_api_call(
  endpoint: "/products",
  method: "GET",
  params: { page: 1, limit: 10 }
)
```

---

### eduzz_api_endpoints

Lista todos os endpoints disponíveis.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `tag` | string | Não | Filtrar por tag/categoria |

**Exemplo:**
```
eduzz_api_endpoints(tag: "products")
```

---

### eduzz_api_status

Verifica o status da API e da autenticação.

**Parâmetros:** Nenhum

**Retorno:**
```json
{
  "api": "online",
  "authenticated": true,
  "profile": "sandbox",
  "rateLimit": {
    "remaining": 100,
    "reset": "2024-01-01T00:05:00.000Z"
  }
}
```

---

### eduzz_api_reload

Recarrega as ferramentas geradas dinamicamente do OpenAPI.

**Parâmetros:** Nenhum

> **Nota:** Use após atualizações na especificação OpenAPI.
