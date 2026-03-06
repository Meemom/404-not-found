"""MCP integration package for on-demand perception intelligence.

This package intentionally shares the name `mcp`, which can shadow the external
`mcp` library required by google-adk. We bridge that by extending this package
search path to include the site-packages `mcp` directory so imports like
`mcp.types` and `mcp.shared.session` continue to work.
"""

from __future__ import annotations

import sys
from pathlib import Path


def _extend_path_with_external_mcp() -> None:
	here = Path(__file__).resolve()
	local_pkg_dir = here.parent
	local_backend_dir = local_pkg_dir.parent

	for entry in list(sys.path):
		if not entry:
			continue
		candidate_root = Path(entry).resolve()
		if candidate_root == local_backend_dir:
			continue
		candidate_pkg = candidate_root / "mcp"
		candidate_init = candidate_pkg / "__init__.py"
		if candidate_init.exists():
			if str(candidate_pkg) not in __path__:
				__path__.append(str(candidate_pkg))
			break


_extend_path_with_external_mcp()

# Re-export specific symbols expected by google-adk imports.
try:
	from .client.session import ClientSession  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
	ClientSession = None  # type: ignore

try:
	from .client.stdio import StdioServerParameters  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
	StdioServerParameters = None  # type: ignore

try:
	from .types import *  # type: ignore  # noqa: F401,F403
	from . import types as types  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
	types = None  # type: ignore
