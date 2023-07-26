#!/bin/bash
# su ubuntu
source ~/.nvm/nvm.sh
cd ~/vas-vendor/
npm run preinstall
npm install 
npm run build
npm run postbuild
cd ~/vas-vendor/startup/
/home/ubuntu/.nvm/versions/node/v16.14.0/bin/pm2 startOrRestart staging.config.js