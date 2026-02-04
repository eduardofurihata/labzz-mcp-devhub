---
url: https://developers.eduzz.com/reference/webhook/nutror-comment-created
title: Eduzz Developers - Webhook - Nutror - Aulas - Comentário Criado
crawledAt: 2026-02-02T17:53:16.085Z
---

# Eduzz Developers - Webhook - Nutror - Aulas - Comentário Criado

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

*   Nutror: Aulas

*   [
    
    Aula Avaliada
    
    ](/reference/webhook/nutror-lesson-rated)
*   [
    
    Aula Finalizada
    
    ](/reference/webhook/nutror-lesson-watched)
*   [
    
    Aula Iniciada
    
    ](/reference/webhook/nutror-lesson-started)
*   [
    
    Aula Salva
    
    ](/reference/webhook/nutror-lesson-saved)
*   [
    
    Comentário Criado
    
    ](/reference/webhook/nutror-comment-created)
*   [
    
    Comentário Excluído
    
    ](/reference/webhook/nutror-comment-deleted)
*   [
    
    Comentário Respondido
    
    ](/reference/webhook/nutror-comment-replied)
*   [
    
    Módulo Finalizado
    
    ](/reference/webhook/nutror-module-completed)

*   Nutror: Geral

*   SafeVideo: Processamento de Arquivo

*   SafeVideo: Upload de Arquivo

*   Sun: Carrinho

1.  Reference
    
2.  Webhook
    
3.  Nutror
    
4.  Aulas
    
5.  Comentário Criado
    

# Comentário Criado

Notifica quando um Aluno comenta em uma Aula

**Evento:**

nutror.comment\_created

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

E-mail do produtor

**data.producer.name**

string

Nome do produtor

**data.learner**

object

Dados do aluno

**data.learner.email**

string

E-mail do aluno

**data.learner.name**

string

Nome do aluno

**data.lesson**

object

Dados da aula

**data.lesson.id**

string

E-mail do produtor

**data.lesson.title**

string

Título da aula

**data.comment**

object

Dados do comentário

**data.comment.text**

string

Texto do comentário

**data.comment.id**

string

Id do comentário

**data.createdAt**

string

Data da criação do evento

**sentDate**

string

Data de envio

[![Swagger Logo](/_next/image?url=%2Flogos%2Fswagger.webp&w=256&q=75 "Swagger Webhook Reference")](/swagger#/webhooks/postnutror_comment_created)

### Payload

```json
1{
2  "id": "e14gf6wtjl5i3c0lz36amqkli",
3  "event": "nutror.comment_created",
4  "data": {
5    "producer": {
6      "email": "fulano@eduzz.com",
7      "name": "Fulano da Silva"
8    },
9    "learner": {
10      "email": "fulano@eduzz.com",
11      "name": "Ciclano da Silva"
12    },
13    "course": {
14      "hash": "1feb6e6b27ccaf9edee926908f710808e2d6c7e6",
15      "title": "Título do Curso"
16    },
17    "lesson": {
18      "id": "13",
19      "title": "Título da Aula"
20    },
21    "comment": {
22      "text": "Gostei muito da aula 👏",
23      "id": "73516053"
24    },
25    "createdAt": "2023-09-26T13:51:15Z"
26  },
27  "sentDate": "2024-02-29T14:33:04.634Z"
28}
```

[

Anterior**Aula Salva**

](/reference/webhook/nutror-lesson-saved)[

Próxima**Comentário Excluído**

](/reference/webhook/nutror-comment-deleted)
