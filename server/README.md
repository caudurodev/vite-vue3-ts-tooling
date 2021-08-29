1) create server ssh keys
ssh-keygen -t rsa && cat /root/.ssh/id_rsa.pub

2) Add server keys to github project
https://github.com/settings/keys

3) download repo
cd / && git clone git@github.com:caudurodev/freq_trade.git && cd freq_trade/ && docker-compose pull

4) generate dummy certificate so nginx will start without error
chmod +x init-letsencrypt.sh and sudo ./init-letsencrypt.sh.