class HotelResult {
  constructor(name, pricePerNight, stars) {
    this.name = name;
    this.pricePerNight = pricePerNight;
    this.stars = stars;
  }

  toDict() {
    return {
      name: this.name,
      price_per_night: this.pricePerNight,
      stars: this.stars,
    };
  }
}

module.exports = { HotelResult };
