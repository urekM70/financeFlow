from pydantic import BaseModel
from typing import Optional

class BudgetBase(BaseModel):
    category: str
    amount: float

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount: float

class BudgetResponse(BudgetBase):
    id: int

    class Config:
        orm_mode = True
