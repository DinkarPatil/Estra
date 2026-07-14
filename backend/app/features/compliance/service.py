from app.features.compliance.pipeline import aml_check, legal_check, tax_check
from app.features.compliance.schemas import ComplianceRequest, ComplianceResponse


def screen(body: ComplianceRequest) -> ComplianceResponse:
    legal = legal_check.run(body.property_id, body.buyer_country)
    tax = tax_check.run(body.property_id, body.buyer_country)
    aml = aml_check.run(body.property_id)

    flag = "clear"
    for result in (legal, tax, aml):
        if result.get("status") == "blocked":
            flag = "blocked"
            break
        if result.get("status") == "review":
            flag = "review"

    return ComplianceResponse(
        property_id=body.property_id, legal=legal, tax=tax, aml=aml, overall_flag=flag
    )
