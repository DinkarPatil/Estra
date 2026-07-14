"""Feature registry.

Importing each feature's ``models`` module here registers its tables on
``app.core.database.Base.metadata`` before ``create_all`` runs at startup.
Features with no persistent data (ranking, roi, geo_risk, compliance) don't
need to be listed.
"""

from app.features.auth import models as _auth_models  # noqa: F401
from app.features.search import models as _search_models  # noqa: F401
from app.features.property_intelligence import models as _property_models  # noqa: F401
from app.features.deals import models as _deals_models  # noqa: F401
from app.features.area_intelligence import models as _area_models  # noqa: F401
from app.features.broker import models as _broker_models  # noqa: F401
