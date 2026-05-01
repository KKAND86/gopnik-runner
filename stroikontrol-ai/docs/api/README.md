# API Documentation — СтройКонтроль AI v2.1

## Base URL
`https://api.stroikontrol.ru/api/v1`

## Authentication
All endpoints (except `/auth/*`) require Bearer token:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/otp/send` | Send SMS OTP |
| POST | `/auth/otp/verify` | Verify OTP, return JWT |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects` | Create project |
| GET | `/projects` | List projects |
| GET | `/projects/{id}` | Get project |
| PATCH | `/projects/{id}/calibration` | Set calibration |
| POST | `/projects/{id}/photos` | Upload photo |
| POST | `/projects/{id}/audio` | Upload audio |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analysis/start` | Start AI analysis |
| GET | `/analysis/{project_id}` | Get status/results |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reports/export` | Export PDF/JSON |
| POST | `/reports/{id}/dispute` | Dispute AI verdict |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create` | Create payment |
| POST | `/payments/webhook/{provider}` | Provider webhook |

### Expert Review
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/experts/queue` | Review queue |
| POST | `/experts/queue/{id}/assign` | Assign review |
| POST | `/experts/defects/{id}/review` | Submit verdict |

## Error Codes
| Code | Description |
|------|-------------|
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden (not enough permissions) |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate phone) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limits
- Auth endpoints: 5 requests/minute
- API endpoints: 100 requests/minute
- Upload endpoints: 10 requests/minute

## File Uploads
- Max image size: 20 MB
- Max audio size: 10 MB
- Supported formats: JPEG, PNG, HEIC (images); WAV, M4A, AAC (audio)
