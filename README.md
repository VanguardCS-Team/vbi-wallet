# Node.js Express App Deployment on Ubuntu with Nginx 🚀

This guide explains how to deploy a Node.js Express application on an Ubuntu server using Nginx as a reverse proxy with SSL enabled via [Certbot](https://certbot.eff.org). It also covers process management using [PM2](https://pm2.keymetrics.io) and troubleshooting common issues.

> **Note:** Replace placeholder values like `your-username`, `your-node-app`, `/opt/cloudstrucc/vbi/vbi-wallet/vbi-wallet/onboarding-web-app`, and `vbi-dev.cloudstrucc.com` with your actual settings.

---

## Prerequisites 📋

- **Server Requirements:**
  - Ubuntu Server 22.04 LTS or higher
  - A domain or subdomain configured to point to your server (e.g., `vbi-dev.cloudstrucc.com`)
  - Sudo/root privileges
- **Software Requirements:**
  - [Nginx](https://nginx.org) – for serving your app
  - [Certbot](https://certbot.eff.org) – for SSL certificates
  - [Node.js](https://nodejs.org) and npm
  - [PM2](https://pm2.keymetrics.io) (optional, for process management)
- **Knowledge:**
  - Basic command-line usage and text editing

---

## System Setup 🔧

### 1. Update and Upgrade the System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Required Packages

Install Nginx, Certbot, and build tools:

```bash
sudo apt install nginx certbot python3-certbot-nginx build-essential -y
```

### 3. Install Node.js

For Node.js 18.x (or your chosen version), use NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

If you need to manage multiple Node.js versions, consider installing [nvm](https://github.com/nvm-sh/nvm).

---

## Application Deployment 📦

### 1. Deploy Your Application Code

Ensure your Node.js app is located at your desired path (for example):

```bash
/opt/cloudstrucc/vbi/vbi-wallet/vbi-wallet/onboarding-web-app
```

Clone your repository or copy your files into that directory.

### 2. Build Your Application

If your application requires a build step (for instance, TypeScript compilation), run:

```bash
cd /opt/cloudstrucc/vbi/vbi-wallet/vbi-wallet/onboarding-web-app
npm install
npm run build
```

---

## Nginx Configuration 🌐

### 1. Create the Nginx Configuration File

Create a file named, for example, `vbi-dev` in `/etc/nginx/sites-available/`:

```bash
sudo vim /etc/nginx/sites-available/vbi-dev
```

Add the following configuration:

```nginx
server {
    server_name vbi-dev.cloudstrucc.com;
    
    # Set the root directory to your application's build output
    root /opt/cloudstrucc/vbi/vbi-wallet/vbi-wallet/onboarding-web-app;

    # Special handling for the root path – always proxy to Node.js
    location = / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # For all other paths, try serving static files first, then proxy
    location / {
        try_files $uri $uri/ @nodejs;
    }

    # Proxy unmatched requests to the Node.js app
    location @nodejs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    http2;

    # SSL certificate settings (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/vbi-dev.cloudstrucc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vbi-dev.cloudstrucc.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = vbi-dev.cloudstrucc.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name vbi-dev.cloudstrucc.com;
    return 404;
}
```

### 2. Enable the Site

Create a symbolic link in the `sites-enabled` directory:

```bash
sudo ln -s /etc/nginx/sites-available/vbi-dev /etc/nginx/sites-enabled/
```

### 3. Test and Reload Nginx

Test the configuration:

```bash
sudo nginx -t
```

If the test passes, reload Nginx:

```bash
sudo systemctl reload nginx
```

---

## SSL Certificate Setup 🔒

Use Certbot to obtain and install your SSL certificate:

```bash
sudo certbot --nginx -d vbi-dev.cloudstrucc.com
```

Follow the prompts to complete the certificate issuance and configuration.

---

## Process Management with PM2 🏃‍♂️

For reliable process management, use PM2.

### 1. Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 2. Start the Application Using PM2

Replace `app.js` with your app's entry file if different:

```bash
pm2 start app.js --name "your-node-app" --watch
```

### 3. Configure PM2 to Launch on System Boot

```bash
pm2 startup systemd
pm2 save
```

---

## Troubleshooting 🛠

### Nginx Configuration Issues

- **Deprecated HTTP/2 Directive:**  
  If you see a warning about the "listen ... http2" directive, use:
  ```nginx
  listen 443 ssl;
  http2;
  ```
- **Missing SSL Certificate Directives:**  
  Ensure `ssl_certificate` and `ssl_certificate_key` point to valid certificate files (often provided by Certbot).
- **Missing Include Files:**  
  If Nginx complains about an `include` file not found, either create that file or remove/comment out the directive in your configuration.

### Memory Issues During npm Install ("Killed" Message)

- Check system logs for OOM kills:
  ```bash
  dmesg | grep -i kill
  ```
- Verify available memory:
  ```bash
  free -h
  ```
- **Add Swap Space** if necessary:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  ```
  Confirm with:
  ```bash
  free -h
  ```
- After adding swap, retry:
  ```bash
  npm install
  ```

### Rebuilding Node Modules

If issues persist, clean your installation:

```bash
rm -rf node_modules package-lock.json && npm cache clean --force
npm install
```

### Restarting the Website

- **Reload Nginx:**
  ```bash
  sudo systemctl reload nginx
  ```
- **Restart the Node.js App via PM2:**
  ```bash
  pm2 restart your-node-app
  ```

### Checking Application Deployment

- Verify that your application's build output (e.g., the `dist` folder) is updated.
- If you aren’t seeing changes, try clearing your browser cache or using an incognito window.

---

## Additional Resources 📚

- [Nginx Documentation](https://nginx.org) :octocat:
- [Certbot Documentation](https://certbot.eff.org) 🔒
- [Node.js Documentation](https://nodejs.org) 📘
- [PM2 Documentation](https://pm2.keymetrics.io) 🚀
- [nvm GitHub Repository](https://github.com/nvm-sh/nvm) 🛠

---

After making changes to your configuration or code, remember to test your Nginx configuration with:

```bash
sudo nginx -t
```

and restart your Node.js app (or the entire server) to see the changes applied (e.g., use `pm2 list` then `pm2 restart <app-name>`).