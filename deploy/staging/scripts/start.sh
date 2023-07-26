#!/bin/bash
cd /home/ubuntu/vas-vendor/
sudo chown -R ubuntu:ubuntu . 
su ubuntu
source ~/.nvm/nvm.sh
npm run preinstall
npm install 
npm run build
npm run postbuild
cd /home/ubuntu/vas-vendor/startup/
pm2 startOrRestart staging.config.js