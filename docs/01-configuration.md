# Configuration

Environment variables are read from `.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | `true` if using TLS |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `MAIL_FROM` | From address for emails |
| `REDIS_URL` | Redis connection string |
| `LICENSE_KEYS` | Comma-separated list of valid license keys |
| `LICENSE` | Your license key |

Start by copying `.env.example` and editing the values.
