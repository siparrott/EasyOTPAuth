# Quick Start

Run the installer on a fresh server:

```bash
curl -sSL https://dl.acme.com/install.sh | bash
```

This pulls the Docker images, asks for your SMTP credentials and starts the stack.
If you purchased a license, edit `.env` and set the `LICENSE` value after installation.
To white-label the service, update `branding.json` and replace any files in `public/` before building your Docker image.
