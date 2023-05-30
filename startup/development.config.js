const Apps = require('./apps');
const ENV_NAME = 'development';

Apps.map((app)=>{
    app.name = app.name+'-'+ENV_NAME;
    app.watch = true;
    app.env = {
        ...app.env,
        NODE_ENV: ENV_NAME
    }
    return app;
});

var Startup = {apps: Apps};

module.exports = Startup;