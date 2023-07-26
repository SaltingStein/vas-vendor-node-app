#!/bin/bash
su ubuntu
source ~/.nvm/nvm.sh
cd ~/vas-vendor/
npm run preinstall
npm install 
npm run build
npm run postbuild
cd ~/vas-vendor/startup/
pm2 startOrRestart staging.config.js