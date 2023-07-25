#!/bin/bash
source ~/.nvm/nvm.sh
su ubuntu
cd /home/ubuntu/vas-vendor/
npm run preinstall
npm install 
npm run build
npm run postbuild
cd /home/ubuntu/vas-vendor/startup/
/home/ubuntu/.nvm/versions/node/v16.14.0/bin/pm2 startOrRestart staging.config.js