https://pentacent.medium.com/nginx-and-lets-encrypt-with-docker-in-less-than-5-minutes-b4b8a60d3a71

0) log on to server
ssh root@68.183.218.102

increase swap memory
sudo fallocate -l 6G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile 

1) create server ssh keys
ssh-keygen -t rsa && cat /root/.ssh/id_rsa.pub



2) Add server keys to github project
https://github.com/settings/keys

3) download repo
cd / && git clone git@github.com:caudurodev/vite-vue3-ts-tooling.git && cd freq_trade/ && docker-compose pull

cd vite-vue3-ts-tooling/server



4) generate dummy certificate so nginx will start without error
chmod +x init-letsencrypt.sh && sudo ./init-letsencrypt.sh.



should now work
docker-compose  up