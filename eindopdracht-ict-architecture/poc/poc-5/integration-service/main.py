"""
External Integration Service — facade + HTTP API

This is the only interface other modules in the monolith would use.
In a modular monolith this would be a class boundary; here we expose
it as an HTTP API so it can run as a separate container in the POC.
"""

import logging
import os
from flask import Flask, jsonify, request
from adapters import BookingComAdapter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

HOTEL_API_URL = os.environ.get("HOTEL_API_URL", "http://mock-hotel-api:3000")
adapter = BookingComAdapter(base_url=HOTEL_API_URL)



def search_hotels(city: str) -> list[dict]:
    """
    The method other modules call. Returns internal HotelResult objects.
    No external API details leak past this point.
    """
    results = adapter.search_hotels(city)
    return [r.to_dict() for r in results]


# ── HTTP endpoints (for POC demonstration only) ───────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok", "hotel_api": HOTEL_API_URL})


@app.get("/hotels")
def hotels():
    city = request.args.get("city", "rome")
    try:
        results = search_hotels(city)
        return jsonify({
            "city":    city,
            "count":   len(results),
            "hotels":  results,
            "circuit": adapter.circuit_status(),
        })
    except RuntimeError as exc:
        return jsonify({
            "error":   str(exc),
            "circuit": adapter.circuit_status(),
        }), 503


@app.get("/circuit")
def circuit():
    """Inspect circuit breaker state at any time."""
    return jsonify(adapter.circuit_status())


if __name__ == "__main__":
    logger.info(f"Integration service starting — hotel API at {HOTEL_API_URL}")
    app.run(host="0.0.0.0", port=5000, debug=False)
