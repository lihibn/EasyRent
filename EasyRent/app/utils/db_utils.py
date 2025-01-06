import sqlite3
from flask import g, current_app

def get_db():
    """Get a database connection."""
    if 'db' not in g:
        # Open a new database connection and store it in the app context (g)
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        # Return rows as dictionaries for easy access
        g.db.row_factory = sqlite3.Row

    return g.db

def close_db(e=None):
    """Close the database connection if it exists."""
    db = g.pop('db', None)

    if db is not None:
        db.close()
