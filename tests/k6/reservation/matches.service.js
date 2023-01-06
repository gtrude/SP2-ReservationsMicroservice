const api = require('axios');

const MATCHES_API = 'https://reservations-microservice.onrender.com/api/matches?matchNumber=1';

async function getMatches() {
  return api.get(MATCHES_API)
    .then(({ data }) => data)
    .catch((e) => null);
}

async function patchMatches() {
    return api.patch('https://reservations-microservice.onrender.com/api/matches?matchNumber=5&categoryNumber=2&count=20')
      .then(({ data }) => data)
      .catch((e) => null);
  }

async function postReservation() {
    return api.post('https://reservations-microservice.onrender.com/api/v1/reservation',
    {
        email: "email",
          matchNumber: 1,
          tickets: {category: 1, quantity: 1, price: 75},
          card: {number: "4242424242424242", expirationMonth: 12, expirationYear: 2024, cvc: "123"}
    })
      .then(({ data }) => data)
      .catch((e) => null);
  }

module.exports = {
  getMatches,
  patchMatches,
  postReservation
};