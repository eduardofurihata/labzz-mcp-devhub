# API Reference

Referência completa de todas as ferramentas disponíveis no servidor `eduzz-devhub`.

## Configuração

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

## Base de Conhecimento

Busca semântica na documentação Eduzz.

### eduzz_search

Busca semântica na documentação da Eduzz.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `query` | string | Sim | Termo de busca |
| `limit` | number | Não | Máximo de resultados (default: 10) |
| `type` | string | Não | Filtrar por tipo: `doc`, `example`, `api` |
| `language` | string | Não | Filtrar exemplos por linguagem |

**Exemplo:**
```
eduzz_search(query: "como criar um produto", limit: 3)
```

---

### eduzz_get_example

Obtém exemplos de código por tópico.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `topic` | string | Sim | Tópico do exemplo |
| `language` | string | Não | Linguagem: `javascript`, `python`, `curl` |
| `limit` | number | Não | Máximo de exemplos (default: 5) |

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
| `method` | string | Não | Método HTTP: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |

**Exemplo:**
```
eduzz_get_endpoint(path: "/products", method: "POST")
```

---

### eduzz_sync

Sincroniza a base de conhecimento (deleta e reconstrói do zero).

**Parâmetros:** Nenhum

> **Aviso:** Deleta todos os dados existentes antes de reconstruir.

---

### eduzz_stats

Estatísticas da base de conhecimento.

**Parâmetros:** Nenhum

---

## API

Cliente da API Eduzz.

### eduzz_api_call

Faz uma chamada à API da Eduzz.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `method` | string | Sim | Método HTTP: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| `path` | string | Sim | Path do endpoint |
| `query` | object | Não | Query parameters |
| `body` | any | Não | Corpo da requisição |
| `profile` | string | Não | Perfil a usar (default: perfil ativo) |

**Exemplo:**
```
eduzz_api_call(
  method: "GET",
  path: "/products",
  query: { page: "1", limit: "10" }
)
```

---

### eduzz_api_endpoints

Lista todos os endpoints disponíveis.

**Parâmetros:**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `filter` | string | Não | Filtrar por path ou método |

**Exemplo:**
```
eduzz_api_endpoints(filter: "products")
```

---

### eduzz_api_status

Verifica o status da API e da autenticação.

**Parâmetros:** Nenhum

---

### eduzz_api_reload

Recarrega as ferramentas geradas dinamicamente do OpenAPI.

**Parâmetros:** Nenhum

> **Nota:** Use após atualizações na especificação OpenAPI.

---

## Resources

### eduzz://docs/overview

Visão geral da documentação disponível.

### eduzz://openapi/spec.json

Especificação OpenAPI completa da API Eduzz.
