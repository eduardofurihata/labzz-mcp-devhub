---
url: https://developers.eduzz.com/reference/api/get-alpaclass-v1-producer-teams-teamId-students
title: Eduzz Developers - API - Alpaclass - Alunos - Listar alunos da escola
crawledAt: 2026-02-02T17:55:25.674Z
---

# Eduzz Developers - API - Alpaclass - Alunos - Listar alunos da escola

API

*   [
    
    Introdução
    
    ](/docs/api)
*   [
    
    Criando um Aplicativo
    
    ](/docs/api/create-app)
*   [
    
    Token Pessoal
    
    ](/docs/api/personal-token)
*   [
    
    Autenticação de Usuário
    
    ](/docs/api/user-token)
*   [
    
    Padrões de resposta
    
    ](/docs/api/response)

Referência da Autenticação

*   [
    
    Autenticar Usuário
    
    GET
    
    ](/reference/auth/get-oauth-authorize)
*   [
    
    Obter token de Usuário
    
    POST
    
    ](/reference/auth/post-oauth-token)

Referência da API

*   Accounts: Geral

*   Alpaclass: Alunos

*   [
    
    Criar Aluno
    
    POST
    
    ](/reference/api/post-alpaclass-v1-producer-teams-teamId-students)
*   [
    
    Listar alunos da escola
    
    GET
    
    ](/reference/api/get-alpaclass-v1-producer-teams-teamId-students)
*   [
    
    Listar matrículas do aluno
    
    GET
    
    ](/reference/api/get-alpaclass-v1-producer-teams-teamId-students-studentId-enrollments)

*   Alpaclass: Entrega

*   Alpaclass: Escolas

*   Blinket: Eventos

*   Blinket: Marcadores

*   Blinket: Participantes

*   Checkout Sun: Carrinho

*   HeyCamp: Comentários

*   HeyCamp: Convites

*   HeyCamp: Espaços

*   HeyCamp: Membros

*   HeyCamp: Posts

*   MyEduzz: Afiliados

*   MyEduzz: Assinaturas

*   MyEduzz: Clientes

*   MyEduzz: Financeiro

*   MyEduzz: Produtos

*   MyEduzz: Vendas

*   Nutror: Comentários

*   Nutror: Conteúdos

*   Nutror: Estudantes

*   SafeVideo: Mídias

*   Webhook: Configurações

*   Webhook: Eventos

*   Webhook: Secrets

1.  Reference
    
2.  API
    
3.  Alpaclass
    
4.  Alunos
    
5.  Listar alunos da escola
    

# Listar alunos da escola

Listar alunos da escola

**Required scopes:**alpaclass\_student\_read

GET

https://api.eduzz.com/alpaclass/v1/producer/teams/:teamId/students

### Path params

**teamId**

Id da escola

### Query params

**page**

number

Página atual

**itemsPerPage**

number

Número máximo de itens por página

**sort**

string

Ordenação dos itens podendo ter várias ordenações, seguindo o seguinte padrão: campo:ordenação Ex.: name:asc,email:desc

**id**

string

Id do aluno

**email**

string

E-mail do aluno

**document**

string

Documento do aluno

**startDate**

datetime

Data de início do cadastro dos alunos

**endDate**

datetime

Data de fim do cadastro dos alunos

**isFrozen**

boolean

Status de congelamento do aluno

### Response params (200)

**pages**

number

Número de páginas

**page**

number

Página atual

**itemsPerPage**

number

Número máximo de itens por página

**totalItems**

number

Número total de items

**items**

array of object

Alunos da escola

**items\[n\].id**

string

Id do aluno

**items\[n\].name**

string

Nome do aluno

**items\[n\].email**

string

Email do aluno

**items\[n\].createdAt**

datetime

Data de criação do aluno

### Status codes

Status

Descrição

200

Success

[![Swagger Logo](/_next/image?url=%2Flogos%2Fswagger.webp&w=256&q=75 "Swagger API Reference")](/swagger#/Alpaclass/getalpaclassv1producerteamsteamIdstudents)

### Exemplos

ShellJavaScript

```shell
1curl --request GET \
2	--url 'https://api.eduzz.com/alpaclass/v1/producer/teams/aBc123/students' \
3	--header 'Accept: application/json' 
```

**Response**200 - Listar alunos da escola

```json
1{
2  "pages": 2,
3  "page": 1,
4  "itemsPerPage": 2,
5  "totalItems": 3,
6  "items": [
7    {
8      "id": "xPt123",
9      "name": "João Carlos",
10      "email": "test@test.com",
11      "createdAt": "2023-01-01T00:00:00Z"
12    },
13    {
14      "id": "xPt456",
15      "name": "Maria Silva",
16      "email": "xpto@test.com",
17      "createdAt": "2023-01-01T00:00:00Z"
18    }
19  ]
20}
```

[

Anterior**Criar Aluno**

](/reference/api/post-alpaclass-v1-producer-teams-teamId-students)[

Próxima**Listar matrículas do aluno**

](/reference/api/get-alpaclass-v1-producer-teams-teamId-students-studentId-enrollments)
