jest.mock("axios");
const axios = require('axios');
const matchesService = require('./matches.service');
const mockMatchesApiStub = require('./matches.api.stub.json');
const mockReservationApiStub = require('./reservation.api.stub.json');

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

describe('MATCHES API GET', () => {
  test('Matches', async () => {
    axios.get.mockResolvedValueOnce(mockMatchesApiStub);
    const results = await matchesService.getMatches();
    expect(results).toEqual(mockMatchesApiStub.data);
  });
});

describe('MATCHES API PATCH', () => {
  test('Patch matches', async () => {
    axios.patch.mockResolvedValueOnce(mockMatchesApiStub);
    const results = await matchesService.patchMatches();
    expect(results).toEqual(mockMatchesApiStub.data);
  });
});

//Includes all (including payments)
describe('RESERVATIONS API POST', () => {
  test('Post reservation', async () => {
    axios.post.mockResolvedValueOnce(mockReservationApiStub);
    const results = await matchesService.postReservation();
    expect(results).toEqual(mockReservationApiStub.data);
  });

  test('async test', async () => {
  const asyncMock = jest.fn()
  .mockResolvedValue ('default')
  .mockResolvedValueOnce ('first call')
  .mockResolvedValueOnce ('second call')

  await asyncMock();
  await asyncMock();
  await asyncMock();
  await asyncMock();

})

});

