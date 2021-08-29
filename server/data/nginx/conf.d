server {
    listen 80;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    server_name translate.cauduro.dev;    location / {
        return 301 https://$host$request_uri;
    }    
}

server {
    listen 443 ssl;
    server_name translate.cauduro.dev;

    ssl_certificate /etc/letsencrypt/live/translate.cauduro.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/translate.cauduro.dev/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / {
        proxy_pass http://libretranslate:5000; #for demo purposes
    }
}