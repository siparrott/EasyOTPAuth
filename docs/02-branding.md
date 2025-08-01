# Branding

All customer-facing strings live in `branding.json`:

```json
{
  "appName": "Passwordless Auth",
  "companyName": "Acme Corp",
  "logoUrl": "/public/logo.png",
  "supportEmail": "support@example.com"
}
```

Update these values to white‑label the service. The data is exposed via `/health` and used in email templates.

You can also replace any files in the `public/` directory before building the
Docker image. The default setup serves `logo.png`, `favicon.ico` and
`css/theme.css` from `/public`.
