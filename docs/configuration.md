# Configuração

## Perfis de Acesso

O Eduzz MCP suporta múltiplos perfis para diferentes ambientes (sandbox, produção) e contas.

### Criando um Perfil

Use a ferramenta `eduzz_profile_create` no Claude Code:

```
eduzz_profile_create(
  name: "meu-perfil",
  api_key: "sua-api-key",
  api_secret: "seu-api-secret",
  environment: "sandbox"  // ou "production"
)
```

### Listando Perfis

```
eduzz_profile_list()
```

Retorna todos os perfis configurados e indica qual está ativo.

### Trocando de Perfil

```
eduzz_profile_switch(name: "outro-perfil")
```

### Verificando Perfil Ativo

```
eduzz_profile_active()
```

### Deletando um Perfil

```
eduzz_profile_delete(name: "perfil-antigo")
```

## Ambientes

| Ambiente | Descrição | URL Base |
|----------|-----------|----------|
| `sandbox` | Ambiente de testes | `https://api-sandbox.eduzz.com` |
| `production` | Ambiente de produção | `https://api.eduzz.com` |

## Armazenamento de Credenciais

As credenciais são armazenadas de forma segura em:

- **Linux/macOS**: `~/.config/eduzz-mcp/`
- **Windows**: `%APPDATA%/eduzz-mcp/`

### Estrutura de Arquivos

```
~/.config/eduzz-mcp/
├── config.json      # Configuração geral (perfil ativo)
└── profiles/
    ├── sandbox.json
    └── production.json
```

### Formato do Perfil

```json
{
  "name": "sandbox",
  "apiKey": "...",
  "apiSecret": "...",
  "environment": "sandbox",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Variáveis de Ambiente

Você também pode configurar via variáveis de ambiente:

```bash
export EDUZZ_API_KEY="sua-api-key"
export EDUZZ_API_SECRET="seu-api-secret"
export EDUZZ_ENVIRONMENT="sandbox"
```

As variáveis de ambiente têm prioridade sobre os perfis salvos.

## Múltiplas Contas

Para gerenciar múltiplas contas Eduzz, crie perfis separados:

```
# Conta principal - sandbox
eduzz_profile_create(name: "principal-sandbox", ...)

# Conta principal - produção
eduzz_profile_create(name: "principal-prod", ...)

# Conta cliente
eduzz_profile_create(name: "cliente-abc", ...)
```

Troque entre elas conforme necessário:

```
eduzz_profile_switch(name: "cliente-abc")
```
