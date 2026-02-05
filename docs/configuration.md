# Configuração

## Perfis de Acesso

O Eduzz MCP DevHub suporta múltiplos perfis para diferentes ambientes (sandbox, produção) e contas.

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

Ou via CLI:

```bash
labzz-mcp-devhub config create
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

As credenciais são armazenadas em:

```
~/.eduzz-mcp/
└── config.json      # Perfis e configuração geral
```

### Formato do Config

```json
{
  "active_profile": "sandbox",
  "profiles": {
    "sandbox": {
      "api_key": "...",
      "api_secret": "...",
      "environment": "sandbox"
    }
  }
}
```

## Variáveis de Ambiente

Variáveis de ambiente opcionais:

```bash
# Para descrições AI de imagens durante o sync
export OPENAI_API_KEY="sua-openai-key"
export ANTHROPIC_API_KEY="sua-anthropic-key"

# Schedule customizado para auto-sync (padrão: domingo 3am)
export EDUZZ_SYNC_SCHEDULE="0 3 * * 0"
```

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
