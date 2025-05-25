from typing import List

from sqlalchemy import select

from ..database import AsyncSessionLocal
from ..models.db_models import EmailTodo
from ..models.models import TodoItem


async def fetch_todos() -> List[TodoItem]:
    """Fetches all todos from the database."""
    async with AsyncSessionLocal() as session:
        try:
            # Query all todos from the database
            result = await session.execute(select(EmailTodo))
            todos = result.scalars().all()

            # Convert database objects to Pydantic models
            todo_items = []
            for todo in todos:
                todo_item = TodoItem(
                    task=todo.task, priority=todo.priority, due_date=todo.due_date
                )
                todo_items.append(todo_item)

            return todo_items
        except Exception as e:
            raise Exception(f"Error fetching todos from database: {str(e)}")
