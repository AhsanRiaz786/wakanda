"""LLM base utilities.

Provides shared retry and error-handling logic across LLM providers.
"""

import logging
from typing import Callable, TypeVar

from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def _is_non_retryable(err: Exception) -> bool:
    """Quota, auth, and model-not-found errors won't succeed on retry."""
    msg = str(err).upper()
    return any(
        token in msg
        for token in (
            "RESOURCE_EXHAUSTED",
            "NOT_FOUND",
            "404",
            "UNAUTHENTICATED",
            "401",
            "PERMISSION_DENIED",
            "403",
        )
    )


def invoke_with_retry(
    invoke_fn: Callable[[], T],
    fallback_fn: Callable[[], T] | None = None,
    retries: int = 1,
) -> T:
    """Invoke a function that returns a Pydantic model. Retry on exception.

    If it fails after `retries`, returns the result of `fallback_fn()` if provided,
    otherwise raises the exception.
    """
    last_err: Exception | None = None
    attempts = retries + 1
    for attempt in range(attempts):
        try:
            return invoke_fn()
        except Exception as e:
            last_err = e
            if _is_non_retryable(e):
                break

    if fallback_fn is not None:
        if last_err:
            logger.warning(
                "LLM invocation failed after %s attempt(s); using fallback: %s",
                attempt + 1,
                last_err,
            )
        return fallback_fn()

    if last_err:
        raise last_err
    raise RuntimeError("LLM invocation failed")
