server {
    listen 80;
    server_name translate.cauduro.dev;
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name translate.cauduro.dev;
    server_tokens off;

    ssl_certificate /etc/letsencrypt/live/translate.cauduro.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/translate.cauduro.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass  http://libretranslate:5000;
        proxy_set_header    Host                $http_host;
        proxy_set_header    X-Real-IP           $remote_addr;
        proxy_set_header    X-Forwarded-For     $proxy_add_x_forwarded_for;
    }
}