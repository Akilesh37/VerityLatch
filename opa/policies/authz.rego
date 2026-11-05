package veritylatch.authz

import future.keywords.in

default allow = false
default require_approval = false
default deny = false

# Rule 1: Prohibited tools are unconditionally denied
deny {
    input.tool_name == "export_env_secrets"
}

deny {
    input.tool_name == "execute_payment"
}

# Rule 2: Untrusted provenance cannot execute critical or high sensitivity tools
deny {
    contains(lower(input.context_provenance), "untrusted")
    input.tool_sensitivity in ["high", "critical"]
}

# Rule 3: Actions requiring Human-In-The-Loop Approval
require_approval {
    input.tool_name == "restart_service"
    input.environment == "production"
}

require_approval {
    input.tool_name == "prepare_payment_request"
}

require_approval {
    input.requires_approval == true
}

# Rule 4: Explicit allow if delegated and not requiring approval or prohibited
allow {
    input.tool_allowed == true
    not require_approval
    not deny
}
