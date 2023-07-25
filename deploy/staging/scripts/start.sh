#!/bin/bash
# su ubuntu
# cd /home/ubuntu/vas-vendor/  
# npm install 
# npm run build
cd /home/ubuntu/vas-vendor/startup/
pm2 startOrRestart staging.config.js