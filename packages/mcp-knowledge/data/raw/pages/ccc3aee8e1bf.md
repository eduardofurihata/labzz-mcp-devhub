---
url: https://developers.eduzz.com/reference/webhook/nutror-file-downloaded
title: Eduzz Developers - Webhook - Nutror - Alunos - Arquivo Baixado
crawledAt: 2026-02-02T17:54:37.543Z
---

# Eduzz Developers - Webhook - Nutror - Alunos - Arquivo Baixado

Webhook

*   [
    
    Introdução
    
    ](/docs/webhook)
*   [
    
    Criando um webhook
    
    ](/docs/webhook/create)
*   [
    
    Backup de eventos
    
    BETA
    
    ](/docs/webhook/backup)
*   [
    
    Ativação de URL
    
    ](/docs/webhook/activate)
*   [
    
    Histórico de Envios
    
    ](/docs/webhook/history)
*   [
    
    Segurança
    
    ](/docs/webhook/security)
*   [
    
    Evento de Verificação (ping)
    
    ](/docs/webhook/ping)

Referência do Webhook

*   AlpaClass: Alunos

*   Blinket: Ingresso

*   Blinket: Participante

*   MyEduzz: Assinaturas

*   MyEduzz: Comissão

*   MyEduzz: Fatura

*   Nutror: Alunos

*   [
    
    Aluno Inativo
    
    ](/reference/webhook/nutror-inactive-student)
*   [
    
    Anotação Criada
    
    ](/reference/webhook/nutror-notation-created)
*   [
    
    Arquivo Baixado
    
    ](/reference/webhook/nutror-file-downloaded)
*   [
    
    Matrícula Criada
    
    ](/reference/webhook/nutror-enrollment-created)

*   Nutror: Aulas

*   Nutror: Geral

*   SafeVideo: Processamento de Arquivo

*   SafeVideo: Upload de Arquivo

*   Sun: Carrinho

1.  Reference
    
2.  Webhook
    
3.  Nutror
    
4.  Alunos
    
5.  Arquivo Baixado
    

# Arquivo Baixado

Notifica quando um Aluno faz download de um Arquivo da Aula

**Evento:**

nutror.file\_downloaded

### Response params

**id**

string

Id do evento

**event**

string

Nome do evento (ex: certificate\_viewed)

**data**

object

Dados do certificado

**data.course**

object

Dados do curso

**data.course.hash**

string

Hash identificador do curso

**data.course.title**

string

Nome do curso

**data.producer**

object

Dados do produtor

**data.producer.email**

string

Email do produtor

**data.producer.name**

string

Nome do produtor

**data.learner**

object

Dados do aluno

**data.learner.email**

string

Email do aluno

**data.learner.name**

string

Nome do aluno

**data.lesson**

object

Dados da Aula

**data.lesson.id**

string

ID da Aula

**data.lesson.title**

string

Titulo da Aula

**data.createdAt**

string

Data da criação do evento

**sentDate**

string

Data de envio

[![Swagger Logo](/_next/image?url=%2Flogos%2Fswagger.webp&w=256&q=75 "Swagger Webhook Reference")](/swagger#/webhooks/postnutror_file_downloaded)

### Payload

```json
1{
2  "id": "iu6uf3b0nw6gc4oc8565rqwdm",
3  "event": "nutror.file_downloaded",
4  "data": {
5    "producer": {
6      "email": "fulano@eduzz.com",
7      "name": "Fulano da Silva"
8    },
9    "learner": {
10      "email": "learner@eduzz.com",
11      "name": "Ciclano da Silva"
12    },
13    "course": {
14      "hash": "4bba1d18c02755a13ee97521ae61958c3cf9e665",
15      "title": "Título do Curso"
16    },
17    "lesson": {
18      "id": "3865",
19      "title": "Título da Aula"
20    },
21    "createdAt": "2023-09-25T19:04:09Z"
22  },
23  "sentDate": "2024-02-29T14:33:03.663Z"
24}
```

[

Anterior**Anotação Criada**

](/reference/webhook/nutror-notation-created)[

Próxima**Matrícula Criada**

](/reference/webhook/nutror-enrollment-created)
