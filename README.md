E-COMMERCE SYSTEM: yarn + ESM
Notes: "yarn init" to set up the NODEJS Back-end environment.


### 🧩 Folder Descriptions

| Folder | Description | Example Responsibilities |
|:--------|:-------------|:--------------------------|
| **auth/** | Handles authentication and authorization processes. | Create/verify JWT tokens, encrypt data, handle API keys. |
| **configs/** | Manages environment variables and configuration files. | Separate settings for development and production. |
| **controllers/** | Acts as the bridge between routes and services. | Handle incoming requests and send responses to clients. |
| **core/** | Contains core utilities shared across the system. | Error handling, API response formatting, logging. |
| **dbs/** | Handles database connections and monitoring. | Initialize Postgresql, manage connection pools. |
| **helpers/** | Provides system-level helper functions. | Check overloaded DB connections, monitor CPU and memory usage. |
| **models/** | Defines database schemas using Mongoose. | User, Product, Order models, etc. |
| **routes/** | Defines REST API routes. | `user.route.js`, `product.route.js`, etc. |
| **services/** | Implements business logic and interacts with models. | Create/update entities, handle transactions. |
| **utils/** | Provides general-purpose utilities independent of the system. | Format data, extract object fields, generate random IDs. |

---

### 🧠 Notes

- `helpers/` are tied to your app environment (e.g., database or system checks).  
- `utils/` are generic and can be reused in any project.  
- Keep controllers **thin** — only handle requests and responses.  
  Place main logic in **services/** for maintainability.

---
Inside package.json

  "type": "module", // ESM

  "start": "nodemon server.js", // run server with this command line

  "watch": "node --watch server.js" // enables file watching mode

  "nodemon": "^3.1.10", // auto-restart

Use **sequelize-auto** to reverse-engineer models from your existing PostgreSQL tables:

  "yarn sequelize-auto -h localhost -d ecommerce -u user -x user -p 5432 --dialect postgres -o ./src/models -l esm"

Why **Singleton Pattern** for connection with database?

  Ensures only one active DB connection across the app.

  Prevents performance issues caused by multiple redundant connections.

  Makes the connection accessible from anywhere via the single instance.

## ⚙️ Understanding `async` and `await` in JavaScript

`async` and `await` are **modern JavaScript keywords** used to handle **asynchronous operations** (like connecting to databases, reading files, or making HTTP requests) in a way that looks and behaves more like synchronous code.

`async` functions are marked , they automatically return **Promise** .

`await` can only be used inside an async function. It pauses the execution of that function until the Promise is resolved (finished).


**sequelize.sync()**

  It creates or updates your tables automatically based on your model definitions in code.

  It only affects the database schema (tables, columns).

  It does not generate any .js or .ts model files for you.

  Typically used during development or initial setup.

  ---------------------------


