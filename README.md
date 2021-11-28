# wd-express-fs-router

A simple filesystem-based router for [express](http://expressjs.com/), made for [weedocs](http://weedocs.app) project.

#### Usage:

In your server script:

```js
// index.js

const express = require('express');
const app = express();
const router = require('wd-express-fs-router');
// [...]
router('your/app/folder', app);
// [...]
app.listen(3000); 
```

#### Directory Structure and File naming

The route files must be named following this especification: `[route].[httpMethod].[extension]`

- **[route]**: The route path. You can declare params using `:` at start of name. ex: `:post_id.get.js`;
- **[httpMethod]**: The http method in lower case. `get`,`post`,`put`,`delete`;
- **[extension]**: The file extension `.js` or `.ts`.


This example assumes you have a directory `src/routes` next to the `index.js` file.

```
src/routes/
├─ posts/
│ └─ :id.get.js
│ └─ :id.put.js
│ └─ index.get.js
│ └─ index.post.js

```

The following routes will be generated:

```
GET /posts --> src/routes/posts/index.get.js
POST /posts --> src/routes/posts/index.post.js
GET /posts/:id --> src/routes/posts/:id.get.js
PUT /posts/:id --> src/routes/posts/:id.put.js
```

You also can create create directories to compose the route path.

```
├─ posts/
│ └─ :id/
│    └─ comments.get.js

 //  GET post/:id/comments
```

All route files must exports a function with the [express route handler](http://expressjs.com/en/guide/routing.html). Like this:

```js
module.exports = function (req, res) {
   // res.json({  });
}
```


#### Middlewares

The router also supports Middlewares. You can declare middlewares creating files named `_middleware.js`.
This files must exports a function with the [middleware handler](http://expressjs.com/en/guide/writing-middleware.html).

```js
// _middleware.js
module.exports = function (req, res, next) {
   // do something or:
   next();
}
```

All middlewares will be inherited from current and all parents directories .

```
src/routes/
├─ posts/
│ └─ _middleware.js
│ └─ index.get.js 
│        // will pass through /posts/_middleware.js 
│ └─ comments
│    └─ index.get.js 
│          // will pass through /posts/_middleware.js 
│          // and posts/comments/_middleware.js
```