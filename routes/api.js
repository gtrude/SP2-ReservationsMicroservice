require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_KEY);
const { v4 } = require('uuid');
const db = require('../connectors/postgres');
const { sendKafkaMessage } = require('../connectors/kafka');
const { validateTicketReservationDto } = require('../validation/reservation');
const messagesType = require('../constants/messages');
const axios = require('axios'); 

module.exports = (app) => {
  // HTTP endpoint to test health performance of service
  app.get('/api/v1/health', async (req, res) => {
    return res.send('Service Health');
  });

  // HTTP endpoint to create new user
  app.post('/api/v1/reservation', async (req, res) => {
    try {
      // validate payload before proceeding with reservations
      const validationError = validateTicketReservationDto(req.body);
      if (validationError) {
        return res.status(403).send(validationError.message);
      }
      // Send message indicating ticket is pending checkout
      // so shop consumers can process message and call
      // sp-shop-api to decrement available ticket count
      await sendKafkaMessage(messagesType.TICKET_PENDING, {
        meta: { action: messagesType.TICKET_PENDING},
        body: { 
          matchNumber: req.body.matchNumber,
          tickets: req.body.tickets,
        }
      });
  
      // Perform Stripe Payment Flow
      try {
        const token = await stripe.tokens.create({
          email: req.body.email,
          card: {
            number: req.body.card.number,
            exp_month: req.body.card.expirationMonth,
            exp_year: req.body.card.expirationYear,
            cvc: req.body.card.cvc,
          },
        });
        console.log(token.email)
        await stripe.charges.create({
          amount: req.body.tickets.quantity * req.body.tickets.price * 100,
          currency: 'usd',
          source: token.id,
          description: 'FIFA World Cup Ticket Reservation',
        });
        await sendKafkaMessage(messagesType.TICKET_RESERVED, {
          meta: { action: messagesType.TICKET_RESERVED},
          body: { 
            matchNumber: req.body.matchNumber,
            tickets: req.body.tickets,
          }
        });
      } catch (stripeError) {
        // Send cancellation message indicating ticket sale failed
        await sendKafkaMessage(messagesType.TICKET_CANCELLED, {
          meta: { action: messagesType.TICKET_CANCELLED},
          body: { 
            matchNumber: req.body.matchNumber,
            tickets: req.body.tickets,
          }
        });
        return res.status(400).send(`could not process payment: ${stripeError.message}`);
      }
      // TODO: Update master list to reflect ticket sale
      axios.get(`http://localhost:8080/api/matches?matchNumber=${req.body.matchNumber}`).then( res => {
      let count = 0
      if(req.body.tickets.category == 1){
         count = JSON.stringify(res.data[0].availability.category1.count)
         console.log(count)
         axios.patch(`http://localhost:8080/api/matches?matchNumber=${req.body.matchNumber}&categoryNumber=${req.body.tickets.category}&count=${count - req.body.tickets.quantity}`)
        }
        else if(req.body.tickets.category == 2){
         count = JSON.stringify(res.data[0].availability.category2.count)
         axios.patch(`http://localhost:8080/api/matches?matchNumber=${req.body.matchNumber}&categoryNumber=${req.body.tickets.category}&count=${count - req.body.tickets.quantity}`)
        }
        else if(req.body.tickets.category == 3){
         count = JSON.stringify(res.data[0].availability.category3.count)
         axios.patch(`http://localhost:8080/api/matches?matchNumber=${req.body.matchNumber}&categoryNumber=${req.body.tickets.category}&count=${count - req.body.tickets.quantity}`)
          }
      })
      .catch(err => {
        console.log(err)
      })
      // Persist ticket sale in database with a generated reference id so user can lookup ticket
      const ticketReservation = { id: v4(), ...req.body };
      // const reservation = await db('reservations').insert(ticketReservation).returning('*');
  
      // Return success response to client
      return res.json({
        message: 'Ticket Purchase Successful',
        ...ticketReservation,
      });
    } catch (e) {
      return res.status(400).send(e.message);
    }
  });
};
