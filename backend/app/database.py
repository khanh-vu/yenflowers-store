"""
Database connection module.
Supports both Supabase client and direct PostgreSQL connections.
"""
from typing import Optional, Any
from app.config import get_settings

settings = get_settings()


# =====================================================
# PostgreSQL Wrapper (for direct DB connection)
# =====================================================
class PostgresClient:
    """
    Wrapper around psycopg2 that mimics Supabase client API.
    Allows using the same code for both Supabase and direct PostgreSQL.
    """
    
    def __init__(self, connection_string: str):
        import psycopg2
        import psycopg2.extras
        self.connection_string = connection_string
        self._conn = None
    
    def _get_connection(self):
        import psycopg2
        import psycopg2.extras
        if self._conn is None or self._conn.closed:
            self._conn = psycopg2.connect(self.connection_string)
            self._conn.autocommit = True
            # Register JSON adapters
            psycopg2.extras.register_default_json(self._conn)
            psycopg2.extras.register_default_jsonb(self._conn)
        return self._conn
    
    def table(self, table_name: str) -> 'PostgresTableQuery':
        return PostgresTableQuery(self, table_name)


class PostgresTableQuery:
    """Query builder that mimics Supabase table().select().eq() API."""
    
    def __init__(self, client: PostgresClient, table_name: str):
        self.client = client
        self.table_name = table_name
        self._select_cols = "*"
        self._count_mode = None
        self._filters = []
        self._order_col = None
        self._order_desc = False
        self._limit_val = None
        self._offset_val = None
        self._range_start = None
        self._range_end = None
    
    def select(self, columns: str = "*", count: str = None) -> 'PostgresTableQuery':
        self._select_cols = columns
        self._count_mode = count
        return self
    
    def eq(self, column: str, value: Any) -> 'PostgresTableQuery':
        self._filters.append((column, "=", value))
        return self
    
    def neq(self, column: str, value: Any) -> 'PostgresTableQuery':
        self._filters.append((column, "!=", value))
        return self
    
    def gt(self, column: str, value: Any) -> 'PostgresTableQuery':
        self._filters.append((column, ">", value))
        return self
    
    def gte(self, column: str, value: Any) -> 'PostgresTableQuery':
        self._filters.append((column, ">=", value))
        return self
    
    def lt(self, column: str, value: Any) -> 'PostgresTableQuery':
        self._filters.append((column, "<", value))
        return self
    
    def lte(self, column: str, value: Any) -> 'PostgresTableQuery':
        self._filters.append((column, "<=", value))
        return self
    
    def ilike(self, column: str, pattern: str) -> 'PostgresTableQuery':
        self._filters.append((column, "ILIKE", pattern))
        return self
    
    def contains(self, column: str, value: list) -> 'PostgresTableQuery':
        self._filters.append((column, "@>", value))
        return self
    
    def or_(self, conditions: str) -> 'PostgresTableQuery':
        # Simplified or_ - parse conditions like "name_vi.ilike.%q%,name_en.ilike.%q%"
        self._filters.append(("__or__", conditions, None))
        return self
    
    def order(self, column: str, desc: bool = False) -> 'PostgresTableQuery':
        self._order_col = column
        self._order_desc = desc
        return self
    
    def limit(self, count: int) -> 'PostgresTableQuery':
        self._limit_val = count
        return self
    
    def range(self, start: int, end: int) -> 'PostgresTableQuery':
        self._range_start = start
        self._range_end = end
        return self
    
    def _build_query(self, for_count: bool = False) -> tuple[str, list]:
        import psycopg2.sql as sql
        
        params = []
        
        # SELECT
        if for_count:
            query = f"SELECT COUNT(*) FROM {self.table_name}"
        else:
            query = f"SELECT {self._select_cols} FROM {self.table_name}"
        
        # WHERE
        if self._filters:
            where_parts = []
            for f in self._filters:
                col, op, val = f
                if col == "__or__":
                    # Parse or conditions (simplified)
                    where_parts.append(f"({op})")
                elif op == "@>":
                    where_parts.append(f"{col} @> %s")
                    params.append(val)
                else:
                    where_parts.append(f"{col} {op} %s")
                    params.append(val)
            query += " WHERE " + " AND ".join(where_parts)
        
        # ORDER
        if self._order_col and not for_count:
            direction = "DESC" if self._order_desc else "ASC"
            query += f" ORDER BY {self._order_col} {direction}"
        
        # LIMIT / OFFSET (range)
        if self._range_start is not None and not for_count:
            query += f" LIMIT {self._range_end - self._range_start + 1} OFFSET {self._range_start}"
        elif self._limit_val and not for_count:
            query += f" LIMIT {self._limit_val}"
        
        return query, params
    
    def execute(self) -> 'PostgresResult':
        import psycopg2.extras
        import json
        conn = self.client._get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Helper to process values
        def process_value(val):
            if isinstance(val, (dict, list)):
                return json.dumps(val)
            return val

        # Handle mutations first
        if hasattr(self, '_insert_data') and self._insert_data:
            columns = list(self._insert_data.keys())
            values = [process_value(v) for v in self._insert_data.values()]
            placeholders = ["%s"] * len(values)
            
            query = f"INSERT INTO {self.table_name} ({', '.join(columns)}) VALUES ({', '.join(placeholders)}) RETURNING *"
            cursor.execute(query, values)
            data = [dict(row) for row in cursor.fetchall()]
            return PostgresResult(data, len(data))
            
        if hasattr(self, '_update_data') and self._update_data:
            set_clauses = []
            values = []
            for k, v in self._update_data.items():
                set_clauses.append(f"{k} = %s")
                values.append(process_value(v))
            
            where_clause = ""
            if self._filters:
                where_parts = []
                for f in self._filters:
                    col, op, val = f
                    where_parts.append(f"{col} {op} %s")
                    values.append(process_value(val))
                where_clause = " WHERE " + " AND ".join(where_parts)
            
            query = f"UPDATE {self.table_name} SET {', '.join(set_clauses)}{where_clause} RETURNING *"
            cursor.execute(query, values)
            data = [dict(row) for row in cursor.fetchall()]
            return PostgresResult(data, len(data))
            
        if hasattr(self, '_delete') and self._delete:
            values = []
            where_clause = ""
            if self._filters:
                where_parts = []
                for f in self._filters:
                    col, op, val = f
                    where_parts.append(f"{col} {op} %s")
                    values.append(process_value(val))
                where_clause = " WHERE " + " AND ".join(where_parts)
            
            query = f"DELETE FROM {self.table_name}{where_clause} RETURNING *"
            cursor.execute(query, values)
            data = [dict(row) for row in cursor.fetchall()]
            return PostgresResult(data, len(data))

        # Get data (SELECT)
        query, params = self._build_query()
        cursor.execute(query, params)
        data = [dict(row) for row in cursor.fetchall()]
        
        # Get count if requested
        count = None
        if self._count_mode == "exact":
            count_query, count_params = self._build_query(for_count=True)
            cursor.execute(count_query, count_params)
            count = cursor.fetchone()['count']
        
        cursor.close()
        return PostgresResult(data, count)

    def insert(self, data: dict) -> 'PostgresTableQuery':
        self._insert_data = data
        return self
    
    def update(self, data: dict) -> 'PostgresTableQuery':
        self._update_data = data
        return self
    
    def delete(self) -> 'PostgresTableQuery':
        self._delete = True
        return self


class PostgresResult:
    """Result object that mimics Supabase response."""
    
    def __init__(self, data: list, count: Optional[int] = None):
        self.data = data
        self.count = count


# =====================================================
# Database Client Factory
# =====================================================
def _create_postgres_client():
    """Create direct PostgreSQL client."""
    return PostgresClient(settings.database_url)


def _create_supabase_client(admin: bool = False):
    """Create Supabase client."""
    from supabase import create_client, Client
    if admin:
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    return create_client(settings.supabase_url, settings.supabase_anon_key)


# =====================================================
# Public API - Same interface for both modes
# =====================================================
if settings.use_postgres:
    # Direct PostgreSQL mode
    print("🐘 Using direct PostgreSQL connection")
    _db_client = _create_postgres_client()
    supabase = _db_client
    supabase_admin = _db_client
else:
    # Supabase mode
    print("⚡ Using Supabase client")
    supabase = _create_supabase_client(admin=False)
    supabase_admin = _create_supabase_client(admin=True)


def get_supabase():
    """Dependency for public database client."""
    return supabase


def get_supabase_admin():
    """Dependency for admin database client (bypasses RLS in Supabase mode)."""
    return supabase_admin


def get_db_client():
    """Get database client - alias for compatibility with AI services."""
    return supabase
