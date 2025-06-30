import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [];

//automatically load all files from "application" directory and register them
const autoLoadedFiles = require.context(
  '~', // Look for files in the "application" directory
  true, // include subdirectories
  /router\.mjs$/
);
autoLoadedFiles.keys().forEach((fileName) => {
  let routeList = autoLoadedFiles(fileName).default;
  if (!Array.isArray(routeList)) routeList = [routeList];
  for (const route of routeList) {
    // сейчас роуты из domain цепляются раньше, чем из lib, но при желании можно будет добавить проверку через route.source = fileName;
    if (!routes.find(({ path }) => path === route.path)) {
      // предотвращение ошибки "[vue-router] Duplicate named routes definition"
      routes.push(route);
    }
  }
});

const router = new VueRouter({ routes });

export default router;
