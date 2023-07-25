#!/bin/bash
# su ubuntu
# cd /home/ubuntu/vas-vendor/  
# npm install 
# npm run build
source ~/.nvm/nvm.sh
cd /home/ubuntu/vas-vendor/startup/
/home/ubuntu/.nvm/versions/node/v16.14.0/bin/pm2 startOrRestart staging.config.js