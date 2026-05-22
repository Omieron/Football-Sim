## How to Run

### PostgreSQL Database Setup

1. Enter PostgreSQL and create the database:
   ```sql
   CREATE DATABASE league;
   \q
   ```

2. Load the tables into the database:
   ```bash
   psql -U postgres -d league -f sql/tables.sql
   ```
