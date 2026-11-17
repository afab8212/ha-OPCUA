"""Pulse for push buttons: set a bit, wait, reset it.

PLC step logic usually reacts to the rising edge. A bit left at 1 blocks the
next press, so the reset is always attempted: also when setting failed (the
write may still have arrived) or the press was cancelled, and on errors a few
more times. The reset runs as its own task, so it completes even when the
caller is cancelled again.

No dependency on Home Assistant.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable

_LOGGER = logging.getLogger(__name__)

RESET_ATTEMPTS = 3
RESET_RETRY_DELAY = 0.5  # seconds between reset attempts
MIN_GAP_MS = 200  # bit stays 0 at least this long between two pulses
MAX_GAP_MS = 500  # and at most this long, so a queued press follows soon

Write = Callable[[bool], Awaitable[None]]
Sleep = Callable[[float], Awaitable[None]]


async def pulse(
    write: Write,
    pulse_ms: int,
    name: str = "",
    *,
    attempts: int = RESET_ATTEMPTS,
    retry_delay: float = RESET_RETRY_DELAY,
    sleep: Sleep = asyncio.sleep,
) -> None:
    """write(True), wait pulse_ms, write(False).

    If setting fails, the reset is still attempted and the error of setting is
    raised (reset errors are only logged). If only the reset fails on every
    attempt, its last error is raised.
    """

    async def reset() -> None:
        for attempt in range(1, attempts + 1):
            try:
                await write(False)
            except Exception as err:  # noqa: BLE001 - retry on any error
                if attempt >= attempts:
                    _LOGGER.error(
                        "%s: reset failed after %d attempts: %s", name, attempt, err
                    )
                    raise
                _LOGGER.warning(
                    "%s: reset failed (attempt %d of %d): %s",
                    name,
                    attempt,
                    attempts,
                    err,
                )
                await sleep(retry_delay)
            else:
                if attempt > 1:
                    _LOGGER.info("%s: reset succeeded on attempt %d", name, attempt)
                return

    async def finish(quiet: bool) -> None:
        # Own task: the reset completes even if the caller is cancelled.
        task = asyncio.ensure_future(reset())
        if quiet:
            task.add_done_callback(lambda t: t.cancelled() or t.exception())
        try:
            await asyncio.shield(task)
        except Exception:  # noqa: BLE001
            if not quiet:
                raise

    try:
        await write(True)
        await sleep(pulse_ms / 1000)
    except BaseException:
        await finish(quiet=True)  # the error of setting (or the cancel) counts
        raise
    await finish(quiet=False)


class PulseQueue:
    """Run the pulses of one button one after another.

    While a pulse runs, at most one more press waits (further ones are
    skipped). Between two pulses the bit stays 0 as long as the last pulse
    lasted, limited to MIN_GAP_MS..MAX_GAP_MS, so the PLC sees every edge.
    """

    def __init__(self, clock: Callable[[], float] = time.monotonic) -> None:
        self._lock = asyncio.Lock()
        self._waiting = False
        self._free_at = 0.0
        self._clock = clock

    async def press(
        self,
        write: Write,
        pulse_ms: int,
        name: str = "",
        *,
        sleep: Sleep = asyncio.sleep,
        **kwargs,
    ) -> bool:
        """Run a pulse; False when skipped (a press is already queued)."""
        queued = self._lock.locked()
        if queued:
            if self._waiting:
                _LOGGER.info("%s: a press is already queued, press skipped", name)
                return False
            self._waiting = True
        acquired = False
        try:
            async with self._lock:
                acquired = True
                if queued:
                    self._waiting = False
                wait = self._free_at - self._clock()
                if wait > 0:
                    await sleep(wait)
                try:
                    await pulse(write, pulse_ms, name, sleep=sleep, **kwargs)
                finally:
                    gap = min(max(pulse_ms, MIN_GAP_MS), MAX_GAP_MS)
                    self._free_at = self._clock() + gap / 1000
        finally:
            if queued and not acquired:
                self._waiting = False  # cancelled while waiting
        return True
