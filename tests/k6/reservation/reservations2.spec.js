jest.mock("axios");

const axios = require('axios');
const apiService = require('./routes/api');
const matchesRoute = require("./routes/matches");
const mockReservationsApiStub = require('./reservations.api.stub.json');

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// {
//   "email": "email",
//   "matchNumber": 1,
//   "tickets": {"category": 1, "quantity": 1, "price": 75},
//   "card": {"number": "4242424242424242", "expirationMonth": 12, "expirationYear": 2024, "cvc": "123"}
//  }

describe('Matches API', () => {
  test('api', async () => {
    axios.get.mockResolvedValueOnce(mockReservationsApiStub);
    const reservation = { email: 'email', matchNumber: 1, tickets: {category: 1, quantity: 1, price: 75 }
  , card: {number: "4242424242424242", expirationMonth: 12, expirationYear: 2024, cvc: "123"}};
    const results = await axios.get(reservation);
    expect(results).toEqual(mockReservationsApiStub.data);
  });
});