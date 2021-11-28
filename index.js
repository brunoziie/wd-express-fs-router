const fs = require('fs');
const path = require('path');
const allowedMethods = ['get', 'post', 'put', 'delete'];

const list = (dir) => {
  return fs.readdirSync(dir).map(file => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    const isDir = stats.isDirectory();

    const out = {
      path: file,
      type: isDir ? 'dir' : 'file'
    }

    if (isDir) {
      out.children = list(filepath);
    }

    return out;
  }).filter((entry) => {
    if (entry.type === 'file' && !(entry.path.endsWith('.js') || entry.path.endsWith('.ts'))) {
      return false;
    }

    return true;
  });
}

const isMiddleware = node => !!(/^_middleware\.(js|ts)$/.test(node.path));

const parseFileName = name => {
  const [ route, method, extension ] = name.split('.');
  return { route: route === 'index' ? '' : route, httpMethod: !extension ? 'get' : method };
}

const tree2routes = (tree, parentDir = null, parentRoute = '/', middlewareStack = []) => {
  const middlewares = [ ... middlewareStack ];
  const resolve = (f, p) => path.join(p || parentDir || '', f);
  const children = [];

  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];

    if (isMiddleware(node)) {
      if (node.type === 'file') {
        middlewares.push(resolve(node.path));
      }
      
      continue;
    }

    children.push(node);
  }

  return children.sort((a, b) => {
    if (a.path.startsWith(':') && b.path.startsWith(':')) {
      return 0;
    }

    if (a.path.startsWith(':')) {
      return -1;
    }

    return 1;
  }).reduce((acc, node) => {
    if (node.type === 'file') {
      const { route, httpMethod } = parseFileName(node.path);

      if (!allowedMethods.includes(httpMethod)) {
        throw new Error(`Invalid http method in "${resolve(node.path)}". Expected ${allowedMethods.join('|')}, but "${httpMethod}" was given`);
      }

      acc.push([
        httpMethod,
        path.join(parentRoute || '/', route), 
        [... middlewares, resolve(node.path) ]
      ]);

      return acc;
    }

    if (node.type === 'dir') {
      acc = [ 
        ... acc, 
        ... tree2routes(node.children, resolve(node.path), path.join(parentRoute || '/', node.path), middlewares)
      ]
    }

    return acc;
  }, []).filter(c => c);

  return out;
}

const requireFile = (() => {
  const files = {};

  return (path) => {
    if (!files[path]) {
      files[path] = require(path);
    }

    return files[path];
  }
})()

module.exports = function router (basedir, expressApp) {
  const tree = list(path.resolve(basedir));
  const routes = tree2routes(tree);

  routes.forEach(([httpMethod, route, middlewares]) => {
    const middlewareFns = middlewares.map(
      file => path.resolve(path.join(basedir, file))
    ).map(requireFile)

    expressApp[httpMethod].apply(expressApp, [ route, ... middlewareFns ])
  })
}