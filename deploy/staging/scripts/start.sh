#!/bin/bash
su ubuntu
source ~/.nvm/nvm.sh
cd /home/ubuntu/vas-vendor/
npm run preinstall
npm install 
npm run build
npm run postbuild
cd /home/ubuntu/vas-vendor/startup/
pm2 startOrRestart staging.config.js