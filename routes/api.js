const { v4 } = require('uuid');
const db = require('../connectors/postgres');
const { sendKafkaMessage } = require('../connectors/kafka');
const { validateTicketReservationDto } = require('../validation/reservation');
const messagesType = require('../constants/messages');
const router = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const axios = require('axios');
const { json } = require('express');

module.exports = (app) => {
  // Register HTTP endpoint to create new user
  app.post('/api/v1/reservation', async (req, res) => {
    // validate payload before proceeding with reservations
    const validationError = validateTicketReservationDto(req.body);
    const categoryNumber = req.body.tickets[0].category;
    const matchNumber = req.body.matchNumber;
    let purschaseQuantity = req.body.tickets[0].quantity;
    console.log(purschaseQuantity)
    console.log(req.body.tickets.length)
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

    // TODO: Perform Stripe Payment Flow
    router.post("/payment", (req, res) => {
      stripe.charges.create(
        {
          source: req.body.tokenId,
          amount: req.body.amount,
          currency: "egp",
        },
        (stripeErr, stripeRes) => {
          if (stripeErr) {
            res.status(500).json(stripeErr);
          } else {
            res.status(200).json(stripeRes);
          }
        }
      );
    });
    // TODO: Update master list to reflect ticket sale
    for (let i = 0; i < req.body.tickets.length; i++){
    axios.get(`http://localhost:8080/api/matches?matchNumber=${matchNumber}`).then( res => {
    let count = 0
    if(req.body.tickets[i].category == 1){
       count = JSON.stringify(res.data[0].availability.category1.count)
       console.log(count)
       axios.patch(`http://localhost:8080/api/matches?matchNumber=${matchNumber}&categoryNumber=${req.body.tickets[i].category}&count=${count - req.body.tickets[i].quantity}`)
      }
      else if(req.body.tickets[i].category == 2){
       count = JSON.stringify(res.data[0].availability.category2.count)
       axios.patch(`http://localhost:8080/api/matches?matchNumber=${matchNumber}&categoryNumber=${req.body.tickets[i].category}&count=${count - req.body.tickets[i].quantity}`)
      }
      else if(req.body.tickets[i].category == 3){
       count = JSON.stringify(res.data[0].availability.category3.count)
       axios.patch(`http://localhost:8080/api/matches?matchNumber=${matchNumber}&categoryNumber=${req.body.tickets[i].category}&count=${count - req.body.tickets[i].quantity}`)
        }
    })
    .catch(err => {
      console.log(err)
    })
  }
    // Persist ticket sale in database with a generated reference id so user can lookup ticket
    const ticketReservation = { id: v4(), ...req.body };
    // const reservation = await db('reservations').insert(ticketReservation).returning('*');

    // Send message indicating ticket sale is final
    await sendKafkaMessage(messagesType.TICKET_RESERVED, {
      meta: { action: messagesType.TICKET_RESERVED},
      body: { 
        matchNumber: req.body.matchNumber,
        tickets: req.body.tickets,
      }
    });

    // Return success response to client
    return res.json({
      message: 'Ticket Purchase Successful',
      ...ticketReservation,
    });
  });
};