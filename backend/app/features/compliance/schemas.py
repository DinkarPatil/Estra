from pydantic import BaseModel


class ComplianceRequest(BaseModel):
    property_id: str
    buyer_country: str | None = None


class ComplianceResponse(BaseModel):
    property_id: str
    legal: dict
    tax: dict
    aml: dict
    overall_flag: str  # "clear" | "review" | "blocked"
