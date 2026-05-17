const { HotelResult } = require('./models');

const CLOSED    = 'CLOSED';
const OPEN      = 'OPEN';
const HALF_OPEN = 'HALF_OPEN';

class CircuitBreaker {
  constructor(failureThreshold = 3, recoveryTimeoutS = 15) {
    this.failureThreshold  = failureThreshold;
    this.recoveryTimeoutMs = recoveryTimeoutS * 1000;
    this.state             = CLOSED;
    this.failureCount      = 0;
    this.lastFailureTime   = 0;
  }

  recordSuccess() {
    if (this.state !== CLOSED) console.info('[CircuitBreaker] → CLOSED (recovered)');
    this.failureCount = 0;
    this.state = CLOSED;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      if (this.state !== OPEN)
        console.warn(`[CircuitBreaker] → OPEN after ${this.failureCount} failures`);
      this.state = OPEN;
    }
  }

  allowRequest() {
    if (this.state === CLOSED) return true;
    if (this.state === OPEN) {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeoutMs) {
        console.info('[CircuitBreaker] → HALF_OPEN (probing...)');
        this.state = HALF_OPEN;
        return true;
      }
      return false;
    }
    // HALF_OPEN: block further requests until the probe resolves
    return false;
  }

  status() {
    return {
      state:              this.state,
      failures:           this.failureCount,
      threshold:          this.failureThreshold,
      recovery_timeout_s: this.recoveryTimeoutMs / 1000,
    };
  }
}

class BookingComAdapter {
  static MAX_RETRIES    = 3;
  static TIMEOUT_MS     = 3000;
  static BACKOFF_BASE   = 1000;

  constructor(baseUrl) {
    this.baseUrl        = baseUrl.replace(/\/$/, '');
    this.circuitBreaker = new CircuitBreaker(3, 15);
  }

  async searchHotels(city) {
    if (!this.circuitBreaker.allowRequest()) {
      console.error('[BookingComAdapter] Circuit OPEN — request blocked');
      throw new Error('Circuit breaker is OPEN — external service unavailable');
    }

    let lastError;
    for (let attempt = 1; attempt <= BookingComAdapter.MAX_RETRIES; attempt++) {
      try {
        console.info(`[BookingComAdapter] Attempt ${attempt}/${BookingComAdapter.MAX_RETRIES} for city=${city}`);
        const raw = await this._fetch(city);
        this.circuitBreaker.recordSuccess();
        return this._translate(raw);
      } catch (err) {
        lastError = err;
        this.circuitBreaker.recordFailure();
        console.warn(`[BookingComAdapter] Attempt ${attempt} failed: ${err.message}`);
        if (attempt < BookingComAdapter.MAX_RETRIES) {
          const backoff = BookingComAdapter.BACKOFF_BASE * (2 ** (attempt - 1));
          console.info(`[BookingComAdapter] Retrying in ${backoff / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    throw new Error(`All ${BookingComAdapter.MAX_RETRIES} attempts failed for city=${city}: ${lastError.message}`);
  }

  async _fetch(city) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BookingComAdapter.TIMEOUT_MS);
    try {
      const url = new URL(`${this.baseUrl}/hotels`);
      url.searchParams.set('city', city);
      const resp = await fetch(url.toString(), { signal: controller.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Request timed out');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  _translate(raw) {
    return raw.map(item => new HotelResult(
      item.property_name,
      parseFloat(item.price),
      parseInt(item.stars, 10),
    ));
  }

  circuitStatus() {
    return this.circuitBreaker.status();
  }
}

module.exports = { BookingComAdapter };
