# Texto Extraído

**Barra de endereço do navegador (destacada em amarelo):**
ⓘ h3llow0rld.com.br/?code=xruWGHBwDdlR2JHjv3HWwUOf61FBODcVADsioMkdz2q&state=undefined

**Página de erro:**

📄 [ícone de página quebrada]

**This site can't be reached**

Check if there is a typo in h3llow0rld.com.br.

DNS_PROBE_FINISHED_NXDOMAIN

[Reload]

---

# Descrição

Screenshot de uma página de erro do navegador Chrome mostrando falha no callback OAuth.

A tela exibe:
- Barra de endereço destacada em amarelo mostrando:
  - Domínio: h3llow0rld.com.br (domínio inválido/inexistente)
  - Parâmetro `code`: código de autorização OAuth retornado pela Eduzz
  - Parâmetro `state`: "undefined" (estado não definido)
- Página de erro do Chrome:
  - Ícone de página quebrada
  - Título: "This site can't be reached"
  - Mensagem: "Check if there is a typo in h3llow0rld.com.br"
  - Código de erro: DNS_PROBE_FINISHED_NXDOMAIN (domínio não existe)
  - Botão "Reload"

Esta imagem documenta um erro comum no fluxo OAuth: o callback URL configurado no aplicativo não existe ou está incorreto. O código de autorização foi gerado corretamente pela Eduzz, mas o redirecionamento falhou porque o domínio de callback não é válido.
