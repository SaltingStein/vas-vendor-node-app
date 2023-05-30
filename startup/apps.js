const Apps = [];

const BASE_DIR = './../application/';
const WORKER_DIR = BASE_DIR+'/workers/';

Apps.push({
    name: 'app-server',
    script: BASE_DIR+'server.js',
    exec_mode: 'fork',
    instances: 1
});



module.exports = Apps.slice().map((app)=>{
    app["source_map_support"] = true;
    return app;
});