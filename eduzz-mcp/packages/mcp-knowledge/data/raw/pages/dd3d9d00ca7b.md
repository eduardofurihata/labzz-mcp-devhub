---
url: https://developers.eduzz.com/reference/webhook/alpaclass-student-lesson-unfinished
title: Eduzz Developers - Webhook - AlpaClass - Alunos - Aluno desmarcou a aula como concluída
crawledAt: 2026-02-02T17:54:57.374Z
---

# Eduzz Developers - Webhook - AlpaClass - Alunos - Aluno desmarcou a aula como concluída

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

*   [
    
    Aluno acessou o certificado
    
    ](/reference/webhook/alpaclass-student-certificate-accessed)
*   [
    
    Aluno comentou em uma aula
    
    ](/reference/webhook/alpaclass-student-comment-created)
*   [
    
    Aluno desfavoritou a aula
    
    ](/reference/webhook/alpaclass-student-lesson-unmarked-as-favorite)
*   [
    
    Aluno desmarcou a aula como concluída
    
    ](/reference/webhook/alpaclass-student-lesson-unfinished)
*   [
    
    Aluno desmarcou a finalização do curso
    
    ](/reference/webhook/alpaclass-student-course-unfinished)
*   [
    
    Aluno desmarcou um módulo como finalizado
    
    ](/reference/webhook/alpaclass-student-module-unfinished)
*   [
    
    Aluno favoritou a aula
    
    ](/reference/webhook/alpaclass-student-lesson-marked-as-favorite)
*   [
    
    Aluno finalizou o curso
    
    ](/reference/webhook/alpaclass-student-course-finished)
*   [
    
    Aluno finalizou um módulo
    
    ](/reference/webhook/alpaclass-student-module-finished)
*   [
    
    Aluno foi cadastrado na escola
    
    ](/reference/webhook/alpaclass-student-created)
*   [
    
    Aluno marcou a aula como concluída
    
    ](/reference/webhook/alpaclass-student-lesson-finished)
*   [
    
    Último acesso do aluno na aula
    
    ](/reference/webhook/alpaclass-student-lesson-last-seen)
*   [
    
    Último acesso do aluno no curso
    
    ](/reference/webhook/alpaclass-student-course-last-seen)

*   Blinket: Ingresso

*   Blinket: Participante

*   MyEduzz: Assinaturas

*   MyEduzz: Comissão

*   MyEduzz: Fatura

*   Nutror: Alunos

*   Nutror: Aulas

*   Nutror: Geral

*   SafeVideo: Processamento de Arquivo

*   SafeVideo: Upload de Arquivo

*   Sun: Carrinho

1.  Reference
    
2.  Webhook
    
3.  AlpaClass
    
4.  Alunos
    
5.  Aluno desmarcou a aula como concluída
    

# Aluno desmarcou a aula como concluída

Notifica quando o aluno desmarcou a aula como concluída

**Evento:**

alpaclass.student\_lesson\_unfinished

### Response params

**id**

string

Id do evento

**event**

string

Nome do evento (student\_lesson\_unfinished)

**sentDate**

string

Data do envio do evento

**data**

object

Dados do evento

**data.progress**

number

Progresso total do aluno no curso da aula

**data.student**

object

Dados do aluno

**data.student.id**

string

Id do aluno na escola

**data.student.name**

string

Nome do aluno

**data.student.email**

string

E-mail do aluno

**data.lesson**

object

Dados da aula

**data.lesson.id**

string

Id da aula

**data.lesson.name**

string

Nome da aula

**data.module**

object

Dados do módulo

**data.module.id**

string

Id do módulo

**data.module.name**

string

Nome do módulo

**data.course**

object

Dados do curso

**data.course.id**

string

Id do curso

**data.course.name**

string

Nome do curso

**data.team**

object

Dados da escola

**data.team.id**

string

Id da escola

**data.team.name**

string

Nome da escola

[![Swagger Logo](/_next/image?url=%2Flogos%2Fswagger.webp&w=256&q=75 "Swagger Webhook Reference")](/swagger#/webhooks/postalpaclass_student_lesson_unfinished)

### Payload

```json
1{
2  "id": "4c832x3ynl8dwe7454941xzr5",
3  "event": "alpaclass.student_lesson_unfinished",
4  "sentDate": "2024-06-12T12:00:10.000Z",
5  "data": {
6    "progress": 50,
7    "student": {
8      "id": "457391c9c82bfdcbb4947278c0401e41",
9      "name": "Fulano da Silva",
10      "email": "fulano.s@gmail.com"
11    },
12    "lesson": {
13      "id": "6220a030be5f7a8c4760d3e9b4d5d9ee",
14      "name": "A história do POO"
15    },
16    "module": {
17      "id": "22884db148f0ffb0d830ba431102b0b5",
18      "name": "Módulo 1"
19    },
20    "course": {
21      "id": "046d47672cf6212d201d6e8b0c191e73",
22      "name": "Princípios da Programação Orientada a Objetos"
23    },
24    "team": {
25      "id": "16943848cc6495142a8e3011d0173252",
26      "name": "Escola de Beltrano"
27    }
28  }
29}
```

[

Anterior**Aluno desfavoritou a aula**

](/reference/webhook/alpaclass-student-lesson-unmarked-as-favorite)[

Próxima**Aluno desmarcou a finalização do curso**

](/reference/webhook/alpaclass-student-course-unfinished)
