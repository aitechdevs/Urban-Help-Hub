# Validation

The maintained frontend modules passed JavaScript syntax and mocked React/DOM
checks for task editing, dashboard navigation, single ID selection, duplicate
blocking and rejected-ID replacement controls. Backend additions passed static
PHP parsing. The assembled repository is checked for PHP syntax, route additions,
excluded secrets/runtime folders and byte-identical static rebuild output.
PHP runtime tests have not been executed locally because PHP is unavailable.
Included feature tests require a separate isolated test database: never execute
RefreshDatabase tests against production data. Some older identity tests describe
the superseded background-check policy and are intentionally excluded here.
Live acceptance still required: replacement document approval, final helper
verification, service activation and final helper verification email.
