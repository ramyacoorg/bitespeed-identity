# Bitespeed Identity Reconciliation Backend

## Overview
This project implements the Identity Reconciliation system as part of the Bitespeed Backend Task.

It identifies and links customer contacts based on email and phone number and consolidates them under a single primary contact.

---

## Tech Stack
- Node.js
- Express.js
- PostgreSQL
- pg (node-postgres)

---

## API Endpoint

### POST /identify

### Request Body
```json
{
  "email": "string",
  "phoneNumber": "string"
}


output
{
  "contact": {
    "primaryContactId": number,
    "emails": [],
    "phoneNumbers": [],
    "secondaryContactIds": []
  }
}