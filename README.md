E-COMMERCE SYSTEM: yarn + ESM


### 🧩 Folder Descriptions

| Folder | Description | Example Responsibilities |
|:--------|:-------------|:--------------------------|
| **auth/** | Handles authentication and authorization processes. | Create/verify JWT tokens, encrypt data, handle API keys. |
| **configs/** | Manages environment variables and configuration files. | Separate settings for development and production. |
| **controllers/** | Acts as the bridge between routes and services. | Handle incoming requests and send responses to clients. |
| **core/** | Contains core utilities shared across the system. | Error handling, API response formatting, logging. |
| **dbs/** | Handles database connections and monitoring. | Initialize MongoDB, manage connection pools. |
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

