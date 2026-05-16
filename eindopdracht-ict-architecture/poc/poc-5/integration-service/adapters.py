import httpx
import logging
import threading
import time
from models import HotelResult

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Simple circuit breaker with three states:
      CLOSED    → requests flow through normally
      OPEN      → requests are blocked immediately (fail fast)
      HALF_OPEN → one probe request is allowed through to test recovery
    """
    CLOSED    = "CLOSED"
    OPEN      = "OPEN"
    HALF_OPEN = "HALF_OPEN"

    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 15):
        self.failure_threshold = failure_threshold
        self.recovery_timeout  = recovery_timeout
        self.state             = self.CLOSED
        self.failure_count     = 0
        self.last_failure_time = 0.0
        self._lock             = threading.Lock()

    def record_success(self):
        with self._lock:
            self.failure_count = 0
            if self.state != self.CLOSED:
                logger.info("[CircuitBreaker] → CLOSED (recovered)")
            self.state = self.CLOSED

    def record_failure(self):
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                if self.state != self.OPEN:
                    logger.warning(
                        f"[CircuitBreaker] → OPEN after {self.failure_count} failures"
                    )
                self.state = self.OPEN

    def allow_request(self) -> bool:
        with self._lock:
            if self.state == self.CLOSED:
                return True
            if self.state == self.OPEN:
                elapsed = time.time() - self.last_failure_time
                if elapsed >= self.recovery_timeout:
                    logger.info("[CircuitBreaker] → HALF_OPEN (probing...)")
                    # Immediately mark OPEN so only one concurrent request acts as probe.
                    # record_success() will close it; record_failure() keeps it OPEN.
                    self.state = self.HALF_OPEN
                    return True
                return False
            # HALF_OPEN: block further requests until the probe resolves
            return False

    def status(self) -> dict:
        with self._lock:
            return {
                "state":              self.state,
                "failures":           self.failure_count,
                "threshold":          self.failure_threshold,
                "recovery_timeout_s": self.recovery_timeout,
            }


class BookingComAdapter:
    """
    Adapter for the (mock) Booking.com hotel API.

    Resilience features:
      - 3-second request timeout
      - 3 retries with exponential backoff (1s, 2s, 4s)
      - Circuit breaker: opens after 3 failures, probes after 15s
    """

    MAX_RETRIES     = 3
    TIMEOUT_SECONDS = 3.0
    BACKOFF_BASE    = 1.0   # seconds

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.circuit_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=15)

    def search_hotels(self, city: str) -> list[HotelResult]:
        if not self.circuit_breaker.allow_request():
            logger.error("[BookingComAdapter] Circuit OPEN — request blocked")
            raise RuntimeError("Circuit breaker is OPEN — external service unavailable")

        last_exception = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info(f"[BookingComAdapter] Attempt {attempt}/{self.MAX_RETRIES} for city={city!r}")
                raw = self._fetch(city)
                self.circuit_breaker.record_success()
                return self._translate(raw)

            except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError) as exc:
                last_exception = exc
                self.circuit_breaker.record_failure()
                logger.warning(f"[BookingComAdapter] Attempt {attempt} failed: {exc}")

                if attempt < self.MAX_RETRIES:
                    backoff = self.BACKOFF_BASE * (2 ** (attempt - 1))
                    logger.info(f"[BookingComAdapter] Retrying in {backoff:.0f}s...")
                    time.sleep(backoff)

        raise RuntimeError(
            f"All {self.MAX_RETRIES} attempts failed for city={city!r}: {last_exception}"
        )

    def _fetch(self, city: str) -> list[dict]:
        with httpx.Client(timeout=self.TIMEOUT_SECONDS) as client:
            resp = client.get(f"{self.base_url}/hotels", params={"city": city})
            resp.raise_for_status()
            return resp.json()

    def _translate(self, raw: list[dict]) -> list[HotelResult]:
        """Translate Booking.com JSON format → internal HotelResult model."""
        results = []
        for item in raw:
            results.append(HotelResult(
                name=item["property_name"],
                price_per_night=float(item["price"]),
                stars=int(item["stars"]),
            ))
        return results

    def circuit_status(self) -> dict:
        return self.circuit_breaker.status()
