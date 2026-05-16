from dataclasses import dataclass

@dataclass
class HotelResult:
    """Internal model - completely decoupled from any external API format."""
    name: str
    price_per_night: float
    stars: int

    def to_dict(self):
        return {
            "name": self.name,
            "price_per_night": self.price_per_night,
            "stars": self.stars,
        }
