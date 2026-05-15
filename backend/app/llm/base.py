"""LLM base utilities.

Provides shared retry and error-handling logic across LLM providers.
"""

from typing import Any, Callable, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


def invoke_with_retry(
    invoke_fn: Callable[[], T],
    fallback_fn: Callable[[], T],
    retries: int = 1,
) -> T:
    """Invoke a function that returns a Pydantic model. Retry on exception.

    If it fails after `retries`, returns the result of `fallback_fn()`.
    """
    last_err: Exception | None = None
    for _ in range(retries + 1):
        try:
            return invoke_fn()
        except Exception as e:
            last_err = e

    # Optionally log last_err here
    return fallback_fn()
